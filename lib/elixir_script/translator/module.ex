defmodule ElixirScript.Translator.Module do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.JSModule
  alias ElixirScript.Preprocess.Using
  alias ElixirScript.Translator.Function

  def make_module(ElixirScript.Temp, body, env) do
    [%JSModule{ name: ElixirScript.Temp, body: translate_body(body, env) |> Utils.inflate_groups }]
  end

  def make_module(module, nil, _) do
    [%JSModule{ name: module, body: [] }]
  end

  def make_module(module, body, env) do
    body = Using.process(body, env)
    { body, functions } = extract_functions_from_module(body)
    { exported_functions, private_functions } = process_functions(functions, env)

    body = translate_body(body, env)

    modules_refs = ElixirScript.State.get_module_references(module)

    {imports, body} = extract_imports_from_body(body)
    {structs, body} = extract_structs_from_body(body)

    #Add imports found from walking the ast
    #and make sure to only put one declaration per alias
    imports = process_imports(imports, modules_refs)
    imports = imports.imports

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
        JS.property(JS.identifier(key), JS.identifier(key), :init, true)
      end)
    )

    exported_functions = Enum.map(exported_functions, fn({_key, value}) -> value end)
    private_functions = Enum.map(private_functions, fn({_key, value}) -> value end)

    default = JS.export_named_declaration(exported_object)
    {modules, body} = Enum.partition(body, fn(x) ->
      case x do
        %JSModule{} ->
          true
        _ ->
          false
      end
    end)

    result = [
      %JSModule{
        name: ElixirScript.Module.quoted_to_name({:__aliases__, [], module }),
        body: imports ++ structs ++ private_functions ++ exported_functions ++ body ++ [default]
      }
    ] ++ List.flatten(modules)

    result
  end

  def translate_body(body, env) do
    body = Translator.translate(body, env)

    case body do
      [%ESTree.BlockStatement{ body: body }] ->
        body
      %ESTree.BlockStatement{ body: body } ->
        body
      _ ->
        List.wrap(body)
    end
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

  def extract_structs_from_body(body) do
    Enum.partition(body, fn(x) ->
      case x do
        %ESTree.VariableDeclaration{declarations: [%ESTree.VariableDeclarator{id: %ESTree.Identifier{name: name} } ] } when name in [:defstruct, :defexception] ->
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
    case the_struct do
      %ESTree.VariableDeclaration{declarations: [%ESTree.VariableDeclarator{id: %ESTree.Identifier{name: name} } ] } when name in [:defstruct, :defexception] ->
        [JS.property(JS.identifier(ElixirScript.Module.name_to_js_name(module_name)), JS.identifier(name), :init)]
    end
  end

  def process_imports(imports, module_refs) do
    imports ++ make_imports(module_refs)
    |> Enum.into(HashSet.new)
    |> Enum.reduce(HashSet.new, fn(x, acc)->
      HashSet.put(acc, x)
    end)
    |> HashSet.to_list
    |> Enum.reduce(%{ identifiers: HashSet.new, imports: [] }, fn(x, state) ->
      case x do
        %ESTree.ImportDeclaration{ specifiers: [%ESTree.ImportSpecifier{ local: id }] } ->
          if HashSet.member?(state.identifiers, id.name) do
            state
          else
            %{ state | identifiers: HashSet.put(state.identifiers, id.name), imports: state.imports ++ [x] }
          end
        %ESTree.ImportDeclaration{ specifiers: [%ESTree.ImportDefaultSpecifier{ local: id }] } ->
          if HashSet.member?(state.identifiers, id.name) do
            state
          else
            %{ state | identifiers: HashSet.put(state.identifiers, id.name), imports: state.imports ++ [x] }
          end
        _ ->
          %{ state | imports: state.imports ++ [x] }
      end
    end)
  end

  def process_functions(%{ exported: exported, private: private }, env) do
    exported_functions = Enum.map(Dict.keys(exported), fn(key) ->
      functions = Dict.get(exported, key)
      { key, Function.process_function(key, functions, env) }
    end)

    private_functions = Enum.map(Dict.keys(private), fn(key) ->
      functions = Dict.get(private, key)
      { key, Function.process_function(key, functions, env) }
    end)

    { exported_functions, private_functions }
  end

  def make_attribute(name, value, env) do
    declarator = JS.variable_declarator(
      JS.identifier(name),
      ElixirScript.Translator.translate(value, env)
    )

    JS.variable_declaration([declarator], :const)
  end

  def make_imports(enum) do
    Enum.map(enum, fn(x) -> ElixirScript.Translator.Import.make_import(x) end)
  end

end
