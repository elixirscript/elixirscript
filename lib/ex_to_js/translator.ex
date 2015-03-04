defmodule ExToJS.Translator do
  require Logger
  alias ESTree.Builder

  @doc """
  Translates Elixir AST to JavaScript AST
  """
  def translate(ex_ast) do
    case ex_ast do
      ast when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) or is_list(ast) or is_atom(ast) ->
        do_translation(ast)
      {one, two} ->
        do_translation({one, two})
      _ ->
        {atom, metadata, args} = ex_ast
        do_translation({atom, metadata, args}) 
    end
  end

  defp do_translation(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Builder.literal(ast)
  end

  defp do_translation(ast) when is_list(ast) do
    make_array(ast)
  end

  defp do_translation(ast) when is_atom(ast) do
    Builder.call_expression(
      Builder.identifier("Symbol"), 
      [Builder.literal(ast)]
    )
  end

  defp do_translation({ one, two }) do
    make_array([one, two])
  end

  defp do_translation({:-, _, [number]}) when is_number(number) do
    Builder.unary_expression(:-, true, Builder.literal(number))
  end

  defp do_translation({:{}, _, elements}) do
    make_array(elements)
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
        declarator = Builder.variable_declarator(
          Builder.array_pattern(Enum.map(identifiers, &do_translation(&1))),
          do_translation(right)
        )

        Builder.variable_declaration([declarator], :let)
    end
  end

  defp do_translation({:%{}, _, properties}) do
    properties
    |> Enum.map(fn({x, y}) -> Builder.property(Builder.literal(x), do_translation(y)) end)
    |> Builder.object_expression
  end

  defp do_translation({:__aliases__, _, aliases}) do
    Builder.identifier(aliases)
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

  defp do_translation({operator, _, [left, right]}) when operator == :+ or operator == :- or operator == :/ or operator == :* or operator == :== or operator == :!= do
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

    body = return_last_expression(body)

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

  defp do_translation({:import, _, [{:__aliases__, _, module_name_list}]}) do
    mod = List.last(module_name_list) |> Builder.identifier

    source = Enum.map(module_name_list, fn(x) -> Atom.to_string(x) |> String.downcase end) |> Enum.join("/")
    source = "'#{source}'"

    import_specifier = Builder.import_namespace_specifier(mod)
    Builder.import_declaration([import_specifier], Builder.identifier(source))
  end

  defp do_translation({:import, _, [{:__aliases__, _, module_name_list}, [only: function_list] ]}) do

    source = Enum.map(module_name_list, fn(x) -> Atom.to_string(x) |> String.downcase end) |> Enum.join("/")
    source = "'#{source}'"

    identifiers = Enum.map(function_list, fn({name, _arity}) -> 
      Builder.import_specifier(
        Builder.identifier(name)
      )
    end)

    Builder.import_declaration(identifiers, Builder.identifier(source))
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

  defp do_translation({:case, _, [condition, [do: clauses]]}) do
    process_case(condition, clauses, nil)
  end

  defp do_translation({:cond, _, [[do: clauses]]}) do
    process_cond(clauses, nil)
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

  defp return_last_expression([]) do
    [Builder.return_statement(Builder.literal(nil))]
  end

  defp return_last_expression(%ESTree.BlockStatement{} = block) do
    %ESTree.BlockStatement{ block | body: return_last_expression(block.body) }
  end

  defp return_last_expression(list) when is_list(list) do
    last_item = List.last(list)

    last_item = case last_item do
      %ESTree.Literal{} ->
        Builder.return_statement(last_item) 
      %ESTree.Identifier{} ->
        Builder.return_statement(last_item) 
      %ESTree.VariableDeclaration{} ->
        declaration = hd(last_item.declarations).id

        return_statement = case declaration do
          %ESTree.ArrayPattern{} ->
            Builder.return_statement(Builder.array_expression(declaration.elements))
          _ ->
            Builder.return_statement(declaration)  
        end

        [last_item, return_statement]
      %ESTree.IfStatement{} ->

        consequent = return_last_expression(last_item.consequent)

        alternate = if last_item.alternate do
          return_last_expression(last_item.alternate)
        else
          nil
        end

        last_item = %ESTree.IfStatement{ last_item | consequent: consequent, alternate: alternate }
      %ESTree.BlockStatement{} ->
        last_item = %ESTree.BlockStatement{ last_item | body: return_last_expression(last_item.body) }
      _ ->
        if String.contains?(last_item.type, "Expression") do
          Builder.return_statement(last_item) 
        else
          [last_item, Builder.return_statement(Builder.literal(nil))]
        end    
    end


    list = Enum.take(list, length(list)-1)

    if is_list(last_item) do
      list ++ last_item
    else
      list ++ [last_item]
    end
  end

  defp make_array(elements) do
    elements
    |> Enum.map(&do_translation(&1))
    |> Builder.array_expression
  end

  defp process_cond([], ast) do
    ast
  end

  defp process_cond(clauses, ast) do
    {:->, _, [clause, clause_body]} = hd(clauses)

    translated_body = do_translation(clause_body)

    if translated_body.type != "BlockStatement" do
      translated_body = Builder.block_statement([translated_body])
    end

    if hd(clause) == true do
      translated_body   
    else
      ast = Builder.if_statement(
        do_translation(hd(clause)),
        translated_body,
        nil
      )

      %ESTree.IfStatement{ ast |  alternate: process_cond(tl(clauses), nil) }
    end
  end

  defp process_case(_predicate, [], ast) do
    ast
  end

  defp process_case(condition, clauses, ast) do
    {:->, _, [clause, clause_body]} = hd(clauses)

    translated_body = do_translation(clause_body)

    if translated_body.type != "BlockStatement" do
      translated_body = Builder.block_statement([translated_body])
    end

    translated_clause = do_translation(hd(clause))

    if translated_clause.type == "Identifier" && translated_clause.name == :_ do
      translated_body
    else
      ast = Builder.if_statement(
        Builder.binary_expression(
          :==,
          do_translation(condition),
          translated_clause
        ),
        translated_body,
        nil
      )

      %ESTree.IfStatement{ ast |  alternate: process_case(condition, tl(clauses), nil) }
    end  
  end
end