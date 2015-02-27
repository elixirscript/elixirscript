defmodule ExToJS.Translator.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate nil" do
    ex_ast = quote do: nil
    assert ex_ast_to_js(ex_ast) == "null"
  end

  test "translate numbers" do
    ex_ast = quote do: 1
    assert ex_ast_to_js(ex_ast) == "1"

    ex_ast = quote do: 1.1
    assert ex_ast_to_js(ex_ast) == "1.1"

    ex_ast = quote do: -1.1
    assert ex_ast_to_js(ex_ast) == "-1.1"
  end

  test "translate string" do
    ex_ast = quote do: "Hello"
    assert ex_ast_to_js(ex_ast) == "'Hello'"
  end

  test "translate atom" do
    ex_ast = quote do: :atom
    assert ex_ast_to_js(ex_ast) == "Symbol('atom')"
  end

  test "translate list" do
    ex_ast = quote do: [1, 2, 3]
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "[1,2,3]"

    ex_ast = quote do: ["a", "b", "c"]
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "['a','b','c']"

    ex_ast = quote do: [:a, :b, :c]
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "[Symbol('a'),Symbol('b'),Symbol('c')]"

    ex_ast = quote do: [:a, 2, "c"]
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "[Symbol('a'),2,'c']"
  end

  test "translate tuple" do
    ex_ast = quote do: {1, 2, 3}
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "[1,2,3]"

    ex_ast = quote do: {"a", "b", "c"}
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "['a','b','c']"

    ex_ast = quote do: {:a, :b, :c}
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "[Symbol('a'),Symbol('b'),Symbol('c')]"

    ex_ast = quote do: {:a, 2, "c"}
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "[Symbol('a'),2,'c']"
  end

  test "translate assignment" do
    ex_ast = quote do: a = 1
    assert ex_ast_to_js(ex_ast) == "let a = 1;"

    ex_ast = quote do: a = :atom
    assert ex_ast_to_js(ex_ast) == "let a = Symbol('atom');"

    ex_ast = quote do: {a, b} = {1, 2}
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "[a,b]=[1,2]"
  end

  test "translate functions" do
    ex_ast = quote do
      def test1() do
      end
    end
    assert ex_ast_to_js(ex_ast) |> strip_new_lines  == "export function test1() {}"

    ex_ast = quote do
      def test1(alpha, beta) do
      end
    end
    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "export function test1(alpha, beta) {}"

    ex_ast = quote do
      def test1(alpha, beta) do
        a = alpha
      end
    end
    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "export function test1(alpha, beta) {    let a = alpha;}"
  end

  test "translate function calls" do
    ex_ast = quote do
      test1()
    end
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "this.test1()"

    ex_ast = quote do
      test1(3, 2)
    end
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "this.test1(3,2)"

    ex_ast = quote do
      Taco.test1(3, 2)
    end
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "Taco.test1(3,2)"

    ex_ast = quote do
      Taco.test1(Taco.test2(), 2)
    end
    assert ex_ast_to_js(ex_ast) |> strip_spaces == "Taco.test1(Taco.test2(),2)"
  end

  test "translate defmodules" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    assert ex_ast_to_js(ex_ast) |> strip_new_lines == ""

    ex_ast = quote do
      defmodule Elephant do
        def something() do
        end

        defp something_else() do
        end
      end
    end

    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "export function something() {}function something_else() {}"

    ex_ast = quote do
      defmodule Elephant do
        alias Icabod.Crane

        def something() do
        end

        defp something_else() do
        end
      end
    end

    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "import * as Crane from 'icabod/crane';export function something() {}function something_else() {}"
  end

  test "translate anonymous functions" do
    ex_ast = quote do
      Enum.map(list, fn(x) -> x * 2 end)
    end

    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "Enum.map(list, x =>    x * 2)"
  end

  test "translate if statement" do
    ex_ast = quote do
      if 1 == 1 do
        a = 1
      end
    end

    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "if (1 == 1) {    let a = 1;}"

    ex_ast = quote do
      if 1 == 1 do
        a = 1
      else
        a = 2
      end
    end

    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "if (1 == 1) {    let a = 1;} else {    let a = 2;}"
  end

  test "translate struct" do
    ex_ast = quote do
      defmodule User do
        defstruct name: "john", age: 27
      end
    end

    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "export class User {    constructor(name = 'john', age = 27) {        this.name = name;        this.age = age;    }}"

    ex_ast = quote do
      defmodule User do
        defstruct :name, :age
      end
    end

    assert ex_ast_to_js(ex_ast) |> strip_new_lines == "export class User {    constructor(name, age) {        this.name = name;        this.age = age;    }}"
  end
end