defprotocol Example.Size do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}
  def size(data)
end

defimpl Example.Size, for: BitString do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}

  def size(string), do: byte_size(string)
end

defimpl Example.Size, for: Map do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}

  def size(map), do: map_size(map)
end

defimpl Example.Size, for: Tuple do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}

  def size(tuple), do: tuple_size(tuple)
end