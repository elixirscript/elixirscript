defprotocol ElixirScript.Enumerable do
  def reduce(collection, acc, fun)
  def member?(collection, value)
  def count(collection)
end
