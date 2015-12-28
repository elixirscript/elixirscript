defmodule ElixirScript.Translator.Protocol do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Module
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils

  @doc """
  Takes a protocol and turns them into modules
  """
  def consolidate(protocol, env) do
    name = protocol.name
    spec = protocol.spec
    impls = protocol.impls |> Dict.to_list

    {spec_imports, spec_body, spec} = define_spec(name, spec, env)
    {impl_imports, impl_body, impls} = define_impls(name, impls, env)

    body = spec_body ++ impl_body
    imports = Enum.uniq(spec_imports ++ impl_imports)

    create_module(name, spec, impls, imports, body, env)
  end

  defp define_spec(name, spec, env) do
    { body, functions } = extract_function_from_spec(spec)
    { body, env } = Module.translate_body(body, env)
    { exported_functions, _ } = process_functions(functions, env)

    module_refs = ElixirScript.Translator.State.get_module_references(name)

    {imports, body} = Module.extract_imports_from_body(body)

    imports = imports ++ Module.make_std_lib_import() ++ Module.make_imports(module_refs)

    object = Enum.map(exported_functions, fn({key, value}) ->
      Map.make_property(JS.identifier(Utils.filter_name(key)), value)
    end)
    |> JS.object_expression

    declarator = JS.variable_declarator(
      JS.identifier(Utils.name_to_js_name(name)),
      JS.call_expression(
        JS.member_expression(
          JS.identifier(:Elixir),
          JS.member_expression(
            JS.identifier(:Core),
            JS.member_expression(
              JS.identifier(:Functions),
              JS.identifier(:defprotocol)
            )
          )
        ),
        [object]
      )
    )

    {imports, body, [JS.variable_declaration([declarator], :const)]}
  end

  defp define_impls(_, [], _) do
    { [], [], [] }
  end

  defp define_impls(name, impls, env) do
    Enum.map(impls, fn({type, impl}) ->
      type = map_to_js(type, env)
      { body, functions } = Module.extract_functions_from_module(impl)
      { body, env } = Module.translate_body(body, env)

      { exported_functions, _ } = process_functions(functions, env)

      module_refs = ElixirScript.Translator.State.get_module_references(name)

      {imports, body} = Module.extract_imports_from_body(body)

      imports = imports ++ Module.make_std_lib_import() ++ Module.make_imports(module_refs)

      object = Enum.map(exported_functions, fn({key, value}) ->
        Map.make_property(JS.identifier(Utils.filter_name(key)), value)
      end)
      |> JS.object_expression

      impl = JS.call_expression(
        JS.member_expression(
          JS.identifier(:Elixir),
          JS.member_expression(
            JS.identifier(:Core),
            JS.member_expression(
              JS.identifier(:Functions),
              JS.identifier(:defimpl)
            )
          )
        ),
        [JS.identifier(Utils.name_to_js_name(name)), type, object]
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

  defp create_module(name, spec, impls, imports, body, _) do
    default = JS.export_default_declaration(JS.identifier(Utils.name_to_js_name(name)))

    %{
      name: name,
      body: imports ++ body ++ spec ++ impls ++ [default]
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

      { functions, _ } = Function.make_anonymous_function(functions, env)

      { key, functions }
    end)

    private_functions = Enum.map(Dict.keys(private), fn(key) ->
      functions = Dict.get(private, key)
      { functions, _ } = Function.make_anonymous_function(functions, env)

      { key, functions }
    end)

    { exported_functions, private_functions }
  end

  defp map_to_js({:__aliases__, _, [:Integer]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:Integer)
    )
  end

  defp map_to_js({:__aliases__, _, [:Tuple]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:Tuple)
    )
  end

  defp map_to_js({:__aliases__, _, [:Atom]}, _) do
    JS.identifier(:Symbol)
  end

  defp map_to_js({:__aliases__, _, [:List]}, _) do
    JS.identifier(:Array)
  end

  defp map_to_js({:__aliases__, _, [:BitString]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:BitString)
    )
  end

  defp map_to_js({:__aliases__, _, [:Float]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:Float)
    )
  end

  defp map_to_js({:__aliases__, _, [:Function]}, _) do
    JS.identifier(:Function)
  end

  defp map_to_js({:__aliases__, _, [:PID]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:PID)
    )
  end

  defp map_to_js({:__aliases__, _, [:Port]}, _) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.identifier(:Port)
    )
  end

  defp map_to_js({:__aliases__, _, [:Reference]}, _) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.identifier(:Reference)
    )
  end

  defp map_to_js({:__aliases__, _, [:Map]}, _) do
    JS.identifier(:Object)
  end

  defp map_to_js({:__aliases__, _, [:Any]}, _) do
    JS.identifier(:null)
  end


  defp map_to_js({:__aliases__, _, _} = module, env) do
    ElixirScript.Translator.Struct.get_struct_class(
      module,
      env
    )
  end

end
