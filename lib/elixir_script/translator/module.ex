defmodule ElixirScript.Translator.Module do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.JSModule

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
  ]

  def make_module(module_name_list, nil) do
    [%JSModule{ name: module_name_list, body: List.wrap(create__module__(module_name_list)) }] 
  end

  def make_module(module_name_list, body) do

    body = case body do
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

    #Translate body
    parsed_body = Translator.translate(body)

    #Partition imports from body. 
    #We will place these at the top of body later
    {imports, body} = cond do
      !is_list(parsed_body) ->
        {[], [parsed_body]}
      true ->
        Enum.partition(parsed_body.body, fn(x) -> x.type == "ImportDeclaration" end)
    end

    if length(body) == 1 and hd(body).type == "BlockStatement" do
      body = hd(body).body
    end

    #Collect all the functions so that we can process their arity
    {body, functions_dict} = Enum.map_reduce(body, HashDict.new(), fn(x, acc) ->
      case x do
        %ESTree.FunctionDeclaration{} ->
          add_function_to_dict(acc, x, :private)
        %ESTree.ExportDeclaration{ declaration: %ESTree.FunctionDeclaration{} = function } ->
          add_function_to_dict(acc, function, :export)
        %ESTree.CallExpression{} ->
          {Builder.expression_statement(x), acc}
        _ ->
          {x, acc}
      end
    end)

    body = Utils.inflate_groups(body)

    functions = Enum.flat_map(functions_dict, fn({_, data})-> process_function_arity(data) end)

    properties = Enum.filter_map(functions_dict, fn({_key, value}) -> 
      value.access == :export
    end, fn({key, _value}) -> 
      Builder.property(Builder.identifier(key), Builder.identifier(key))
    end)

    default = Builder.return_statement(
      Builder.object_expression(properties)
    )

    #Filter out original functions from the body
    body = Enum.filter(body, fn(x) -> 
      case x do 
        %ESTree.FunctionDeclaration{} ->
          false
        %ESTree.ExportDeclaration{ declaration: %ESTree.FunctionDeclaration{} } ->
          false
        _ ->
          true
      end
    end)

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
        body: imports ++ List.wrap(create__module__(module_name_list)) ++ body ++ functions ++ List.wrap(default)
      }
    ] ++ List.flatten(modules)
    
    result
  end

  defp add_function_to_dict(dict, function, access) do
    name = function.id.name
    dict = if HashDict.has_key?(dict, name) do
      current_state = HashDict.get(dict, name)
      new_state = %{current_state | functions: current_state.functions ++ [function]}
      HashDict.put(dict, name, new_state)
    else
      HashDict.put(dict, name, %{name: name, access: access, functions: [function]})
    end

    {function, dict}
  end

  defp process_function_arity(%{name: _name, access: _access, functions: [function]}) do
    [function]
  end

  defp process_function_arity(%{name: name, access: _access, functions: functions}) do

    processed_functions = Enum.map(functions, fn(x) ->
      arity = length(x.params)
      new_function_name = String.to_atom("#{x.id.name}__#{arity}")
      new_function = %ESTree.FunctionDeclaration{ x | id: Builder.identifier(new_function_name)}
      { new_function, new_function_name, arity }
    end)
    |> Enum.sort(fn({_,_, arityOne}, {_,_,arityTwo})-> arityOne < arityTwo end)

    last_function_index = length(processed_functions) - 1

    function_arity_groups = Enum.group_by(processed_functions, fn({_, _, arity}) -> arity end)

    processed_functions = Enum.map(function_arity_groups, fn({_arity, functions}) ->
      process_same_function_arity(name, functions)
    end)

    { case_statements, _} = Enum.map_reduce(processed_functions, 0, fn({_function, name, arity}, index) -> 
      
      function_call = case index == last_function_index do
        true ->
          Translator.translate(quote do: unquote(name).apply(nil, args))
        _ ->
          Translator.translate(quote do: unquote(name).apply(nil, args.slice(0, unquote(arity) + 1)))
      end

      switch_case = Builder.switch_case(
        Translator.translate(quote do: unquote(arity)), 
        [Builder.return_statement(function_call)]
      )

      {switch_case, index + 1}
    end)

    default_statement = Builder.switch_case(
      nil, 
      [
        Builder.throw_statement(
          Builder.new_expression(
            Builder.identifier("RuntimeError"),
            [
              Builder.binary_expression(
                :+,
                Builder.literal("undefined function: #{name}/"),
                Utils.make_member_expression(:args, :length)
              )
            ]
          )
        ),
        Builder.break_statement(nil)
      ]
    )

    switch_statement = Builder.switch_statement(
      Utils.make_member_expression(:args, :length),
      case_statements ++ [default_statement]
    )

    master_function = Builder.function_declaration(
      Builder.identifier(name),
      [],
      [],
      Builder.block_statement([switch_statement]),
      Builder.identifier(:args)
    )

    Enum.map(processed_functions, fn({function, _, _}) -> function end) ++ [master_function]
  end

  defp process_same_function_arity(function_name, functions) do
    function_bodies = Enum.flat_map(functions, fn({ new_function, _new_function_name, _arity }) -> 
      new_function.body.body
    end)

    { nf, new_function_name, arity } = Enum.find(functions, hd(functions), fn({ nf, _, _ }) ->
      Enum.any?(nf.params, fn(x) -> 
        case x do
          %ESTree.Identifier{name: "_ref" <> _position} ->
            false
          _ ->
            true
        end
      end) == true
    end)

    function_bodies = function_bodies ++ [
      Utils.make_throw_statement(
        "FunctionClauseError",
        "no function clause matching in #{function_name}/#{arity}"
      )
    ]

    new_function = Builder.function_declaration(
      nf.id,
      nf.params,
      nf.defaults,
      Builder.block_statement(function_bodies)
    )

    { new_function, new_function_name, arity }
  end

  def make_attribute(name, value) do
    declarator = Builder.variable_declarator(
      Builder.identifier(name),
      ElixirScript.Translator.translate(value)
    )

    Builder.variable_declaration([declarator], :const)
  end

  defp create__module__(module_name_list) do
    declarator = Builder.variable_declarator(
      Builder.identifier(:__MODULE__),
      ElixirScript.Translator.translate(List.last(module_name_list))
    )

    Builder.variable_declaration([declarator], :const)
  end

  def create_standard_lib_imports() do
    Enum.map(@standard_libs, fn({name, options}) ->
      ElixirScript.Translator.Import.make_alias_import({ nil, nil, [name] }, options)
    end)
  end

end
