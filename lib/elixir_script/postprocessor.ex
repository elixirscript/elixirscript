defmodule ElixirScript.PostProcessor do
  @moduledoc """
  Post processes converted JavaScript AST
  """

  defp process(ast) do
    process_modules(ast)
  end


  defp process_modules(%ESTree.Program{} = module) do
    #TODO:  Check for programs inside of program, extract them, add parent imports to them,
    #       and add their import to parents
  end

  defp process_modules(ast) do
    ast
  end

end