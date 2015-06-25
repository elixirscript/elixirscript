defmodule ElixirScript.Translator.Defmodule.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate defmodules" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    js_code = """
    Kernel.defmodule(List(Atom('Elephant')), function (__MODULE__) {
      return { };
    });
    """

    assert_translation(ex_ast, js_code)

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
    Kernel.defmodule(List(Atom('Elephant')), function (__MODULE__) {
      const ul = JQuery('#todo-list');
      
      function something_else() {
        return null;
      }

      function something() {
        return ul;
      }

      return { something: something };
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
     Kernel.defmodule(List(Atom('Elephant')), function (__MODULE__) {
         let Crane = Icabod.Crane;

         function something_else() {
             return null;
         }

         function something() {
             return null;
         }

         return { something: something };
     });
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
      Kernel.defmodule(List(Atom('Animals')), function (__MODULE__) {
        Kernel.defmodule(List(Atom('Animals'), Atom('Elephant')), function (__MODULE__) {
          function defstruct(trunk = true) {
            return {
              __struct__: __MODULE__,
              trunk: trunk
            };
          }
        
          return { defstruct: defstruct };
        });

        let Elephant = Animals.Elephant;

        function something_else() {
          return null;
        }

        function something() {
          return Elephant.defstruct();
        }

        return { something: something };
      });
    """

    assert_translation(ex_ast, js_code)
  end
end