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
      Elixir.Patterns.make_case([], function(){
        return (function(){ return 2 * 2; }.call(this));
      })
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
      Elixir.Patterns.make_case([], function(){
        return (function(){ return 2 * 2; }.call(this));
      })
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
          squared(squared(2))
        end
      end
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elephant');

    const do_squared = Elixir.Patterns.defmatch(
      Elixir.Patterns.make_case([], function(){
        return (function() {
          let [x] = Elixir.Patterns.match(Elixir.Patterns.variable(), (function(){
            let [x] = Elixir.Patterns.match(Elixir.Patterns.variable(), 2);
            return x * x;
            }.call(this))
          );
          return x * x;

        }.call(this));
      })
    );

    export {
      do_squared
    };
    """

    assert_translation(ex_ast, js_code)
  end


  should "translate using" do
    ex_ast = quote do
      defmodule MyModule do
        defmacro __using__(opts) do
          quote do
            alias MyModule.Foo
            alias MyModule.Bar
            alias MyModule.Baz
            alias MyModule.Repo
          end
        end
      end

      defmodule AnotherModule do
        use MyModule
      end
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('MyModule');
    export {};

    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('AnotherModule');
    import * as Foo from 'my_module/foo';
    import * as Bar from 'my_module/bar';
    import * as Baz from 'my_module/baz';
    import * as Repo from 'my_module/repo';

    export {};
    """

    assert_translation(ex_ast, js_code)
  end

end
