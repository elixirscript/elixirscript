defmodule Elixirscript.Experimental.Function do
  alias ESTree.Tools.Builder, as: J

  def compile({{:__struct__, 0}, :def, _, clauses}) do
  end

  def compile({{:__struct__, 1}, :def, _, clauses}) do
  end

  def compile({{name, arity}, type, _, clauses}) do
  end

  def handle_clause({ _, args, guards, body}) do
  end
end