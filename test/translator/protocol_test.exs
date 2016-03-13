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
         import Implementations from './Elixir.Blank.Defimpl';
         const Elixir$Blank = Elixir.Core.Functions.defprotocol({
             blank__qmark__: function()    {

           }
       });
         for(let {Type,Implementation} of Implementations) Elixir.Core.Functions.defimpl(Elixir$Blank,Type,Implementation)
         export default Elixir$Blank;

         import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([false],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([null],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
             return     false;
           }));
         export default {
             'Type': Symbol,     'Implementation': {
             blank__qmark__
       }
       };

         import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
             return     false;
           }));
         export default {
             'Type': Elixir.Core.Integer,     'Implementation': {
             blank__qmark__
       }
       };

         import Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Object.freeze([])],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
             return     false;
           }));
         export default {
             'Type': Array,     'Implementation': {
             blank__qmark__
       }
       };



         let impls = [];
         import Elixir$Blank$DefImpl$Elixir$Atom from './Elixir.Blank.DefImpl.Elixir.Atom';
         impls.push(Elixir$Blank$DefImpl$Elixir$Atom)
         import Elixir$Blank$DefImpl$Elixir$Integer from './Elixir.Blank.DefImpl.Elixir.Integer';
         impls.push(Elixir$Blank$DefImpl$Elixir$Integer)
         import Elixir$Blank$DefImpl$Elixir$List from './Elixir.Blank.DefImpl.Elixir.List';
         impls.push(Elixir$Blank$DefImpl$Elixir$List)
         export default impls;
    """

    assert_translation(ex_ast, js_code)
  end

end
