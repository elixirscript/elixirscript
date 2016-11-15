defprotocol ElixirScript.Enumerable do
  @moduledoc false  
  def reduce(enumerable, acc, fun)
  def member?(enumerable, element)
  def count(enumerable)
end
