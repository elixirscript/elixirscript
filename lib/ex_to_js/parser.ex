defmodule ExToJS.Parser do
  require Logger
  alias SpiderMonkey.Builder

  def parse(ex_ast) do
    do_parse(ex_ast)
  end

  defp do_parse(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Builder.literal(ast)
  end

  defp do_parse({:-, _, [number]}) when is_number(number) do
    Builder.unary_expression(:-, true, Builder.literal(number))
  end

  defp do_parse(ast) when is_list(ast) do
    ast
    |> Enum.map(&do_parse(&1))
    |> Builder.array_expression
  end

  defp do_parse({:{}, _, elements}) do
    elements
    |> Enum.map(&do_parse(&1))
    |> Builder.array_expression
  end

  defp do_parse(ast) when is_atom(ast) do
    Builder.call_expression(
      Builder.identifier("Symbol"), 
      [Builder.literal(Atom.to_string(ast))]
    )
  end

  defp do_parse({:=, _, [left, right]}) do
    identifiers = Tuple.to_list(left)

    if is_atom(hd(identifiers)) do
        declarator = Builder.variable_declarator(
          Builder.identifier(hd(identifiers)), 
          do_parse(right)
        )
        Builder.variable_declaration([declarator], :let)
    else
        Builder.assignment_expression(
          :=,
          Builder.array_pattern(Enum.map(identifiers, &do_parse(&1))),
          do_parse(right)
        )
    end
  end

  defp do_parse({:%{}, _params, properties}) do
    properties
    |> Enum.map(fn({x, y}) -> Builder.property(Builder.literal(x), do_parse(y)) end)
    |> Builder.object_expression
  end

  defp do_parse({:__aliases__, _params, aliases}) do
    Builder.literal(aliases)
  end

  defp do_parse({ {:., [], [{:__aliases__, _, module_name}, function_name]}, [], params }) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier(module_name),
        Builder.identifier(function_name)
      ),
      Enum.map(params, &do_parse(&1))
    )
  end

  defp do_parse({:<>, _, [left, right]}) do
    Builder.binary_expression(:+, do_parse(left),do_parse(right))
  end

  defp do_parse({operator, _, [left, right]}) when operator == :+ or operator == :- or operator == :/ or operator == :* or operator == :== do
    Builder.binary_expression(operator, do_parse(left), do_parse(right))
  end

  defp do_parse({function, _, [{def_name, _, params}, [do: body]]}) when function == :def or function == :defp do
    body = cond do
      body == nil ->
        []
      is_list(body) ->
        Enum.map(body, &do_parse(&1))
      true ->
        [do_parse(body)]
    end

    Builder.method_definition(
      Builder.identifier(def_name),
      Builder.function_expression(
        Enum.map(params, &do_parse(&1)),
        [],
        Builder.block_statement(body)
      )
    )
  end

  defp do_parse({:fn, _, [{:->, _, [params, body]}]}) do
    Builder.arrow_function_expression(
      Enum.map(params, &do_parse(&1)),
      [],
      do_parse(body)
    )
  end

  defp do_parse({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]}) do
    parsed_body = do_parse(body)
    {imports, body} = case parsed_body do
      %{ type: "Literal", value: nil } ->
        {[], Builder.literal(nil)}
      _ ->
      Enum.partition(parsed_body.body, fn(x) -> x.type == "ImportDeclaration" end)
    end

    name = Builder.identifier(Enum.map(module_name_list, fn(x) -> Atom.to_string(x) end) |> Enum.join("."))
    body = Builder.class_body(body)
    class_declaration = Builder.class_declaration(name, body)
    export_declaration = Builder.export_declaration(class_declaration)

    imports ++ [export_declaration]
  end

  defp do_parse({:alias, _, [{:__aliases__, _, name}]}) do
    import_id = List.last(name)
    source = Enum.map(name, fn(x) -> Atom.to_string(x) |> String.downcase end) |> Enum.join("/")
    source = "'#{source}'"

    import_specifier = Builder.import_specifier(Builder.identifier(import_id))
    Builder.import_declaration([import_specifier], Builder.identifier(source))
  end

 defp do_parse({:defexception, _, [[message: _message]]}) do
    Builder.literal(nil)
 end

  defp do_parse({ :__block__, _, expressions }) do
    Builder.block_statement(Enum.map(expressions, &do_parse(&1)))
  end

  defp do_parse({name, _, params}) when is_list(params) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.this_expression(),
        Builder.identifier(name)
      ),
      Enum.map(params, &do_parse(&1))
    )
  end

  defp do_parse({name, _, _}) do
    Builder.identifier(name)
  end

  defp do_parse(ast) do
    Tuple.to_list(ast)
    |> Enum.map(&do_parse(&1))
    |> Builder.array_expression
  end

  def js_ast_to_js(js_ast) do
    case System.cmd(System.cwd() <> "/escodegen", [js_ast]) do
      {js_code, 0} ->
        {:ok, js_code }
      {error, _} ->
        {:error, error}
    end
  end
end