defmodule ElixirScript.Experimental.Form do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Forms.{Map, Bitstring, Match, Call}

  def compile(form) when is_integer(form) when is_float(form) when is_binary(form)  do
    J.literal(form)
  end

  def compile(form) when is_list(form) do
    J.array_expression(
      Enum.map(form, &compile(&1))
    )
  end

  def compile(form) when is_atom(form) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [J.literal(form)]
    )
  end

  def compile({a, b}) do
    compile({:{}, [], [a, b]})
  end

  def compile({:{}, _, elements}) do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      ),
      Enum.map(elements, &compile(&1))
    )
  end

  def compile({:%{}, _, _} = map) do
    Map.compile(map)
  end

  def compile({:<<>>, _, _} = bitstring) do
    Bitstring.compile(bitstring)
  end

  def compile({:=, _, [left, right]} = match) do
    Match.compile(match)
  end

  def compile({{:., _, [_, _]}, _, _} = ast) do
    Call.compile(ast)
  end

  def compile({var, _, nil}) do
    J.identifier(var)
  end

  def compile({var, _, []}) do
    J.identifier(var)
  end
  
end
