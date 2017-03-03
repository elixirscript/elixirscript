defmodule ElixirScript.Experimental.Module do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Function

  def compile(_, _, module, attrs, defs, unreachable, opts) do
    reachable_defs = defs
    |> Enum.filter(fn 
      { name, _, _, _} -> not(name in unreachable)
      { _, type, _, _} when type in [:defmacro, :defmacrop] -> false
      _ -> true
    end)

    compiled_functions = reachable_defs
    |> Enum.map(&Function.compile(&1))

    J.program(compiled_functions)
  end
end