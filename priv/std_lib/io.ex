defmodule ElixirScript.IO do

  def inspect(item, opts \\ []) do
    :console.log(item)
    item
  end

  def puts(device \\ :stdio, item) when is_binary(item) do
    case device do
      :stdio ->
        :console.log(item)
      :stderr ->
        :console.warn(item)
    end
  end

  def warn(message) when is_binary(message) do
    :console.warn("warning: #{message}")
    :console.trace()
  end

end
