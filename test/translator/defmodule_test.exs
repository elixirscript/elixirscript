defmodule ElixirScript.Translator.Defmodule.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate defmodules" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    assert_translation(ex_ast, "const __MODULE__ = Atom('Elephant');")

    ex_ast = quote do
      defmodule Elephant do
        @ul JQuery.("#todo-list")

        def something() do
          @ul
        end

        defp something_else() do
        end
      end
    end

    js_code = """
      const __MODULE__ = Atom('Elephant');

      const ul = JQuery('#todo-list');

      function something_else(){
        return null;
      }

      function something(){
        return ul;
      }

      let Elephant = {
        something: something
      };

      export default Elephant;
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule Elephant do
        alias Icabod.Crane

        def something() do
        end

        defp something_else() do
        end
      end
    end

    js_code = """
      const __MODULE__ = Atom('Elephant');

      import Crane from 'icabod/crane';

      function something_else(){
        return null;
      }

      function something(){
        return null;
      }

      let Elephant = { something: something };
      export default Elephant;
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate modules with inner modules" do
    ex_ast = quote do
      defmodule Animals do
        defmodule Elephant do
          defstruct trunk: true
        end


        def something() do
        end

        defp something_else() do
        end
      end
    end

    js_code = """
      const __MODULE__ = Atom('Animals');

      const __MODULE__ = Atom('Elephant');
      function defstruct(trunk = true) {
         return {
             __struct__: __MODULE__,
             trunk: trunk
         };
      }
      let Elephant = { defstruct: defstruct };

      function something(){
        return ul;
      }

      function something_else(){
        return null;
      }

      let Animals = {
        something: something,
        Elephant: Elephant
      };

      export default Animals;
    """

    assert_translation(ex_ast, js_code)
  end
end