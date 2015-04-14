defmodule ElixirScript.Translator.Struct.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate struct" do
    ex_ast = quote do
      defmodule User do
        defstruct name: "john", age: 27
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      export function defstruct(name = 'john', age = 27){
        return {__struct__: __MODULE__, name: name, age: age};
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule User do
        defstruct :name, :age
      end
    end

    js_code = """
      const __MODULE__ = Atom('User');

      export function defstruct(name, age){
        return {__struct__: __MODULE__, name: name, age: age};
      }
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate struct creation" do
    ex_ast = quote do
      user = %User{}
    end

    js_code = """
      let user = User.defstruct();
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      user = %User{name: "John"}
    end

    js_code = """
      let user = User.defstruct(name='John');
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate struct update" do
    ex_ast = quote do
      user = %{ map | key: value }
    end

    js_code = """
      let user = (function(){
          let _results = JSON.parse(JSON.stringify(map));

          _results.key = value;

          return _results;
        }());;
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      user = %{ map | key: value, key1: value1 }
    end

    js_code = """
      let user = (function(){
          let _results = JSON.parse(JSON.stringify(map));

          _results.key = value;
          _results.key1 = value1;

          return _results;
        }());;
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
      const __MODULE__ = Atom('MyAppError');

      export function defexception(message = 'This is a message'){
        return {__struct__: __MODULE__, message: message};
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule MyAppError do
        defexception [:message]
      end
    end

    js_code = """
      const __MODULE__ = Atom('MyAppError');

      export function defexception(message = null){
        return {__struct__: __MODULE__, message: message};
      }
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate raise exception" do
    ex_ast = quote do
      raise MyAppError, message: "did not get what was expected"
    end

    js_code = """
      throw new MyAppError(MyAppError.defexception(message='did not get what was expected'));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      raise "did not get what was expected"
    end

    js_code = """
      throw new RuntimeError({__struct__: Atom('RuntimeError'), message: 'did not get what was expected'});
    """

    assert_translation(ex_ast, js_code)

  end
end