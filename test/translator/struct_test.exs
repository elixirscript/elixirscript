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

      export class User {
        constructor(name = 'john', age = 27){
          this.name = name;
          this.age = age;
        }
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

      export class User {
        constructor(name, age){
          this.name = name;
          this.age = age;
        }
      }
    """

    assert_translation(ex_ast, js_code)

  end
end