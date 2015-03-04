defmodule ExToJS.Translator.Import.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate import" do
    ex_ast = quote do
      defmodule User do
        import Hello.World
      end
    end

    js_code = """
      import * as World from 'hello/world';
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule User do
        import US, only: [la: 1, al: 2]
      end
    end

    js_code = """
      import { la, al } from 'us';
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      defmodule User do
        alias Hello.World
      end
    end

    js_code = """
      import * as World from 'hello/world';
    """

    assert_translation(ex_ast, js_code)

  end
end