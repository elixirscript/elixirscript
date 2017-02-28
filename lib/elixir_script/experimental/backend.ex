defmodule Elixirscript.Experimental.Backend do
  def compile(line, file, module, attrs, defs, unreachable, opts) do

    # Print all arguments
    IO.inspect binding()
    handle_compile(line, file, module, attrs, defs, unreachable, opts)
    
    # Invoke the default backend - it returns the compiled beam binary
    :elixir_erl.compile(line, file, module, attrs, defs, unreachable, opts)
  end

  defp handle_compile(line, file, module, attrs, defs, unreachable, opts) do
  end

  defp handle_function({ {name, arity}, type, _, clauses }) do
  end

  defp handle_clause({ _, args, guards, body}) do
  end
end