defmodule ElixirScript.Translate.Forms.Remote.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.Form
  alias ESTree.Tools.Builder, as: J

  test "call to variable" do
    ast = {:., [line: 644], [{:fun, [line: 644], nil}]}
    state = %{function: {:each, nil}, module: Enum, vars: %{:_ => 0, "entry" => 0, "enumerable" => 0, "fun" => 0}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.identifier("fun0")
  end

end