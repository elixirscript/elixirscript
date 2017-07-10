defmodule JSON do
  use ElixirScript.FFI

  foreign stringify(map)
  foreign parse(string)
end