defmodule ElixirScript.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "chain methods" do
    js_code = ElixirScript.compile("""
      JQuery.("<div/>").text(html)
    """)

    assert hd(js_code) == "JQuery('<div/>').text(html)"
  end

  should "turn javascript ast into javascript code strings" do
    js_code = ElixirScript.compile(":atom")
    assert hd(js_code) == "Kernel.SpecialForms.atom('atom')"
  end

  should "parse one module correctly" do
    js_code = ElixirScript.compile("""

      defmodule Elephant do
        @ul JQuery.("#todo-list")

        def something() do
          @ul
        end

        defp something_else() do
        end
      end
    """)

    assert_js_matches """
         import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString, Base, String } from 'elixir';
         const __MODULE__ = Kernel.SpecialForms.atom('Elephant');
         let something_else = Patterns.defmatch(Patterns.make_case([],function()    {
             return     null;
           }));
         let something = Patterns.defmatch(Patterns.make_case([],function()    {
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
      import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString, Base, String } from 'elixir';
      import * as Elephant from 'animals/elephant';

       const __MODULE__ = Kernel.SpecialForms.atom('Animals');
       let something = Patterns.defmatch(Patterns.make_case([],function()    {
           return     Elephant.defstruct();
         }));
       export {
           something
        };
     """, hd(js_code)

     assert_js_matches """
         import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString, Base, String } from 'elixir';
         const __MODULE__ = Kernel.SpecialForms.atom('Elephant');
         function defstruct(trunk = true)        {
                 return     Kernel.SpecialForms.map({
             [Kernel.SpecialForms.atom('__struct__')]: __MODULE__,     [Kernel.SpecialForms.atom('trunk')]: trunk
       });
               }
         export {
             defstruct
       };   
       """, List.last(js_code)
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
         import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString, Base, String } from 'elixir';
         const __MODULE__ = Kernel.SpecialForms.atom('Animals');
         let something_else = Patterns.defmatch(Patterns.make_case([],function()    {
             return     1 * 1;
           }));
         let sandwich = Patterns.defmatch(Patterns.make_case([],function()    {
             return     null;
           }));
         export {
             sandwich
       };
     """, hd(js_code)
  end

end
