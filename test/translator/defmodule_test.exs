defmodule ExToJS.Translator.Defmodule.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate defmodules" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    assert_translation(ex_ast, "const __MODULE__ = Symbol('Elephant');")

    ex_ast = quote do
      defmodule Elephant do
        def something() do
        end

        defp something_else() do
        end
      end
    end

    js_code = """
      const __MODULE__ = Symbol('Elephant');

      export function something(){
        return null;
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
      const __MODULE__ = Symbol('Elephant');

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