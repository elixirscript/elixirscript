defmodule ElixirScript.Translator.Cond.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate cond" do
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
     Elixir.Core.SpecialForms.cond(Elixir.Core.SpecialForms.list(1 + 1 == 1,function()    {
             return     'This will never match';
           }),Elixir.Core.SpecialForms.list(2 * 2 != 4,function()    {
             return     'Nor this';
           }),Elixir.Core.SpecialForms.list(true,function()    {
             return     'This will';
           }))
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
     Elixir.Core.SpecialForms.cond(Elixir.Core.SpecialForms.list(1 + 1 == 1,function()    {
             let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),1);
             return     'This will never match';
           }),Elixir.Core.SpecialForms.list(2 * 2 != 4,function()    {
             let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),2);
             return     'Nor this';
           }),Elixir.Core.SpecialForms.list(true,function()    {
             let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),3);
             return     'This will';
           }))
    """

    assert_translation(ex_ast, js_code)
  end
end