defmodule ElixirScript.Translator.Module do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Function
  alias ElixirScript.ModuleSystems.{ES6,Common}

  def make_module(ElixirScript.Temp, body, env) do
    { body, _ } = translate_body(body, env)
    %{ name: ElixirScript.Temp, body: body |> Utils.inflate_groups }
  end

  def make_module(module, nil, _) do
    %{ name: module, body: [] }
  end

  def make_module(module, body, env) do
    body = process_use(body)
    { body, functions } = extract_functions_from_module(body)
    { body, env } = translate_body(body, env)

    { exported_functions, private_functions } = process_functions(functions, env)

    module_refs = ElixirScript.Translator.State.get_module_references(module) -- [env.module]

    {imports, body} = extract_imports_from_body(body)
    {structs, body} = extract_structs_from_body(body, env)

    imports = imports ++ make_std_lib_import() ++ make_imports(module_refs)

    #Collect all the functions so that we can process their arity
    body = Enum.map(body, fn(x) ->
      case x do
        %ESTree.CallExpression{} ->
          JS.expression_statement(x)
        _ ->
          x
      end
    end)

    body = Utils.inflate_groups(body)

    exported_object = JS.object_expression(
      make_defstruct_property(module, structs) ++
      Enum.map(exported_functions, fn({key, _value}) ->
        JS.property(JS.identifier(Utils.filter_name(key)), JS.identifier(Utils.filter_name(key)), :init, true)
      end)
    )

    exported_functions = Enum.map(exported_functions, fn({_key, value}) -> value end)
    private_functions = Enum.map(private_functions, fn({_key, value}) -> value end)

    default = Common.export_module(exported_object)

    result = %{
        name: Utils.quoted_to_name({:__aliases__, [], module }),
        body: imports ++ structs ++ private_functions ++ exported_functions ++ body ++ [default]
    }

    result
  end

  defp process_use(ast) do
    Macro.prewalk(ast, &do_process_use(&1))
  end

  defp do_process_use({:use, _, _} = ast) do
    ast
    |> Macro.expand(ElixirScript.Translator.State.get().compiler_opts.env)
    |> expand__using__
  end

  defp do_process_use(ast) do
    ast
  end

  defp expand__using__({:__block__, _, [{:require, _, _}, {{:., _, [_, :__using__]}, _, _} = using_ast]}) do
    Macro.expand_once(using_ast, ElixirScript.Translator.State.get().compiler_opts.env)
  end

  defp expand__using__({:__block__, _, [{:__block__, _, [{:require, _, _}, {{:., _, [_, :__using__]}, _, _} = using_ast]}]}) do
    Macro.expand_once(using_ast, ElixirScript.Translator.State.get().compiler_opts.env)
  end

  def translate_body(body, env) do
    { body, env } = Translator.translate(body, env)

    body = case body do
      [%ESTree.BlockStatement{ body: body }] ->
        body
      %ESTree.BlockStatement{ body: body } ->
        body
      _ ->
        List.wrap(body)
    end

    { body, env }
  end

  def extract_functions_from_module({:__block__, meta, body_list}) do
    { body_list, functions } = Enum.map_reduce(body_list,
      %{exported: HashDict.new(), private: HashDict.new()}, fn
        ({:def, _, [{:when, _, [{name, _, _} | _guards] }, _] } = function, state) ->
          {
            nil,
            %{ state | exported: HashDict.put(state.exported, name, HashDict.get(state.exported, name, []) ++ [function]) }
          }
        ({:def, _, [{name, _, _}, _]} = function, state) ->
          {
            nil,
            %{ state | exported: HashDict.put(state.exported, name, HashDict.get(state.exported, name, []) ++ [function]) }
          }
        ({:defp, _, [{:when, _, [{name, _, _} | _guards] }, _] } = function, state) ->
          {
            nil,
            %{ state | private: HashDict.put(state.private, name, HashDict.get(state.private, name, []) ++ [function]) }
          }
        ({:defp, _, [{name, _, _}, _]} = function, state) ->
          {
            nil,
            %{ state | private: HashDict.put(state.private, name, HashDict.get(state.private, name, []) ++ [function]) }
          }
        (x, state) ->
          { x, state }
      end)

    body_list = Enum.filter(body_list, fn(x) -> !is_nil(x) end)
    body = {:__block__, meta, body_list}

    { body, functions }
  end

  def extract_functions_from_module(body) do
    extract_functions_from_module({:__block__, [], List.wrap(body)})
  end

  def extract_imports_from_body(body) do
    Enum.partition(body, fn(x) ->
      case x do
        %ESTree.ImportDeclaration{} ->
          true
        _ ->
          false
      end
    end)
  end

  def extract_structs_from_body(body, env) do
    module_js_name = Utils.name_to_js_name(env.module)

    Enum.partition(body, fn(x) ->
      case x do
        %ESTree.VariableDeclaration{declarations: [%ESTree.VariableDeclarator{id: %ESTree.Identifier{name: ^module_js_name} } ] } ->
          true
        _ ->
          false
      end
    end)
  end

  defp make_defstruct_property(_, []) do
    []
  end

  defp make_defstruct_property(module_name, [the_struct]) do
    module_js_name = Utils.name_to_js_name(module_name)

    case the_struct do
      %ESTree.VariableDeclaration{declarations: [%ESTree.VariableDeclarator{id: %ESTree.Identifier{name: ^module_js_name} } ] } ->
        [JS.property(JS.identifier(module_js_name), JS.identifier(module_js_name), :init, true)]
    end
  end

  def make_std_lib_import() do
    compiler_opts = ElixirScript.Translator.State.get().compiler_opts
    case compiler_opts.import_standard_libs do
      true ->
        [Common.import_module(:Elixir, Utils.make_local_file_path(compiler_opts.core_path))]
      false ->
        []
    end
  end

  def process_functions(%{ exported: exported, private: private }, env) do
    exported_functions = Enum.map(Dict.keys(exported), fn(key) ->
      functions = Dict.get(exported, key)

      { functions, _ } = Function.process_function(key, functions, env)
      { key, functions }
    end)

    private_functions = Enum.map(Dict.keys(private), fn(key) ->
      functions = Dict.get(private, key)
      { functions, _ } = Function.process_function(key, functions, env)
      { key, functions }
    end)

    { exported_functions, private_functions }
  end

  def make_attribute(name, value, env) do
    declarator = JS.variable_declarator(
      JS.identifier(name),
      ElixirScript.Translator.translate!(value, env)
    )

    JS.variable_declaration([declarator], :const)
  end

  def make_imports(enum) do
    Enum.map(enum, fn(x) -> Common.import_module(Utils.name_to_js_name(x), Utils.make_local_file_path(Utils.name_to_js_file_name(x))) end)
  end

end
