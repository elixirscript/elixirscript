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
      defmodule([Atom("Elephant")], function(__MODULE__){

        const ul = JQuery('#todo-list');

        function something_else(){
          return null;
        }

        function something(){
          return ul;
        }

        return {
          something: something
        }   

      });
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
          %Elephant{}
        end

        defp something_else() do
        end

      end
    end

    js_code = """
      defmodule([Atom("Animals")], function(__MODULE__){

        defmodule([Atom("Animals"), Atom("Elephant")], function(__MODULE__){

          function defstruct(trunk = true) {
             return {
                 __struct__: __MODULE__,
                 trunk: trunk
             };
          }

          return {
            defstruct: defstruct
          }

        });

        function something_else(){
          return null;
        }

        function something(){
          return ul;
        }

        return {
          something: something
        }   

      });
    """

    assert_translation(ex_ast, js_code)
  end
end