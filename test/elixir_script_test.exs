defmodule ElixirScript.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "chain methods" do
    js_code = ElixirScript.compile("""
      JQuery.("<div/>").text(html)
    """)

    assert hd(js_code) =~ "JQuery('<div/>').text(html)"
  end

  should "turn javascript ast into javascript code strings" do
    js_code = ElixirScript.compile(":atom")
    assert hd(js_code) =~ "Elixir.Kernel.SpecialForms.atom('atom')"
  end

  should "parse one module correctly" do
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
         import * as Elixir from 'Elixir';
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elixir.Elephant');
         const something_else = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     Elixir.String.Chars.to_string(10);
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

  should "parse multiple modules correctly" do

    js_code = ElixirScript.compile("""
      defmodule Animals do

        defmodule Elephant do
          defstruct trunk: true
        end


        def something() do
          %Elephant{}
        end

      end
    """, env: make_custom_env)

    assert_js_matches """
    import * as Elixir from 'Elixir';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elixir.Animals');
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
        return     Elixir$Animals$Elephant.Elixir$Animals$Elephant.create(Elixir.Kernel.SpecialForms.map({}));
      }));
    export {
        something
  };
     """, hd(js_code)

     assert_js_matches """
     import * as Elixir from 'Elixir';
     const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elixir.Animals.Elephant');
     const defstruct = Elixir.Kernel.defstruct({
         [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__,     [Elixir.Kernel.SpecialForms.atom('trunk')]: true
   });
     export {
         Elixir$Animals$Elephant: defstruct
   };
       """, Enum.fetch!(js_code, 1)
  end


  should "parse macros" do

    js_code = ElixirScript.compile("""
      defmodule Animals do
        use ElixirScript.Using

        defp something_else() do
          ElixirScript.Math.squared(1)
        end

      end
    """, env: make_custom_env)

    assert_js_matches """
         import * as Elixir from 'Elixir';
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elixir.Animals');
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


  should "expand Html macros" do
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

      assert hd(js_code) =~ "Elixir.VirtualDOM.h('div'"
      assert hd(js_code) =~ "Elixir.VirtualDOM.h('span'"
      assert hd(js_code) =~ "Elixir.VirtualDOM.create"
  end


  should "set standard lib path" do

    js_code = ElixirScript.compile("""
      defmodule Animals do
        use ElixirScript.Using

        defp something_else() do
          ElixirScript.Math.squared(1)
        end

      end
    """, env: make_custom_env, stdlib_path: "elixirscript")

    assert_js_matches """
         import * as Elixir from 'elixirscript';
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elixir.Animals');
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
