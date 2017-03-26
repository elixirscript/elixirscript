defmodule ElixirScript.IO do

  def inspect(item, opts \\ []) do
    JS.console.log(item)
    item
  end

  def puts(device \\ :stdio, item) when is_binary(item) do
    case device do
      :stdio ->
        JS.console.log(item)
      :stderr ->
        JS.console.warn(item)
    end
  end

  def warn(message) when is_binary(message) do
    JS.console.warn("warning: #{message}")
    JS.console.trace()
  end

end
