defmodule ElixirScript.Core.Store do
  @moduledoc false
  use ElixirScript.FFI, global: true

  defexternal create(value, name \\ nil)

  defexternal update(key, value)

  defexternal read(key)

  defexternal remove(key)
end
