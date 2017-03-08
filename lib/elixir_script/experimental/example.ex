defmodule Example do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}

  defstruct [:name]

  def new() do
    Hello.hi()
  end

end
