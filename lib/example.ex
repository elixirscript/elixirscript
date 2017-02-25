defmodule Example do
  @compile {:undocumented_elixir_backend_option, CustomBackend}
  def hello(e) when is_binary(e) and is_integer(e) do
    <<1, 2, 3, 4, 5>>
  end
end