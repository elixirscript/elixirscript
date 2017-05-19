defmodule Example do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}

  defstruct [:name]

  def new() do
    JS.Map.new()
    Hello.hi()
  end

end
