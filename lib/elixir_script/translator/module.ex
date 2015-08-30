defmodule ElixirScript.Translator.Module do
  @moduledoc false
  require Logger
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.JSModule
  alias ElixirScript.Preprocess.Aliases
  alias ElixirScript.Translator.Function

  @standard_libs [
    {:Erlang, from: "__lib/erlang" },
    {:Atom, from: "__lib/atom" },
    {:BitString, from: "__lib/bit_string" },
    {:Enum, from: "__lib/enum" },
    {:Integer, from: "__lib/integer" },
    {:Kernel, from: "__lib/kernel" },
    {:List, from: "__lib/list" },
    {:Logger, from: "__lib/logger" },
    {:Mutable, from: "__lib/mutable" },
    {:Range, from: "__lib/range" },
    {:Tuple, from: "__lib/tuple" },
    {:fun, from: "__lib/funcy/fun" },
  ]

  def make_module(module_name_list, nil) do
    [%JSModule{ name: module_name_list, body: List.wrap(create__module__(module_name_list)) }] 
  end

  def make_module(module_name_list, body) do

    body = make_inner_module_aliases(module_name_list, body)

    { body, aliases, used_stdlibs } = Aliases.process(body)

    { body, functions } = extract_functions_from_module(body)
    { exported_functions, private_functions } = process_functions(functions)

    #Translate body
    body = Translator.translate(body)

    body = case body do
      [%ESTree.BlockStatement{ body: body }] ->
        body
      %ESTree.BlockStatement{ body: body } ->
        body
      _ ->
        List.wrap(body)
    end

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
        JS.property(JS.identifier(key), JS.identifier(key))
      end)
    )

    exported_functions = Enum.map(exported_functions, fn({_key, value}) -> value end)
    private_functions = Enum.map(private_functions, fn({_key, value}) -> value end)

    default = JS.export_default_declaration(exported_object)
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
        body: imports ++ List.wrap(create__module__(module_name_list)) ++ structs ++ private_functions ++ exported_functions ++ body ++ [default],
        stdlibs: used_stdlibs |> HashSet.to_list
      }
    ] ++ List.flatten(modules)
    
    result
  end

  defp make_inner_module_aliases(module_name_list, body) do
    case body do
      {:__block__, meta2, list2} ->
        list2 = Enum.map(list2, fn(x) ->
          case x do
            {:defmodule, meta1, [{:__aliases__, meta2, module_name_list2}, [do: body2]]} ->
              [
                {:defmodule, meta1, [{:__aliases__, meta2, module_name_list ++ module_name_list2}, [do: body2]]},
                {:alias, meta1, [{:__aliases__, [alias: false], module_name_list ++ module_name_list2}]}
              ]    
            _ ->
              x
          end
        end)
        |> List.flatten

        {:__block__, meta2, list2}
      {:defmodule, meta1, [{:__aliases__, meta2, module_name_list2}, [do: body2]]} ->
        {:__block__, meta2, [
            {:defmodule, meta1, [{:__aliases__, meta2, module_name_list ++ module_name_list2}, [do: body2]]},
            {:alias, meta1, [{:__aliases__, [alias: false], module_name_list ++ module_name_list2}]}
          ]
        }
      _ ->
        body 
    end
  end

  defp extract_functions_from_module({:__block__, meta, body_list}) do
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

  defp extract_functions_from_module(body) do
    extract_functions_from_module({:__block__, [], List.wrap(body)})
  end

  defp extract_imports_from_body(body) do
    Enum.partition(body, fn(x) ->
      case x do
        %ESTree.ImportDeclaration{} ->
          true
        _ ->
          false
      end
    end)
  end

  defp extract_structs_from_body(body) do
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
        [JS.property(JS.identifier(:defstruct), JS.identifier(:defstruct))]
      %ESTree.FunctionDeclaration{id: %ESTree.Identifier{name: :defexception}} ->
        [JS.property(JS.identifier(:defexception), JS.identifier(:defexception))]    
    end
  end

  defp process_imports(imports, aliases) do
    imports ++ make_imports(aliases)
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

  defp process_functions(%{ exported: exported, private: private }) do
    exported_functions = Enum.map(Dict.keys(exported), fn(key) ->
      functions = Dict.get(exported, key)
      { key, Function.process_function(key, functions) }
    end)

    private_functions = Enum.map(Dict.keys(private), fn(key) ->
      functions = Dict.get(private, key)
      { key, Function.process_function(key, functions) }
    end)

    { exported_functions, private_functions }
  end

  def make_attribute(name, value) do
    declarator = JS.variable_declarator(
      JS.identifier(name),
      ElixirScript.Translator.translate(value)
    )

    JS.variable_declaration([declarator], :const)
  end

  defp create__module__(module_name_list) do
    declarator = JS.variable_declarator(
      JS.identifier(:__MODULE__),
      ElixirScript.Translator.translate(List.last(module_name_list))
    )

    JS.variable_declaration([declarator], :const)
  end

  def make_imports(enum) do
    Enum.map(enum, fn(x) ->
      ElixirScript.Translator.Import.make_alias_import({ nil, nil, x }, [])
    end)
  end

  @doc """
  Takes the given list of used_standard_libs which represent
  the standard libs used in a module and creates import statements
  for them
  """
  def create_standard_lib_imports(used_standard_libs, root) do
    Enum.filter_map(@standard_libs,
      fn({ name, _ }) -> name in used_standard_libs or name in [:JS, :SpecialForms]  end,
      fn({ name, options }) ->
        options = update_options(options, root)
        case name do
          n when n in [:JS, :SpecialForms] ->
            ElixirScript.Translator.Import.make_alias_import({ nil, nil, [:Kernel] }, options)    
          _ ->
            ElixirScript.Translator.Import.make_alias_import({ nil, nil, [name] }, options) 
        end
    end)
  end


  defp update_options(options, nil) do
    options
  end

  defp update_options(options, root) do
    [from: root <> "/" <> options[:from]]
  end

end
