defmodule ElixirScript.Translator.Defprotocol.Test do
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
         import Elixir from '../elixir/Elixir.Bootstrap';
         let impls = [];
         import Elixir$Blank$DefImpl$Elixir$Integer from '../app/Elixir.Blank.DefImpl.Elixir.Integer';
         impls.push(Elixir$Blank$DefImpl$Elixir$Integer)
         import Elixir$Blank$DefImpl$Elixir$List from '../app/Elixir.Blank.DefImpl.Elixir.List';
         impls.push(Elixir$Blank$DefImpl$Elixir$List)
         import Elixir$Blank$DefImpl$Elixir$Atom from '../app/Elixir.Blank.DefImpl.Elixir.Atom';
         impls.push(Elixir$Blank$DefImpl$Elixir$Atom)
         export default impls;

         import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         import Implementations from '../app/Elixir.Blank.Defimpl';
         const Elixir$Blank = Elixir.Core.Functions.defprotocol({
             blank__qmark__: function()    {

           }
       });
         for(let {Type,Implementation} of Implementations) Elixir.Core.Functions.defimpl(Elixir$Blank,Type,Implementation)
         export default Elixir$Blank;

         import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(number)    {
             return     false;
           }));
         export default {
             'Type': Elixir.Core.Integer,     'Implementation': {
             blank__qmark__
       }
       };

         import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Object.freeze([])],function()    {
             return     true;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()],function()    {
             return     false;
           }));
         export default {
             'Type': Array,     'Implementation': {
             blank__qmark__
       }
       };

         import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([false],function()    {
             return     true;
           }),Elixir.Core.Patterns.clause([null],function()    {
             return     true;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()],function()    {
             return     false;
           }));
         export default {
             'Type': Symbol,     'Implementation': {
             blank__qmark__
       }
       };
    """

    assert_translation(ex_ast, js_code)
  end

end
