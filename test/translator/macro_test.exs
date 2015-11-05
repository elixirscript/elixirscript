defmodule ElixirScript.Translator.Macro.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate macro" do
    ex_ast = quote do
      defmodule Elephant do
        defmacro squared(x) do
          quote do
            unquote(x) * unquote(x)
          end
        end

        def do_squared() do
          squared(2)
        end
      end
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');

    const do_squared = Elixir.Patterns.defmatch(
      Elixir.Patterns.make_case(
        [], function() { return 2 * 2; }
      )
    );

    export {
      do_squared
    };
    """

    assert_translation(ex_ast, js_code)
  end


  should "translate macro with bind_quoted" do
    ex_ast = quote do
      defmodule Elephant do

        defmacro squared(x) do
          quote bind_quoted: [x: x] do
            x * x
          end
        end

        def do_squared() do
          squared(2)
        end
      end
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');

    const do_squared = Elixir.Patterns.defmatch(
      Elixir.Patterns.make_case(
        [], function() { return 2 * 2; }
      )
    );

    export {
      do_squared
    };
    """

    assert_translation(ex_ast, js_code)
  end


  should "translate macro with variable from unquote" do
    ex_ast = quote do
      defmodule Elephant do
        defmacro squared(x) do
          quote do
            x = unquote(x)
            x * x
          end
        end

        def do_squared() do
          squared(2)
        end
      end
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');

    const do_squared = Elixir.Patterns.defmatch(
      Elixir.Patterns.make_case(
        [], function() {
            let [x] = Elixir.Patterns.match(Elixir.Patterns.variable(), 2);
            return     x * x;
        }
      )
    );

    export {
      do_squared
    };
    """

    assert_translation(ex_ast, js_code)
  end

end
