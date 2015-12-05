defmodule ElixirScript.Translator.Struct.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate struct with default values" do
    ex_ast = quote do
      defmodule User do
        defstruct name: "john", age: 27
      end
    end

    js_code = """
        const __MODULE__ = Elixir.Kernel.SpecialForms.atom('User');

        const defstruct = Elixir.Kernel.defstruct({
          [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__,     [Elixir.Kernel.SpecialForms.atom('name')]: 'john',     [Elixir.Kernel.SpecialForms.atom('age')]: 27
        });

        export {
          User: defstruct
        };
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate struct without default values" do

    ex_ast = quote do
      defmodule User do
        defstruct :name, :age
      end
    end

    js_code = """
     const __MODULE__ = Elixir.Kernel.SpecialForms.atom('User');
     const defstruct = Elixir.Kernel.defstruct({
         [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__,
         [Elixir.Kernel.SpecialForms.atom('name')]: null,
         [Elixir.Kernel.SpecialForms.atom('age')]: null
     });

     export {
       User: defstruct
     };
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate struct creation" do
    ex_ast = quote do
      defmodule User do
        defstruct :name, :age
      end

      user = %User{}
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('User');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__,
        [Elixir.Kernel.SpecialForms.atom('name')]: null,
        [Elixir.Kernel.SpecialForms.atom('age')]: null
    });
    export {
        User: defstruct
    };

    let [user] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(), User.User.create(Elixir.Kernel.SpecialForms.map({})));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule User do
        defstruct :name, :age
      end

      user = %User{name: "John"}
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('User');
    const defstruct = Elixir.Kernel.defstruct({
        [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__,
        [Elixir.Kernel.SpecialForms.atom('name')]: null,
        [Elixir.Kernel.SpecialForms.atom('age')]: null
    });
    export {
        User: defstruct
    };

     let [user] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(), User.User.create(Elixir.Kernel.SpecialForms.map({
             [Elixir.Kernel.SpecialForms.atom('name')]: 'John'
       })));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate struct update" do
    ex_ast = quote do
      user = %{ map | key: value }
    end

    js_code = """
     let [user] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Kernel.SpecialForms.map_update(map,{
             [Elixir.Kernel.SpecialForms.atom('key')]: value
       }));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      user = %{ map | key: value, key1: value1 }
    end

    js_code = """
     let [user] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Kernel.SpecialForms.map_update(map,{
             [Elixir.Kernel.SpecialForms.atom('key')]: value,     [Elixir.Kernel.SpecialForms.atom('key1')]: value1
       }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate defexception" do
    ex_ast = quote do
      defmodule MyAppError do
        defexception message: "This is a message"
      end
    end

    js_code = """
     const __MODULE__ = Elixir.Kernel.SpecialForms.atom('MyAppError');
     const defexception = Elixir.Kernel.defexception({
          [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__,
          [Elixir.Kernel.SpecialForms.atom('__exception__')]: true,
          [Elixir.Kernel.SpecialForms.atom('message')]: 'This is a message'
     });
     export {
       MyAppError: defexception
     };
     """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule MyAppError do
        defexception [:message]
      end
    end

    js_code = """
      const __MODULE__ = Elixir.Kernel.SpecialForms.atom('MyAppError');
      const defexception = Elixir.Kernel.defexception({
             [Elixir.Kernel.SpecialForms.atom('__struct__')]: __MODULE__,
             [Elixir.Kernel.SpecialForms.atom('__exception__')]: true,
             [Elixir.Kernel.SpecialForms.atom('message')]: null
      });

      export {
        MyAppError: defexception
      };
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate raise exception" do
    ex_ast = quote do
      raise MyAppError, message: "did not get what was expected"
    end

    js_code = """
      throw MyAppError.defexception(message = 'did not get what was expected');
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      raise "did not get what was expected"
    end

    js_code = """
     throw     {
      [Elixir.Kernel.SpecialForms.atom('__struct__')]: Elixir.Kernel.SpecialForms.atom('RuntimeError'),
      [Elixir.Kernel.SpecialForms.atom('__exception__')]: true,
      [Elixir.Kernel.SpecialForms.atom('message')]: 'did not get what was expected'
           };
    """

    assert_translation(ex_ast, js_code)

  end
end
