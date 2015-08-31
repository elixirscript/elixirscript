defmodule ElixirScript.Translator.Logger do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator


  def make_logger(:log, params, env) do
    do_make_logger(hd(params), tl(params), env)
  end

  def make_logger(level, params, env) do
    do_make_logger(level, params, env)    
  end

  defp do_make_logger(level, params, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier("console"),
        JS.identifier(level)
      ),
      Enum.map(params, fn(x) -> Translator.translate(x, env) end)
    )
  end
end