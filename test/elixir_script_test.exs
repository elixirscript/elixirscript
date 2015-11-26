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
         import * as Elixir from 'elixir';
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');
         const something_else = Elixir.Patterns.defmatch(Elixir.Patterns.make_case([],function()    {
             return     Elixir.String.Chars.to_string(10);
           }));
         const something = Elixir.Patterns.defmatch(Elixir.Patterns.make_case([],function()    {
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
    import * as Elixir from 'elixir';
    import * as Elephant from 'animals/elephant';
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals.Elephant');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__, [Elixir.Kernel.SpecialForms.atom('trunk')]: true
    });
    export {
        Elephant: defstruct
    };
     """, hd(js_code)

     assert_js_matches """
     import * as Elixir from 'elixir';
     const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');
     const defstruct = Elixir.Kernel.defstruct({
         [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__, [Elixir.Kernel.SpecialForms.atom('trunk')]: true
     });
     export {
         Elephant: defstruct
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
         import * as Elixir from 'elixir';
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Animals');
         const something_else = Elixir.Patterns.defmatch(Elixir.Patterns.make_case([],function()    {
             return     1 * 1;
           }));
         const sandwich = Elixir.Patterns.defmatch(Elixir.Patterns.make_case([],function()    {
             return     null;
           }));
         export {
             sandwich
       };
     """, hd(js_code)
  end

end
