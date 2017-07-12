defmodule Data.JSON do
  use ElixirScript.FFI

  foreign stringify(map)
  foreign parse(string)
end