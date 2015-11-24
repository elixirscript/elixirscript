defmodule ElixirScript.Translator.Module do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.JSModule
  alias ElixirScript.Preprocess.Aliases
  alias ElixirScript.Preprocess.Using
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Primitive

  def make_module([:ElixirScript, :Temp], body, env) do
    [%JSModule{ name: [:ElixirScript, :Temp], body: translate_body(body, env) |> Utils.inflate_groups }]
  end

  def make_module(module_name_list, nil, env) do
    [%JSModule{ name: module_name_list, body: List.wrap(create__module__(module_name_list, env)) }]
  end

  def make_module(module_name_list, body, env) do
    body = Using.process(body, env)
    { body, aliases } = Aliases.process(module_name_list, body, env)

    { body, functions } = extract_functions_from_module(body)
    { exported_functions, private_functions } = process_functions(functions, env)

    body = translate_body(body, env)

    {imports, body} = extract_imports_from_body(body)
    {structs, body} = extract_structs_from_body(body)


    #Add imports found from walking the ast
    #and make sure to only put one declaration per alias
    imports = process_imports(imports, aliases)
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
      make_defstruct_property(structs) ++
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
        name: module_name_list,
        body: imports ++ List.wrap(create__module__(module_name_list, env)) ++ structs ++ private_functions ++ exported_functions ++ body ++ [default]
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
        %ESTree.FunctionDeclaration{} ->
          true
        _ ->
          false
      end
    end)
  end

  defp make_defstruct_property([]) do
    []
  end

  defp make_defstruct_property([the_struct]) do
    case the_struct do
      %ESTree.FunctionDeclaration{id: %ESTree.Identifier{name: :defstruct}} ->
        [JS.property(JS.identifier(:defstruct), JS.identifier(:defstruct), :init, true )]
      %ESTree.FunctionDeclaration{id: %ESTree.Identifier{name: :defexception}} ->
        [JS.property(JS.identifier(:defexception), JS.identifier(:defexception), :init, true )]
    end
  end

  def process_imports(imports, aliases) do
    imports ++ make_imports(aliases)
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

  def create__module__(module_name_list, _) do
    module_name = Enum.map(module_name_list, &Atom.to_string(&1))
    |> Enum.join(".")
    |> String.to_atom

    declarator = JS.variable_declarator(
      JS.identifier(:__MODULE__),
      Primitive.make_atom(module_name)
    )

    JS.variable_declaration([declarator], :const)
  end

  def make_imports(enum) do
    Enum.map(enum, fn

    {as, name} ->
      name = Atom.to_string(name) |> String.split(".") |> tl |> Enum.map(fn(x) -> String.to_atom(x) end)
      as = Atom.to_string(as) |> String.split(".") |> tl |> Enum.map(fn(x) -> String.to_atom(x) end)
      ElixirScript.Translator.Import.make_alias_import({ nil, nil, name }, [as: { nil, nil, as }])
    x ->
      ElixirScript.Translator.Import.make_alias_import({ nil, nil, List.wrap(x) }, [])
    end)
  end

end
