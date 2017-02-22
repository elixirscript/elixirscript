defmodule ElixirScript.Translator.Defdelegate.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate defdelegate" do
    ex_ast = quote do: defdelegate reverse(list), to: :lists

    js_code = """
     const reverse = function(list) {
             return Bootstrap.Core.Functions.reverse(list);
         };
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate defdelegate as another name" do
    ex_ast = quote do: defdelegate other_reverse(list), to: :lists, as: :reverse

    js_code = """
     const other_reverse = function(list) {
             return Bootstrap.Core.Functions.reverse(list);
         };
    """

    assert_translation(ex_ast, js_code)
  end
end