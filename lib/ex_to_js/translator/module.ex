defmodule ExToJS.Translator.Module do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator


  def make_module(_module_name_list, nil) do
    Builder.program([])
  end

  def make_module(module_name_list, body) do
    parsed_body = Translator.translate(body)

    {imports, body} = cond do
      !is_list(parsed_body) ->
        {[], [parsed_body]}
      true ->
        Enum.partition(parsed_body.body, fn(x) -> x.type == "ImportDeclaration" end)
    end

    body = Enum.map(body, fn(x) ->
      case x do
        %ESTree.ClassBody{} ->
          Builder.export_declaration(
            Builder.class_declaration(
              Builder.identifier(List.last(module_name_list)),
              x
            )
          )

        _ ->
          x          
      end
    end)

    if length(body) == 1 and hd(body).type == "BlockStatement" do
      body = hd(body).body
    end

    {body, functionDict} = Enum.map_reduce(body, HashDict.new(), fn(x, acc) ->
      case x do
        %ESTree.FunctionDeclaration{} ->
          name = x.id.name
          acc = if HashDict.has_key?(acc, name) do
            current_state = HashDict.get(acc, name)
            new_state = %{current_state | functions: current_state.functions ++ [x]}
            HashDict.put(acc, name, new_state)
          else
            HashDict.put(acc, name, %{name: name, access: :private, functions: [x]})
          end

          {x, acc}
        %ESTree.ExportDeclaration{ declaration: %ESTree.FunctionDeclaration{} = declaration } ->
          x = declaration
          name = x.id.name
          acc = if HashDict.has_key?(acc, name) do
            current_state = HashDict.get(acc, name)
            new_state = %{current_state | functions: current_state.functions ++ [x]}
            HashDict.put(acc, name, new_state)
          else
            HashDict.put(acc, name, %{name: name, access: :export, functions: [x]})
          end

          {x, acc}
        _ ->
          {x, acc}
      end
    end)

    final_functions = Enum.flat_map(functionDict, fn({_name, data})-> process_function_arity(data) end)

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

    Builder.program(imports ++ body ++ final_functions)
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
      name = String.to_atom("#{x.id.name}__#{length(x.params)}")
      arity = length(x.params)
      { %ESTree.FunctionDeclaration{ x | id: Builder.identifier(name)}, name, arity }
    end)
    |> Enum.sort(fn({_,_, arityOne}, {_,_,arityTwo})-> arityOne < arityTwo end)

    last_function_index = length(processed_functions) - 1

    { case_statements, _} = Enum.map_reduce(processed_functions, 0, fn({_function, name, arity}, acc) -> 
      
      switch_case = if acc == last_function_index do
        Builder.switch_case(
          nil,
          [Builder.return_statement(Translator.translate(quote do: unquote(name).apply(nil, args)))]
        )
      else
        Builder.switch_case(
          Translator.translate(quote do: unquote(arity)),
          [Builder.return_statement(Translator.translate(quote do: unquote(name).apply(nil, args.slice(0, unquote(arity) - 1))))]
        )
      end

      {switch_case, acc + 1}
    end)

    switch_statement = Builder.switch_statement(
      Translator.translate(quote do: length(:args)),
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

end