defmodule ElixirScript.Experimental.Module do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Function

  @moduledoc """
  Upper level module that handles compilation
  """

  def compile(_line, _file, module, attrs, defs, unreachable, opts) do
    reachable_defs = Enum.filter(defs, fn
      { name, _, _, _} -> not(name in unreachable)
      { _, type, _, _} when type in [:defmacro, :defmacrop] -> false
      _ -> true
    end)

    compiled_functions = reachable_defs
    |> Enum.map(&Function.compile(&1))

    exports = make_exports(reachable_defs)

    J.program(compiled_functions ++ [J.export_default_declaration(exports)])
  end

  defp make_exports(reachable_defs) do
    exports = Enum.reduce(reachable_defs, [], fn
      {{name, arity}, :def, _, _}, list ->
        function_name = J.identifier("#{name}#{arity}")
        list ++ [J.property(function_name, function_name, :init, true)]
      _, list ->
        list
    end)

    J.object_expression(exports)
  end
end
