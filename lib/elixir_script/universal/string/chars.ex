defprotocol ElixirScript.String.Chars do
  def to_string(item)
end

defimpl ElixirScript.String.Chars, for: Atom do
  def to_string(nil) do
    ""
  end

  def to_string(atom) do
    Atom.to_string(atom)
  end
end

defimpl ElixirScript.String.Chars, for: BitString do
  def to_string(thing) when is_binary(thing) do
    thing
  end

  def to_string(thing) do
    thing.toString()
  end
end

defimpl ElixirScript.String.Chars, for: List do
  def to_string(list) do
    list.toString()
  end
end

defimpl ElixirScript.String.Chars, for: Tuple do
  def to_string(tuple) do
    tuple.toString()
  end
end

defimpl ElixirScript.String.Chars, for: Integer do
  def to_string(integer) do
    integer.toString()
  end
end

defimpl ElixirScript.String.Chars, for: Float do
  def to_string(float) do
    float.toString()
  end
end
