defmodule Example do
  @compile {:undocumented_elixir_backend_option, Elixirscript.Experimental.Backend}

  defp hello(a \\ 1) do
  end
end