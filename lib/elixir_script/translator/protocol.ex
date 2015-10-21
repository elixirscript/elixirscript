defmodule ElixirScript.Translator.Protocol do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Module
  alias ElixirScript.Preprocess.Aliases
  alias ElixirScript.Translator.JSModule
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils

  def consolidate(protocols, env) when is_list(protocols) do
    Enum.map(protocols, fn({_, protocol}) ->
      do_consolidate(protocol, env)
    end)
  end

  defp do_consolidate(protocol, env) do
    name = protocol.name
    spec = protocol.spec
    impls = protocol.impls |> Dict.to_list

    {spec_imports, spec_body, spec} = define_spec(name, spec, env)
    {impl_imports, impl_body, impls} = define_impls(name, impls, env)

    body = spec_body ++ impl_body
    imports = spec_imports ++ impl_imports

    create_module(name, spec, impls, imports, body, env)
  end

  defp define_spec(name, spec, env) do

    { body, aliases } = Aliases.process(spec, env)

    { body, functions } = extract_function_from_spec(body)

    { exported_functions, private_functions } = process_functions(functions, env)

    body = Module.translate_body(body, env)

    {imports, body} = Module.extract_imports_from_body(body)

    imports = Module.process_imports(imports, aliases)
    imports = imports.imports

    object = Enum.map(exported_functions, fn({key, value}) -> 
      Map.make_property(JS.identifier(Utils.filter_name(key)), value) 
    end)
    |> JS.object_expression

    declarator = JS.variable_declarator(
      JS.identifier(List.last(name)),
      JS.call_expression(
        JS.member_expression(
          JS.identifier(:Elixir),
          JS.member_expression(
            JS.identifier(:Kernel),
            JS.identifier(:defprotocol)
          )
        ),
        [object]
      )
    )

    {imports, body, [JS.variable_declaration([declarator], :let)]}
  end

  defp define_impls(_, [], _) do
    { [], [], [] }
  end

  defp define_impls(name, impls, env) do
    Enum.map(impls, fn({type, impl}) ->
      type = map_to_js(type)
      { body, aliases } = Aliases.process(impl, env)
      { body, functions } = Module.extract_functions_from_module(body)
      { exported_functions, private_functions } = process_functions(functions, env)

      body = Module.translate_body(body, env)

      {imports, body} = Module.extract_imports_from_body(body)

      imports = Module.process_imports(imports, aliases)
      imports = imports.imports

      object = Enum.map(exported_functions, fn({key, value}) -> 
        Map.make_property(JS.identifier(Utils.filter_name(key)), value) 
      end)
      |> JS.object_expression

      impl = JS.call_expression(
        JS.member_expression(
          JS.identifier(:Elixir),
          JS.member_expression(
            JS.identifier(:Kernel),
            JS.identifier(:defimpl)
          )
        ),
        [JS.identifier(List.last(name)), type, object]
      )

      {imports, body, [impl]}

    end)
    |> Enum.reduce({[], [], []}, fn({impl_imports, impl_body, impl}, acc) ->
      { 
        elem(acc, 0) ++ impl_imports,
        elem(acc, 1) ++ impl_body,
        elem(acc, 2) ++ impl
      }
    end)
  end

  defp create_module(name, spec, impls, imports, body, env) do
    default = JS.export_default_declaration(JS.identifier(List.last(name)))

    %JSModule{
      name: name,
      body: imports ++ List.wrap(Module.create__module__(name, env)) ++ body ++ spec ++ impls ++ [default]
    }
  end

  defp extract_function_from_spec({:__block__, meta, body_list}) do
    { body_list, functions } = Enum.map_reduce(body_list,
      %{exported: HashDict.new(), private: HashDict.new()}, fn
        ({:def, _, [{name, _, _}]} = function, state) ->
          {
            nil,
            %{ state | exported: HashDict.put(state.exported, name, HashDict.get(state.exported, name, []) ++ [function]) }
          }          
        (x, state) ->
          { x, state }
      end)

    body_list = Enum.filter(body_list, fn(x) -> !is_nil(x) end)
    body = {:__block__, meta, body_list}

    { body, functions }
  end

  defp process_functions(%{ exported: exported, private: private }, env) do
    exported_functions = Enum.map(Dict.keys(exported), fn(key) ->
      functions = Dict.get(exported, key)
      { key, Function.make_anonymous_function(functions, env) }
    end)

    private_functions = Enum.map(Dict.keys(private), fn(key) ->
      functions = Dict.get(private, key)
      { key, Function.make_anonymous_function(functions, env) }
    end)

    { exported_functions, private_functions }
  end


  @doc """
    Used to map Protocol types from Elixir to
    a function used by the protocol implementation
    in JavaScript
  """
  defp map_to_js({:__aliases__, _, [:Integer]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_integer)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:Tuple]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_tuple)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:Atom]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_atom)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:List]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_list)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:BitString]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_bitstring)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:Float]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_float)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:Function]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_function)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:PID]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_pid)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:Port]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_port)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:Reference]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_reference)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:Map]}) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.member_expression(
        JS.identifier(:Kernel),
        JS.identifier(:is_map)
      )
    )
  end

  defp map_to_js({:__aliases__, _, [:Any]}) do
    quoted = quote do
      nil
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end


  defp map_to_js({:__aliases__, _, struct}) do
    module_name = Enum.map(struct, &Atom.to_string(&1))
    |> Enum.join(".")
    |> String.to_atom

    quoted = quote do
      Kernel.is_struct_fn(unquote(module_name))
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

end