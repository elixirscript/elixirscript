defmodule ElixirScript.Base do
  @moduledoc false

  def encode64(data) do
    ElixirScript.Bootstrap.Functions.b64EncodeUnicode(data)
  end

  defp can_decode64(data) do
    try do
      JS.atob(data)
      true
    rescue
      _ ->
        false
    end
  end

  def decode64(data) do
    if can_decode64(data) do
      {:ok, decode64!(data) }
    else
      :error
    end
  end

  def decode64!(data) do
    JS.atob(data)
  end

end
