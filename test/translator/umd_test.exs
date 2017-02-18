defmodule ElixirScript.Translator.UMD.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate module to umd" do
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
         (function(root, factory) {
         if (typeof define === 'function' && define.amd) {
             define(['../elixir/Elixir.ElixirScript.Kernel'], factory)
         } else if (typeof exports === 'object') {
             module.exports = factory(require('../elixir/Elixir.ElixirScript.Kernel'))
         } else {
             root.returnExports = factory(root.Elixir$ElixirScript$Kernel)
         }
     })(this, function(Elixir$ElixirScript$Kernel) {
         const something_else = Elixir.Core.Patterns.defmatchgen(Elixir.Core.Patterns.clause([], function*() {
             return null;
         }));

         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([], function() {
             return ul;
         }));

         const ul = JQuery('#todo-list');

         return {
             something
         };
     });
    """

    assert_translation(ex_ast, js_code, :umd)
  end

  test "protocol to umd" do
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
     (function(root, factory) {
         if (typeof define === 'function' && define.amd) {
             define(['../elixir/Elixir.Bootstrap', '../app/Elixir.Blank.DefImpl.Elixir.Integer', '../app/Elixir.Blank.DefImpl.Elixir.List', '../app/Elixir.Blank.DefImpl.Elixir.Atom'], factory)
         } else if (typeof exports === 'object') {
             module.exports = factory(require('../elixir/Elixir.Bootstrap'), require('../app/Elixir.Blank.DefImpl.Elixir.Integer'), require('../app/Elixir.Blank.DefImpl.Elixir.List'), require('../app/Elixir.Blank.DefImpl.Elixir.Atom'))
         } else {
             root.returnExports = factory(root.Elixir, root.Elixir$Blank$DefImpl$Elixir$Integer, root.Elixir$Blank$DefImpl$Elixir$List, root.Elixir$Blank$DefImpl$Elixir$Atom)
         }
     })(this, function(Elixir, Elixir$Blank$DefImpl$Elixir$Integer, Elixir$Blank$DefImpl$Elixir$List, Elixir$Blank$DefImpl$Elixir$Atom) {
         let impls = [];

         impls.push(Elixir$Blank$DefImpl$Elixir$Integer)

         impls.push(Elixir$Blank$DefImpl$Elixir$List)

         impls.push(Elixir$Blank$DefImpl$Elixir$Atom)

         return impls;
     });

     (function(root, factory) {
         if (typeof define === 'function' && define.amd) {
             define(['../app/Elixir.Blank.Defimpl', '../elixir/Elixir.ElixirScript.Kernel'], factory)
         } else if (typeof exports === 'object') {
             module.exports = factory(require('../app/Elixir.Blank.Defimpl'), require('../elixir/Elixir.ElixirScript.Kernel'))
         } else {
             root.returnExports = factory(root.Implementations, root.Elixir$ElixirScript$Kernel)
         }
     })(this, function(Implementations, Elixir$ElixirScript$Kernel) {
         const Elixir$Blank = Elixir.Core.Functions.defprotocol({
             blank__qmark__: function() {}
         });

         for (let {Type, Implementation} of Implementations) Elixir.Core.Functions.defimpl(Elixir$Blank, Type, Implementation)

         return Elixir$Blank;
     });

     (function(root, factory) {
         if (typeof define === 'function' && define.amd) {
             define(['../elixir/Elixir.ElixirScript.Kernel'], factory)
         } else if (typeof exports === 'object') {
             module.exports = factory(require('../elixir/Elixir.ElixirScript.Kernel'))
         } else {
             root.returnExports = factory(root.Elixir$ElixirScript$Kernel)
         }
     })(this, function(Elixir$ElixirScript$Kernel) {
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()], function(number) {
             return false;
         }));

         return {
             'Type': Elixir.Core.Integer,
             'Implementation': {
                 blank__qmark__
             }
         };
     });

     (function(root, factory) {
         if (typeof define === 'function' && define.amd) {
             define(['../elixir/Elixir.ElixirScript.Kernel'], factory)
         } else if (typeof exports === 'object') {
             module.exports = factory(require('../elixir/Elixir.ElixirScript.Kernel'))
         } else {
             root.returnExports = factory(root.Elixir$ElixirScript$Kernel)
         }
     })(this, function(Elixir$ElixirScript$Kernel) {
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Object.freeze([])], function() {
             return true;
         }), Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()], function() {
             return false;
         }));

         return {
             'Type': Array,
             'Implementation': {
                 blank__qmark__
             }
         };
     });

     (function(root, factory) {
         if (typeof define === 'function' && define.amd) {
             define(['../elixir/Elixir.ElixirScript.Kernel'], factory)
         } else if (typeof exports === 'object') {
             module.exports = factory(require('../elixir/Elixir.ElixirScript.Kernel'))
         } else {
             root.returnExports = factory(root.Elixir$ElixirScript$Kernel)
         }
     })(this, function(Elixir$ElixirScript$Kernel) {
         const blank__qmark__ = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([false], function() {
             return true;
         }), Elixir.Core.Patterns.clause([null], function() {
             return true;
         }), Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()], function() {
             return false;
         }));

         return {
             'Type': Symbol,
             'Implementation': {
                 blank__qmark__
             }
         };
     });
    """

    assert_translation(ex_ast, js_code, :umd)
  end
end