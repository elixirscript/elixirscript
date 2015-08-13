defmodule ElixirScript.Translator.Assignment do
  @moduledoc false
  require Logger
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Primitive

  def bind({_left1, _left2} = two_tuple, right) do
    do_tuple_bind(Tuple.to_list(two_tuple), right)
  end

  def bind({:{}, _, elements}, right) do
    do_tuple_bind(elements, right)
  end

  def bind({:^, _, [{variable, meta, context}]}, right) do
     JS.if_statement(
      Translator.translate(quote do: !Kernel.match__qmark__(unquote({variable, meta, context}), unquote(right))),
      Utils.make_throw_statement("MatchError", "no match of right hand side value")
    )
  end

  def bind(left, right) do
    if is_equality_bind?(List.wrap(left)) do
      do_equality_bind(left, right)
    else
      cond do
        is_list(left) ->
          do_tuple_or_list_bind(left, right, &Primitive.make_list/1)   
        true ->
          declarator = JS.variable_declarator(
            Translator.translate(left),
            Translator.translate(right)
          )

          JS.variable_declaration([declarator], :let)                    
      end
    end
  end

  defp do_tuple_bind(left, right) do
    if is_equality_bind?(left) do
      do_equality_bind(left, right)
    else
      do_tuple_or_list_bind(left, right, &Primitive.make_tuple/1) 
    end
  end

  def is_equality_bind?(left) do
    Enum.any?(left, fn(x) ->
      case x do
        {:^, _, [{_variable, _meta, _context}]} ->
          true
        _ ->
          false
      end
    end)
  end

  def do_tuple_or_list_bind(left, right, ds_func) do
    array = left
    |> Enum.map(&Translator.translate(&1))
    |> JS.array_expression

    declarator = if(is_tuple(right)) do
       JS.variable_declarator(
        array,
        JS.call_expression(
          JS.member_expression(
            JS.identifier("Tuple"),
            JS.identifier("iterator")
          ),
          [Translator.translate(right)]
        )
      )
    else
       JS.variable_declarator(
        array,
        Translator.translate(right)
      )            
    end

    array_pattern = JS.variable_declaration([declarator], :let)

    ref = JS.identifier("_ref")

    ref_declarator = JS.variable_declarator(
      ref,
      ds_func.(left)
    )

    ref_declaration = JS.variable_declaration([ref_declarator], :let)
    %ElixirScript.Translator.Group{ body: [array_pattern, ref_declaration] }  
  end

  defp do_equality_bind(left, right) do
    ref = JS.identifier("_ref")

    ref_declarator = JS.variable_declarator(
      ref,
      Translator.translate(right)
    )

    ref_declaration = JS.variable_declaration([ref_declarator], :let)

    {declarations, _} = Enum.map_reduce(left, 0, fn(x, index) ->
      declaration = case x do
        {:^, _, [{variable, meta, context}]} ->
         JS.if_statement(
          Translator.translate(quote do: !Kernel.match__qmark__(unquote({variable, meta, context}), _ref.get(unquote(index)))),
          Utils.make_throw_statement("MatchError", "no match of right hand side value")
        )
        _ ->
          declarator = JS.variable_declarator(
            Translator.translate(x),
            JS.call_expression(
              JS.member_expression(
                JS.identifier(:Kernel),
                JS.identifier(:elem)
              ),
              [ref, JS.literal(index)]
            )
          )

          JS.variable_declaration([declarator], :let)
      end

      {declaration, index + 1} 

    end)

    %ElixirScript.Translator.Group{ body: [ref_declaration] ++ declarations }
  end
end