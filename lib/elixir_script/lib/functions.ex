defmodule ElixirScript.Core.Functions do
  @moduledoc false
  use ElixirScript.FFI, global: true

  defexternal split_at(value, position)
end
