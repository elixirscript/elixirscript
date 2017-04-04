defmodule ElixirScript.Translator.Cond.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate cond" do
    ex_ast = quote do
      cond do
        1 + 1 == 1 ->
          "This will never match"
        2 * 2 != 4 ->
          "Nor this"
        true ->
          "This will"
      end
    end

    js_code = """
         Bootstrap.Core.SpecialForms.cond(Object.freeze([1 + 1 == 1, async function()    {
             return     'This will never match';
           }]),Object.freeze([2 * 2 != 4, async function()    {
             return     'Nor this';
           }]),Object.freeze([true, async function()    {
             return     'This will';
           }]))
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      cond do
        1 + 1 == 1 ->
          a = 1
          "This will never match"
        2 * 2 != 4 ->
          a = 2
          "Nor this"
        true ->
          a = 3
          "This will"
      end
    end

    js_code = """
         Bootstrap.Core.SpecialForms.cond(Object.freeze([1 + 1 == 1, async function()    {
             let [a] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),1);
             return     'This will never match';
           }]),Object.freeze([2 * 2 != 4, async function()    {
             let [a] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),2);
             return     'Nor this';
           }]),Object.freeze([true, async function()    {
             let [a] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),3);
             return     'This will';
           }]))
    """

    assert_translation(ex_ast, js_code)
  end
end
