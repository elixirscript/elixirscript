defmodule IntegrationTestModule do

  def case_return_array do
    case "foo" do
      "foo" -> [1, 2]
      true -> "other"
    end
  end
end

defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    Enum.each(1..3, fn x -> JS.console.log(x) end)
  end
end
