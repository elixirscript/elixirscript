defmodule ElixirScript.Translator.For.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate simple for" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], do: n * 2
    end

    js_code = """
    Bootstrap.Core.SpecialForms._for(
      Bootstrap.Core.Patterns.clause(
        [Bootstrap.Core.Patterns.variable()],
        function(n) {
          return n * 2;
        },
        function() {
          return true;
        }
      ),
      [
        Bootstrap.Core.Patterns.list_generator(
          Bootstrap.Core.Patterns.variable(),
          Object.freeze([1, 2, 3, 4])
        )
      ],
      Elixir.ElixirScript.Collectable.__load(Elixir),
      Object.freeze([])
    )
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate simple for with into" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], into: [], do: n * 2
    end

    js_code = """
    Bootstrap.Core.SpecialForms._for(
      Bootstrap.Core.Patterns.clause(
        [Bootstrap.Core.Patterns.variable()],
        function(n) {
          return n * 2;
        },
        function() {
          return true;
        }
      ),
      [
        Bootstrap.Core.Patterns.list_generator(
          Bootstrap.Core.Patterns.variable(),
          Object.freeze([1, 2, 3, 4])
        )
      ],
      Elixir.ElixirScript.Collectable.__load(Elixir),
      Object.freeze([])
    )
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate multiple generator for" do
    ex_ast = quote do
      for x <- [1, 2], y <- [2, 3], do: x*y
    end

    js_code = """
    Bootstrap.Core.SpecialForms._for(
      Bootstrap.Core.Patterns.clause(
        [Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()],
        function(x, y) {
          return x * y;
        },
        function() {
          return true;
        }
      ),
      [
        Bootstrap.Core.Patterns.list_generator(
          Bootstrap.Core.Patterns.variable(),
          Object.freeze([1, 2])
        ),
        Bootstrap.Core.Patterns.list_generator(
          Bootstrap.Core.Patterns.variable(),
          Object.freeze([2, 3])
        )
      ],
      Elixir.ElixirScript.Collectable.__load(Elixir),
      Object.freeze([])
    )
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate multiple generator for, assignment, and do block" do
    ex_ast = quote do
      r = for x <- [1, 2], y <- [2, 3] do
        x*y
      end
    end

    js_code = """
    let [r] = Bootstrap.Core.Patterns.match(
      Bootstrap.Core.Patterns.variable(),
      Bootstrap.Core.SpecialForms._for(
        Bootstrap.Core.Patterns.clause(
          [Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()],
          function(x, y) {
            return x * y;
          },
          function() {
            return true;
          }
        ),
        [
          Bootstrap.Core.Patterns.list_generator(
            Bootstrap.Core.Patterns.variable(),
            Object.freeze([1, 2])
          ),
          Bootstrap.Core.Patterns.list_generator(
            Bootstrap.Core.Patterns.variable(),
            Object.freeze([2, 3])
          )
        ],
        Elixir.ElixirScript.Collectable.__load(Elixir),
        Object.freeze([])
      )
    );
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate for with filter" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
    end

    js_code = """
    Bootstrap.Core.SpecialForms._for(
      Bootstrap.Core.Patterns.clause(
        [Bootstrap.Core.Patterns.variable()],
        function(n) {
          return n;
        },
        function(n) {
          return n % 2 == 0;
        }
      ),
      [
        Bootstrap.Core.Patterns.list_generator(
          Bootstrap.Core.Patterns.variable(),
          Object.freeze([1, 2, 3, 4, 5, 6])
        )
      ],
      Elixir.ElixirScript.Collectable.__load(Elixir),
      Object.freeze([])
    )
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate for with pattern matched input" do
    ex_ast = quote do
      for {:user, name} <- [user: "john", admin: "john", user: "meg"] do
        Elixir.String.upcase(name)
      end
    end

    js_code = """
    Bootstrap.Core.SpecialForms._for(
      Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
            values: [Symbol.for('user'), Bootstrap.Core.Patterns.variable()]
        })], function(name) {
            return Elixir.ElixirScript.String.__load(Elixir).upcase(name);
        }, function() {
            return true;
        }),
        [
          Bootstrap.Core.Patterns.list_generator(Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
            values: [Symbol.for('user'), Bootstrap.Core.Patterns.variable()]
        }), Object.freeze([new Bootstrap.Core.Tuple(Symbol.for('user'), 'john'), new Bootstrap.Core.Tuple(Symbol.for('admin'), 'john'), new Bootstrap.Core.Tuple(Symbol.for('user'), 'meg')]))
        ],
        Elixir.ElixirScript.Collectable.__load(Elixir),
        Object.freeze([]))
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate for with bitstring" do
    ex_ast = quote do
      pixels = <<1, 2, 3, 4, 5, 6>>
      for <<r::8, g::8, b::8 <- pixels >> do
        {r, g, b}
      end
    end

    js_code = """
     Bootstrap.Core.SpecialForms._for(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.bitStringMatch(Bootstrap.Core.BitString.size({
         'value': Bootstrap.Core.Patterns.variable()
     }, 8), Bootstrap.Core.BitString.size({
         'value': Bootstrap.Core.Patterns.variable()
     }, 8), Bootstrap.Core.BitString.size({
         'value': Bootstrap.Core.Patterns.variable()
     }, 8))], function(r, g, b) {
         return new Bootstrap.Core.Tuple(r, g, b);
     }, function() {
         return true;
     }), [Bootstrap.Core.Patterns.bitstring_generator(Bootstrap.Core.Patterns.bitStringMatch(Bootstrap.Core.BitString.size({
         'value': Bootstrap.Core.Patterns.variable()
     }, 8), Bootstrap.Core.BitString.size({
         'value': Bootstrap.Core.Patterns.variable()
     }, 8), Bootstrap.Core.BitString.size({
         'value': Bootstrap.Core.Patterns.variable()
     }, 8)), pixels)], Elixir.ElixirScript.Collectable.__load(Elixir), Object.freeze([]))
    """

    assert_translation(ex_ast, js_code)
  end
end
