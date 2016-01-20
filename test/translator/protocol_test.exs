defmodule ElixirScript.Translator.Protocol.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "parse protocol spec with implementations" do
    ex_ast = quote do
      defprotocol Blank do
        def blank?(data)
      end

      defimpl Blank, for: Integer do
        def blank?(number), do: false
      end

      defimpl Blank, for: List do
        def blank?([]), do: true
        def blank?(_),  do: false
      end

      defimpl Blank, for: Atom do
        def blank?(false), do: true
        def blank?(nil),   do: true
        def blank?(_),     do: false
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
         const Elixir$Blank = Elixir.Core.Functions.defprotocol({
             blank__qmark__: function(){}
       });
         Elixir.Core.Functions.defimpl(Elixir$Blank, Array,{
             blank__qmark__: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([])],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
             return     false;
           }))
       })
         Elixir.Core.Functions.defimpl(Elixir$Blank,Symbol,{
             blank__qmark__: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([false],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([null],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
             return     false;
           }))
       })
         Elixir.Core.Functions.defimpl(Elixir$Blank, Elixir.Core.Integer, {
             blank__qmark__: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
             return     false;
           }))
       })
         export default Elixir$Blank;
    """

    assert_translation(ex_ast, js_code)
  end

end
