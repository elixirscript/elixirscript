defmodule User do
  defstruct name: "John", age: 27
end

defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    a = %User{}
    #:console.log(a.name)
    #:console.log(a.age)
  end
end
