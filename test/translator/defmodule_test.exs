defmodule ElixirScript.Translator.Defmodule.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate empty module" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    js_code = """
    const __MODULE__ = Erlang.atom('Elephant');
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate defmodules" do
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
     const __MODULE__ = Erlang.atom('Elephant');
     const ul = JQuery('#todo-list');
     function something_else() {
         return null;
     }
     function something() {
         return ul;
     }
     return { something: something };
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
     const __MODULE__ = Erlang.atom('Elephant');
     import Crane from 'icabod/crane';
     function something_else() {
         return null;
     }
     function something() {
         return null;
     }
     return { something: something };
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
          %Elephant{}
        end

        defp something_else() do
        end

      end
    end

    js_code = """
     const __MODULE__ = Erlang.atom('Animals');

     import Elephant from 'animals/elephant';

     function something_else() {
         return null;
     }
     function something() {
         return Elephant.defstruct();
     }
     return { something: something };

     const __MODULE__ = Erlang.atom('Elephant');

     function defstruct(trunk = true) {
         return {
             __struct__: __MODULE__,
             trunk: trunk
         };
     }
     return { defstruct: defstruct };
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate modules with 2 inner modules" do
    ex_ast = quote do
      defmodule Animals do

        defmodule Elephant do
          defstruct trunk: true
        end

        defmodule Bear do
          defstruct trunk: true
        end


        def something() do
          %Elephant{}
        end

        defp something_else() do
        end

      end
    end

    js_code = """
     const __MODULE__ = Erlang.atom('Animals');

     import Elephant from 'animals/elephant';
     import Bear from 'animals/bear';

     function something_else() {
         return null;
     }
     function something() {
         return Elephant.defstruct();
     }
     return { something: something };

     const __MODULE__ = Erlang.atom('Elephant');

     function defstruct(trunk = true) {
         return {
             __struct__: __MODULE__,
             trunk: trunk
         };
     }
     return { defstruct: defstruct };

     const __MODULE__ = Erlang.atom('Bear');

     function defstruct(trunk = true) {
         return {
             __struct__: __MODULE__,
             trunk: trunk
         };
     }
     return { defstruct: defstruct };
    """

    assert_translation(ex_ast, js_code)
  end


  should "translate modules with inner module that has inner module" do
    ex_ast = quote do
      defmodule Animals do

        defmodule Elephant do
          defstruct trunk: true

          defmodule Bear do
            defstruct trunk: true
          end
        end


        def something() do
          %Elephant{}
        end

        defp something_else() do
        end

      end
    end

    js_code = """
     const __MODULE__ = Erlang.atom('Animals');
     import Elephant from 'animals/elephant';
     function something_else() {
         return null;
     }
     function something() {
         return Elephant.defstruct();
     }
     return { something: something };

     const __MODULE__ = Erlang.atom('Elephant');
     import Bear from 'animals/elephant/bear';
     function defstruct(trunk = true) {
         return {
             __struct__: __MODULE__,
             trunk: trunk
         };
     }
     return { defstruct: defstruct };

     const __MODULE__ = Erlang.atom('Bear');
     function defstruct(trunk = true) {
         return {
             __struct__: __MODULE__,
             trunk: trunk
         };
     }
     return { defstruct: defstruct };
    """

    assert_translation(ex_ast, js_code)
  end
end
