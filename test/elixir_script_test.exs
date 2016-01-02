defmodule ElixirScript.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "chain methods" do
    js_code = ElixirScript.compile("""
      JQuery.("<div/>").text(html)
    """)

    assert Enum.join(js_code, "\n") =~ "JQuery('<div/>').text(html)"
  end

  test "JS.import/1" do
    js_code = ElixirScript.compile("""
      JS.import React
    """)

    assert Enum.join(js_code, "\n") =~ "import React from 'react'"
  end

  test "turn javascript ast into javascript code strings" do
    js_code = ElixirScript.compile(":atom")
    assert Enum.join(js_code, "\n") =~ "Symbol.for('atom')"
  end

  test "parse one module correctly" do
    js_code = ElixirScript.compile("""

      defmodule Elephant do
        @ul JQuery.("#todo-list")

        @doc "ignore"
        def something() do
          @ul
        end

        defp something_else() do
          to_string(10)
        end
      end

    """)

    assert_js_matches """
        import * as Elixir from './Elixir';
        import * as Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
        import * as Elixir$ElixirScript$String$Chars from './Elixir.ElixirScript.String.Chars';
         const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     Elixir$ElixirScript$String$Chars.to_string(10);
           }));
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     ul;
           }));
         const ul = JQuery('#todo-list');
         export {
             something
       };
    """, hd(js_code)
  end

  test "parse multiple modules correctly" do

    js_code = ElixirScript.compile("""
      defmodule Animals do

        defmodule Elephant do
          defstruct trunk: true
        end


        def something() do
          %Elephant{}
        end

      end
    """, %{ env: make_custom_env })

    assert_js_matches """
    import * as Elixir from './Elixir';
    import * as Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    import * as Elixir$Animals$Elephant from './Elixir.Animals.Elephant';
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
        return     Elixir$Animals$Elephant.Elixir$Animals$Elephant.create(Object.freeze({}));
      }));
    export {
        something
  };
     """, hd(js_code)

     assert_js_matches """
     import * as Elixir from './Elixir';
     import * as Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
     const Elixir$Animals$Elephant = Elixir.Core.Functions.defstruct({
         [Symbol.for('__struct__')]: Symbol.for('Elixir.Animals.Elephant'),
         [Symbol.for('trunk')]: true
   });
     export {
         Elixir$Animals$Elephant
   };
       """, Enum.fetch!(js_code, 1)
  end


  test "parse macros" do

    js_code = ElixirScript.compile("""
      defmodule Animals do
        use ElixirScript.Using

        defp something_else() do
          ElixirScript.Math.squared(1)
        end

      end
    """, %{ env: make_custom_env })

    assert_js_matches """
         import * as Elixir from './Elixir';
         import * as Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
         const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     1 * 1;
           }));
         const sandwich = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }));
         export {
             sandwich
       };
     """, hd(js_code)
  end


  test "expand Html macros" do
      js_code = ElixirScript.compile("""
      tree = Html.div [id: "myDiv"] do
        Html.span do
          "Hello"
        end

        Html.span do
          "World"
        end
      end

      rootNode = VDom.create(tree)
      :document.getElementById("main").appendChild(rootNode)
      """)

      js_code = Enum.join(js_code, "\n")

      assert js_code =~ "Elixir.VirtualDOM.h('div'"
      assert js_code =~ "Elixir.VirtualDOM.h('span'"
      assert js_code =~ "Elixir.VirtualDOM.create"
  end


  test "set standard lib path" do

    js_code = ElixirScript.compile("""
      defmodule Animals do
        use ElixirScript.Using

        defp something_else() do
          ElixirScript.Math.squared(1)
        end

      end
    """, %{ env: make_custom_env, stdlib_path: "elixirscript"} )

    assert_js_matches """
         import * as Elixir from './elixirscript';
         import * as Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
         const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     1 * 1;
           }));
         const sandwich = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }));
         export {
             sandwich
       };
     """, hd(js_code)
  end

end
