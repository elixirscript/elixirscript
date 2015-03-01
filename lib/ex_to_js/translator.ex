defmodule ExToJS.Translator do
  require Logger
  alias ESTree.Builder

  def translate(ex_ast) do
    do_translation(ex_ast)
  end

  defp do_translation(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Builder.literal(ast)
  end

  defp do_translation({:-, _, [number]}) when is_number(number) do
    Builder.unary_expression(:-, true, Builder.literal(number))
  end

  defp do_translation(ast) when is_list(ast) do
    ast
    |> Enum.map(&do_translation(&1))
    |> Builder.array_expression
  end

  defp do_translation({:{}, _, elements}) do
    elements
    |> Enum.map(&do_translation(&1))
    |> Builder.array_expression
  end

  defp do_translation(ast) when is_atom(ast) do
    Builder.call_expression(
      Builder.identifier("Symbol"), 
      [Builder.literal(Atom.to_string(ast))]
    )
  end

  defp do_translation({:=, _, [left, right]}) do
    identifiers = Tuple.to_list(left)

    if is_atom(hd(identifiers)) do
        declarator = Builder.variable_declarator(
          Builder.identifier(hd(identifiers)), 
          do_translation(right)
        )
        Builder.variable_declaration([declarator], :let)
    else
        Builder.assignment_expression(
          :=,
          Builder.array_pattern(Enum.map(identifiers, &do_translation(&1))),
          do_translation(right)
        )
    end
  end

  defp do_translation({:%{}, _params, properties}) do
    properties
    |> Enum.map(fn({x, y}) -> Builder.property(Builder.literal(x), do_translation(y)) end)
    |> Builder.object_expression
  end

  defp do_translation({:__aliases__, _params, aliases}) do
    Builder.literal(aliases)
  end

  defp do_translation({ {:., [], [{:__aliases__, _, module_name}, function_name]}, [], params }) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier(module_name),
        Builder.identifier(function_name)
      ),
      Enum.map(params, &do_translation(&1))
    )
  end

  defp do_translation({:<>, _, [left, right]}) do
    Builder.binary_expression(:+, do_translation(left),do_translation(right))
  end

  defp do_translation({operator, _, [left, right]}) when operator == :+ or operator == :- or operator == :/ or operator == :* or operator == :== do
    Builder.binary_expression(operator, do_translation(left), do_translation(right))
  end

  defp do_translation({function, _, [{def_name, _, params}, [do: body]]}) when function == :def or function == :defp do
    body = cond do
      body == nil ->
        []
      is_list(body) ->
        Enum.map(body, &do_translation(&1))
      true ->
        [do_translation(body)]
    end

    function_declaration = Builder.function_declaration(
        Builder.identifier(def_name),
        Enum.map(params, &do_translation(&1)),
        [],
        Builder.block_statement(body)
      )

    case function do
      :def ->
        Builder.export_declaration(function_declaration)
      _ ->
        function_declaration
    end
  end

  defp do_translation({:fn, _, [{:->, _, [params, body]}]}) do
    Builder.arrow_function_expression(
      Enum.map(params, &do_translation(&1)),
      [],
      do_translation(body)
    )
  end

  defp do_translation(:import, _, attributes) do
    {_,_,name} = hd(attributes)

    {_,_,importees} = List.last(attributes)

    if is_list(hd(importees)) do
      importees = Enum.flat_map(importees, fn({x,y}) -> x end)
    end

    specifiers = Enum.map(importees, fn(x) ->
      Builder.import_specifier(Builder.identifier(x))
    end)

    source = Enum.map(name, fn(x) -> Atom.to_string(x) |> String.downcase end) |> Enum.join("/")
    source = "'#{source}'"

    Builder.import_declaration([specifiers], Builder.identifier(source))
  end

  defp do_translation({:defstruct, _, attributes}) when length(attributes) == 1 do
    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    params = Enum.map(attributes, fn({x,_y}) -> x end)
    defaults = Enum.map(attributes, fn({_x,y}) -> y end)

    make_class_body(params, defaults)
  end

  defp do_translation({:defstruct, _, attributes}) do
    params = Enum.map(attributes, fn(x) -> x end)
    defaults = []

    make_class_body(params, defaults)
  end

  defp make_class_body(params, defaults) do

    body = Enum.map(params, fn(x) -> 
      Builder.expression_statement(
        Builder.assignment_expression(
          :=,
          Builder.member_expression(
            Builder.this_expression(),
            Builder.identifier(x)
          ),
          Builder.identifier(x)       
        )
      )
    end)

    Builder.class_body([
      Builder.method_definition(
        Builder.identifier("constructor"),
        Builder.function_expression(
          Enum.map(params, fn(x) -> Builder.identifier(x) end),
          Enum.map(defaults, fn(x) -> Builder.literal(x) end),
          Builder.block_statement(body)
        )
      )]
    )
  end

  defp do_translation({:defmodule, _, [{:__aliases__, _, _}, [do: nil]]}) do
    Builder.program([])
  end

  defp do_translation({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]}) do
    parsed_body = do_translation(body)

    {imports, body} = cond do
      !is_list(parsed_body) ->
        {[], [parsed_body]}
      true ->
        Enum.partition(parsed_body.body, fn(x) -> x.type == "ImportDeclaration" end)
    end

    body = Enum.map(body, fn(x) -> 
      if x.type == "ClassBody" do
        Builder.export_declaration(
          Builder.class_declaration(
            Builder.identifier(List.last(module_name_list)),
            x
          )
        )
      else
        x
      end
    end)

    if length(body) == 1 and hd(body).type == "BlockStatement" do
      body = hd(body).body
    end

    Builder.program(imports ++ body)
  end

  defp do_translation({:alias, _, alias_info}) do
    {_, _, name} = hd(alias_info)

    import_id = if length(alias_info) > 1 do
      {_, _, alt} = List.last(alias_info)[:as]
      Builder.identifier(alt)
    else
      List.last(name) |> Builder.identifier
    end


    source = Enum.map(name, fn(x) -> Atom.to_string(x) |> String.downcase end) |> Enum.join("/")
    source = "'#{source}'"

    import_specifier = Builder.import_namespace_specifier(import_id)
    Builder.import_declaration([import_specifier], Builder.identifier(source))
  end

  defp do_translation({:if, _, [test, blocks]}) do
    test = do_translation(test)
    consequent = Builder.block_statement([do_translation(blocks[:do])])

    alternate = if blocks[:else] != nil do
      Builder.block_statement([do_translation(blocks[:else])])
    else
      nil
    end

    Builder.if_statement(test, consequent, alternate)
  end

  defp do_translation({:defexception, _, [[message: _message]]}) do
    Builder.literal(nil)
  end

  defp do_translation({:__block__, _, expressions }) do
    Builder.block_statement(Enum.map(expressions, &do_translation(&1)))
  end

  defp do_translation({name, _, params}) when is_list(params) do
    Builder.call_expression(
      Builder.identifier(name),
      Enum.map(params, &do_translation(&1))
    )
  end

  defp do_translation({name, _, _}) do
    Builder.identifier(name)
  end

  defp do_translation(ast) do
    Tuple.to_list(ast)
    |> Enum.map(&do_translation(&1))
    |> Builder.array_expression
  end
end