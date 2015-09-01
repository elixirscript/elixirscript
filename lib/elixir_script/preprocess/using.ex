defmodule ElixirScript.Preprocess.Using do


  def process(ast, env) do
    Macro.prewalk(ast, fn(x) ->
      process_using(x, env)
    end)
  end

  def process_using({:use, _, _} = ast, env) do
    ast
    |> Macro.expand(env)
    |> expand__using__(env)
  end

  def process_using(ast, _) do
    ast
  end

  defp expand__using__({:__block__, _, [{:require, _, _}, {{:., _, [_, :__using__]}, _, _} = using_ast]}, env) do
    Macro.expand_once(using_ast, env)
  end

end