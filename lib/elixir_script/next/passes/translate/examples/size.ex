defprotocol Example.Size do
  def size(data)
end

defimpl Example.Size, for: BitString do

  def size(string), do: byte_size(string)
end

defimpl Example.Size, for: Map do
  def size(map), do: map_size(map)
end

defimpl Example.Size, for: Tuple do
  def size(tuple), do: tuple_size(tuple)
end