defmodule ElixirScript.Preprocess.Using do
  @moduledoc false

  def process(ast) do
    Macro.prewalk(ast, fn(x) ->
      process_using(x)
    end)
  end

  def process_using({:use, _, _} = ast) do
    ast
    |> Macro.expand(ElixirScript.State.get().elixir_env)
    |> expand__using__
  end

  def process_using(ast) do
    ast
  end

  defp expand__using__({:__block__, _, [{:require, _, _}, {{:., _, [_, :__using__]}, _, _} = using_ast]}) do
    Macro.expand_once(using_ast, ElixirScript.State.get().elixir_env)
  end

end
