defmodule ElixirScript.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "turn javascript ast into javascript code strings" do
    js_code = ElixirScript.transpile(":atom")
    assert hd(js_code) == "Erlang.atom('atom')"
  end

  should "parse one module correctly" do
    js_code = ElixirScript.transpile("""
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
      import Erlang from '__lib/erlang';
      import Kernel from '__lib/kernel';
      import fun from '__lib/funcy/fun';
      
      const __MODULE__ = Erlang.atom('Elephant');

      let something_else = fun([[], function() {
        return null;
      }]);

      let something = fun([[], function() {
        return ul;
      }]);

      const ul = JQuery('#todo-list');

      export default {
        something: something
      };
    """, hd(js_code)
  end

  should "parse multiple modules correctly" do
    js_code = ElixirScript.transpile("""
      defmodule Animals do

        defmodule Elephant do
          defstruct trunk: true
        end


        def something() do
          %Elephant{}
        end

        defp something_else() do
        end

      end
    """)

    assert_js_matches """
      import Erlang from '__lib/erlang';
      import Kernel from '__lib/kernel';
      import fun from '__lib/funcy/fun';
      import Elephant from 'animals/elephant';
      const __MODULE__ = Erlang.atom('Animals');

      let something_else = fun([[], function() {
        return null;
      }]);

      let something = fun([[], function() {
        return Elephant.defstruct();
      }]);

      export default {
        something: something
      };
     """, hd(js_code)

     assert_js_matches """
       import Erlang from '__lib/erlang';
       import Kernel from '__lib/kernel';
       import fun from '__lib/funcy/fun';
       
       const __MODULE__ = Erlang.atom('Elephant');
       function defstruct(trunk = true){return {__struct__: __MODULE__, trunk: trunk};}
       export default {defstruct: defstruct};     
       """, List.last(js_code)
  end
end