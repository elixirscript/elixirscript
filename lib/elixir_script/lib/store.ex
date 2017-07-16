defmodule ElixirScript.Core.Store do
  @moduledoc false
  use ElixirScript.FFI, global: true

  foreign create(value, name \\ nil)

  foreign update(key, value)

  foreign read(key)

  foreign remove(key)
end
