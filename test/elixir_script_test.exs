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
    assert hd(js_code) == "Erlang.atom('atom')"
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
      import { fun, Erlang, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
      
      const __MODULE__ = Erlang.atom('Elephant');

      let something_else = fun([[], function() {
        return null;
      }]);

      let something = fun([[], function() {
        return ul;
      }]);

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
    import { fun, Erlang, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    import * as Elephant from 'animals/elephant';
    const __MODULE__ = Erlang.atom('Animals');

    let something = fun([[], function()    {
       return     Elephant.defstruct();
     }]);

    export {
      something
    };
     """, hd(js_code)

     assert_js_matches """
        import { fun, Erlang, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
       
       const __MODULE__ = Erlang.atom('Elephant');
       function defstruct(trunk = true){return {[Erlang.atom('__struct__')]: __MODULE__, [Erlang.atom('trunk')]: trunk};}
       export  {defstruct};     
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
    import { fun, Erlang, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    const __MODULE__ = Erlang.atom('Animals');

    let something_else = fun([[], function()    {
       return     1 * 1;
     }]);

    let sandwich = fun([[], function()    {
       return     null;
     }]);

    export {
      sandwich
    };
     """, hd(js_code)
  end

end
