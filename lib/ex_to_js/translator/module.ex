defmodule ExToJS.Translator.Module do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator

  def make_module(module_name_list, nil) do
    Builder.program([create__module__(module_name_list)])
  end

  def make_module(module_name_list, body) do
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
        %ESTree.ClassBody{} ->
          # We built a ClassBody for structs.
          # Here we will make it into a class declaration and then
          # export it.
          export_class = Builder.export_declaration(
            Builder.class_declaration(
              Builder.identifier(List.last(module_name_list)),
              x
            )
          )

          {export_class, acc}

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

    functions = Enum.flat_map(functions_dict, fn({_, data})-> process_function_arity(data) end)

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

    #Build everything back together again
    Builder.program([create__module__(module_name_list)] ++ imports ++ body ++ functions)
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

  defp process_function_arity(%{name: _name, access: access, functions: [function]}) do
    case access do
      :export ->
        [Builder.export_declaration(function)]
      :private ->
        [function]
    end
  end

  defp process_function_arity(%{name: name, access: access, functions: functions}) do

    processed_functions = Enum.map(functions, fn(x) ->
      arity = length(x.params)
      new_function_name = String.to_atom("#{x.id.name}__#{arity}")
      new_function = %ESTree.FunctionDeclaration{ x | id: Builder.identifier(new_function_name)}
      { new_function, new_function_name, arity }
    end)
    |> Enum.sort(fn({_,_, arityOne}, {_,_,arityTwo})-> arityOne < arityTwo end)

    last_function_index = length(processed_functions) - 1

    { case_statements, _} = Enum.map_reduce(processed_functions, 0, fn({_function, name, arity}, index) -> 
      
      switch_case = if index == last_function_index do
        function_call = Translator.translate(quote do: unquote(name).apply(nil, args))
        Builder.switch_case(
          nil, 
          [Builder.return_statement(function_call)]
        )
      else
        function_call = Translator.translate(quote do: unquote(name).apply(nil, args.slice(0, unquote(arity) - 1)))
        Builder.switch_case(
          Translator.translate(quote do: unquote(arity)),
          [Builder.return_statement(function_call)]
        )
      end

      {switch_case, index + 1}
    end)

    switch_statement = Builder.switch_statement(
      Builder.member_expression(
        Builder.identifier(:args),
        Builder.identifier(:length)
      ),
      case_statements
    )

    master_function = Builder.function_declaration(
      Builder.identifier(name),
      [],
      [],
      Builder.block_statement([switch_statement]),
      Builder.identifier(:args)
    )

    if access == :export do
      master_function = Builder.export_declaration(master_function)
    end

    Enum.map(processed_functions, fn({function, _, _}) -> function end) ++ [master_function]
  end

  defp create__module__(module_name_list) do
    module_name = Enum.map(module_name_list, fn(x) -> to_string(x) end) 
    |> Enum.join(".") 
    |> String.to_atom

    declarator = Builder.variable_declarator(
      Builder.identifier(:__MODULE__),
      ExToJS.Translator.translate(module_name)
    )

    Builder.variable_declaration([declarator], :const)
  end

  def make_attribute(name, value) do
    declarator = Builder.variable_declarator(
      Builder.identifier(name),
      ExToJS.Translator.translate(value)
    )

    Builder.variable_declaration([declarator], :const)
  end

end