defmodule ElixirScript.Translator.CommonJS.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate module to commonjs" do
    ex_ast = quote do
      defmodule Elephant do
        @ul JQuery.("#todo-list")

        def something() do
          @ul
        end

        defgenp something_else() do
        end
      end
    end

    js_code = """
     const Elixir$ElixirScript$Kernel = require('../elixir/Elixir.ElixirScript.Kernel');

     const something_else = Elixir.Core.Patterns.defmatchgen(Elixir.Core.Patterns.clause([], function*() {
         return null;
     }));

     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([], function() {
         return ul;
     }));

     const ul = JQuery('#todo-list');

     module.exports = {
         something
     }
    """

    assert_translation(ex_ast, js_code, :common)
  end

  test "protocol to commonjs" do
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
     const Elixir = require('../elixir/Elixir.Bootstrap');

     const Elixir$Blank$DefImpl$Elixir$Integer = require('../app/Elixir.Blank.DefImpl.Elixir.Integer');

     const Elixir$Blank$DefImpl$Elixir$List = require('../app/Elixir.Blank.DefImpl.Elixir.List');

     const Elixir$Blank$DefImpl$Elixir$Atom = require('../app/Elixir.Blank.DefImpl.Elixir.Atom');

     let impls = [];

     impls.push(Elixir$Blank$DefImpl$Elixir$Integer)

     impls.push(Elixir$Blank$DefImpl$Elixir$List)

     impls.push(Elixir$Blank$DefImpl$Elixir$Atom)

     module.exports = impls

     const Implementations = require('../app/Elixir.Blank.Defimpl');

     const Elixir$ElixirScript$Kernel = require('../elixir/Elixir.ElixirScript.Kernel');

     const Elixir$Blank = Elixir.Core.Functions.defprotocol({
         blank__qmark__: function() {}
     });

     for (let {Type, Implementation} of Implementations) Elixir.Core.Functions.defimpl(Elixir$Blank, Type, Implementation)

     module.exports = Elixir$Blank

     const Elixir$ElixirScript$Kernel = require('../elixir/Elixir.ElixirScript.Kernel');

     const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()], function(number) {
         return false;
     }));

     module.exports = {
         'Type': Elixir.Core.Integer,
         'Implementation': {
             blank__qmark__
         }
     }

     const Elixir$ElixirScript$Kernel = require('../elixir/Elixir.ElixirScript.Kernel');

     const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Object.freeze([])], function() {
         return true;
     }), Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()], function() {
         return false;
     }));

     module.exports = {
         'Type': Array,
         'Implementation': {
             blank__qmark__
         }
     }

     const Elixir$ElixirScript$Kernel = require('../elixir/Elixir.ElixirScript.Kernel');

     const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([false], function() {
         return true;
     }), Elixir.Core.Patterns.clause([null], function() {
         return true;
     }), Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()], function() {
         return false;
     }));

     module.exports = {
         'Type': Symbol,
         'Implementation': {
             blank__qmark__
         }
     }
    """

    assert_translation(ex_ast, js_code, :common)
  end
end
