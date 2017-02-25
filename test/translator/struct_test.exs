defmodule ElixirScript.Translator.Struct.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate struct with default values" do
    ex_ast = quote do
      defmodule User do
        defstruct name: "john", age: 27
      end
    end

    js_code = """
        const Elixir$User = Bootstrap.Core.Functions.defstruct({
          [Symbol.for('__struct__')]: Symbol.for('Elixir.User'),
          [Symbol.for('name')]: 'john',
          [Symbol.for('age')]: 27
        });
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate struct without default values" do

    ex_ast = quote do
      defmodule User do
        defstruct [:name, :age]
      end
    end

    js_code = """
    const Elixir$User = Bootstrap.Core.Functions.defstruct({
      [Symbol.for('__struct__')]: Symbol.for('Elixir.User'),
      [Symbol.for('name')]: null,
      [Symbol.for('age')]: null
    });
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate struct creation" do
    ex_ast = quote do
      defmodule User do
        defstruct [:name, :age]
      end

      user = %User{}
    end

    js_code = """
    const Elixir$User = Bootstrap.Core.Functions.defstruct({
        [Symbol.for('__struct__')]: Symbol.for('Elixir.User'),
        [Symbol.for('name')]: null,
        [Symbol.for('age')]: null
    });
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule User do
        defstruct [:name, :age]
      end

      user = %User{name: "John"}
    end

    js_code = """
    const Elixir$User = Bootstrap.Core.Functions.defstruct({
      [Symbol.for('__struct__')]: Symbol.for('Elixir.User'),
      [Symbol.for('name')]: null,
      [Symbol.for('age')]: null
    });

    """

    assert_translation(ex_ast, js_code)
  end

  test "translate struct update" do
    ex_ast = quote do
      map = %{key: nil}
      user = %{ map | key: 1 }
    end

    js_code = """
         let [user] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),Bootstrap.Core.SpecialForms.map_update(map,Object.freeze({
             [Symbol.for('key')]: 1
       })));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      map = %{key: nil, key1: nil}
      user = %{ map | key: 1, key1: 11 }
    end

    js_code = """
    let [user] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),Bootstrap.Core.SpecialForms.map_update(map,Object.freeze({
      [Symbol.for('key')]: 1,     [Symbol.for('key1')]: 11
    })));
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate defexception" do
    ex_ast = quote do
      defmodule MyAppError do
        defexception message: "This is a message"
      end
    end

    js_code = """
     const Elixir$MyAppError = Bootstrap.Core.Functions.defexception({
          [Symbol.for('__struct__')]: Symbol.for('Elixir.MyAppError'),
          [Symbol.for('__exception__')]: true,
          [Symbol.for('message')]: 'This is a message'
     });
     """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule MyAppError do
        defexception [:message]
      end
    end

    js_code = """
      const Elixir$MyAppError = Bootstrap.Core.Functions.defexception({
             [Symbol.for('__struct__')]: Symbol.for('Elixir.MyAppError'),
             [Symbol.for('__exception__')]: true,
             [Symbol.for('message')]: null
      });
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate raise exception" do
    ex_ast = quote do
      defmodule MyAppError do
        defexception [:message]

        def do_it() do
          raise MyAppError, message: "did not get what was expected"
        end

      end
    end

    js_code = """
    throw Elixir$MyAppError.Elixir$MyAppError.create(Object.freeze({
    [Symbol.for('message')]: 'did not get what was expected'
    }));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
        def do_it() do
          raise "did not get what was expected"
        end

    end

    js_code = """
     throw {
      [Symbol.for('__struct__')]: Symbol.for('RuntimeError'),
      [Symbol.for('__exception__')]: true,
      [Symbol.for('message')]: 'did not get what was expected'
     };
    """

    assert_translation(ex_ast, js_code)

  end
end
