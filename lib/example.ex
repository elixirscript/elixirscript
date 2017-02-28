defmodule Example do
  @compile {:undocumented_elixir_backend_option, ElixirscriptBackend}

  defmodule First do
    def hello(e)  do
    end
  end


  def hello(e) when is_binary(e) when is_integer(e) do
    <<1, 2, 3, 4, 5>>
    1
    "hello"
  end

  def hello(e)  do
    First.hello(e)
  end  

  defp goodbye() do
  end
end