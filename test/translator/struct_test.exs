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
    const __struct__ = function(values = {}) {
        const allowed_keys = [Symbol.for('name'), Symbol.for('age')]

        const value_keys = Object.keys(values)

        const every_call_result = value_keys.every(function(key) {
            return allowed_keys.includes(key);
        })

        if (every_call_result) {
            return Object.assign({}, {
                [Symbol.for('__struct__')]: Symbol.for('Elixir.User'),
                [Symbol.for('name')]: 'john',
                [Symbol.for('age')]: 27
            }, values);
        } else {
            throw 'Unallowed key found';
        }
    };
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
    const __struct__ = function(values = {}) {
        const allowed_keys = [Symbol.for('name'), Symbol.for('age')]

        const value_keys = Object.keys(values)

        const every_call_result = value_keys.every(function(key) {
            return allowed_keys.includes(key);
        })

        if (every_call_result) {
            return Object.assign({}, {
                [Symbol.for('__struct__')]: Symbol.for('Elixir.User'),
                [Symbol.for('name')]: null,
                [Symbol.for('age')]: null
            }, values);
        } else {
            throw 'Unallowed key found';
        }
    };
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
    Elixir.User.__load(Elixir).__struct__(Object.freeze({})
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule User do
        defstruct [:name, :age]
      end

      user = %User{name: "John"}
    end

    js_code = """
    Elixir.User.__load(Elixir).__struct__(Object.freeze({[Symbol.for('name')]: 'John'})
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate struct update" do
    ex_ast = quote do
      map = %{key: nil}
      user = %{ map | key: 1 }
    end

    js_code = """
    let [user] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(), Object.freeze(Object.assign({}, map, Object.freeze({
        [Symbol.for('key')]: 1
    }))));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      map = %{key: nil, key1: nil}
      user = %{ map | key: 1, key1: 11 }
    end

    js_code = """
    let [user] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(), Object.freeze(Object.assign({}, map, Object.freeze({
        [Symbol.for('key')]: 1,
        [Symbol.for('key1')]: 11
    }))));
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
    const __struct__ = function(values = {}) {
        const allowed_keys = [Symbol.for('message'), Symbol.for('__exception__')]

        const value_keys = Object.keys(values)

        const every_call_result = value_keys.every(function(key) {
            return allowed_keys.includes(key);
        })

        if (every_call_result) {
            return Object.assign({}, {
                [Symbol.for('__struct__')]: Symbol.for('Elixir.MyAppError'),
                [Symbol.for('message')]: 'This is a message',
                [Symbol.for('__exception__')]: true
            }, values);
        } else {
            throw 'Unallowed key found';
        }
    };
     """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule MyAppError do
        defexception [:message]
      end
    end

    js_code = """
    const __struct__ = function(values = {}) {
        const allowed_keys = [Symbol.for('message'), Symbol.for('__exception__')]

        const value_keys = Object.keys(values)

        const every_call_result = value_keys.every(function(key) {
            return allowed_keys.includes(key);
        })

        if (every_call_result) {
            return Object.assign({}, {
                [Symbol.for('__struct__')]: Symbol.for('Elixir.MyAppError'),
                [Symbol.for('message')]: null,
                [Symbol.for('__exception__')]: true
            }, values);
        } else {
            throw 'Unallowed key found';
        }
    };
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
    throw Elixir.MyAppError.__load(Elixir).__struct__(Object.freeze({
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
