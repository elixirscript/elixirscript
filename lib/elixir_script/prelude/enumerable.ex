defprotocol ElixirScript.Enumerable do
  def reduce(enumerable, acc, fun)
  def member?(enumerable, element)
  def count(enumerable)
end
