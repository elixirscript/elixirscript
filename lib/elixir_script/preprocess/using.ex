defmodule ElixirScript.Preprocess.Using do


  def process(ast, env) do
    Macro.prewalk(ast, fn(x) ->
      process_using(x, env)
    end)
  end

  def process_using({:use, _, [{:__aliases__, _, module_name}, params]} = ast, env) do
    expanded_ast = Macro.expand(ast, env)
    eval_using(expanded_ast, env)
  end

  def process_using({:use, context, [{:__aliases__, context2, module_name}]}, env) do
    process_using({:use, context, [{:__aliases__, context2, module_name}, []]}, env)
  end

  def process_using(ast, env) do
    ast
  end

  defp eval_using({:__block__, _, [{:require, _, _} = require_ast , {{:., _, [module_name, :__using__]}, _, _} = using_ast]}, env) do
    Macro.expand_once(using_ast, env)
  end

end