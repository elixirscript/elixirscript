defmodule ElixirScript.Base do
  @moduledoc false

  def encode64(data) do
    ElixirScript.Bootstrap.b64EncodeUnicode(data)
  end

  def decode64(data) do
    if ElixirScript.Bootstrap.can_decode64(data) do
      {:ok, decode64!(data) }
    else
      :error
    end
  end

  def decode64!(data) do
    JS.atob(data)
  end

end
