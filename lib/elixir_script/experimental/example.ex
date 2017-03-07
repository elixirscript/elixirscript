defmodule Example do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}

  defstruct [:name]

  def new(%x{}) do
    IO.inspect x
    %Example{name: "hello"}
    new(%Example{})
  end

end
