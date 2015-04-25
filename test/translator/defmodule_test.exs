defmodule ElixirScript.Translator.Defmodule.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate defmodules" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    assert_translation(ex_ast, "const __MODULE__ = [Atom('Elephant')];")

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
      const __MODULE__ = [Atom('Elephant')];

      const ul = JQuery('#todo-list');

      export function something(){
        return ul;
      }

      function something_else(){
        return null;
      }
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
      const __MODULE__ = [Atom('Elephant')];

      import * as Crane from 'icabod/crane';

      export function something(){
        return null;
      }

      function something_else(){
        return null;
      }
    """

    assert_translation(ex_ast, js_code)
  end
end