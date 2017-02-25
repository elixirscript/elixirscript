defmodule CustomBackend do
  def compile(line, file, module, attrs, defs, unreachable, opts) do
    # Print all arguments
    IO.inspect binding()
    
    # Invoke the default backend - it returns the compiled beam binary
    :elixir_erl.compile(line, file, module, attrs, defs, unreachable, opts)
  end
end