defmodule ElixirScript.Base do
  @moduledoc false  

  def encode64(data) do
    Elixir.Core.b64EncodeUnicode(data)
  end

  def decode64(data) do
    if Elixir.Core.can_decode64(data) do
      {:ok, decode64!(data) }
    else
      :error
    end
  end

  def decode64!(data) do
    Elixir.Core.get_global().atob(data)
  end

end
