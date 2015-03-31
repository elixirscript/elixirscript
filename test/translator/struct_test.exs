defmodule ExToJS.Translator.Struct.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate struct" do
    ex_ast = quote do
      defmodule User do
        defstruct name: "john", age: 27
      end
    end

    js_code = """
      const __MODULE__ = Symbol('User');

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
      const __MODULE__ = Symbol('User');

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
end