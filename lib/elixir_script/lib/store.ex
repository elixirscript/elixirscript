defmodule Bootstrap.Core.Store do
  @moduledoc false
  use ElixirScript.FFI

  foreign create(value, name \\ nil)

  foreign update(key, value)

  foreign read(key)

  foreign remove(key)
end