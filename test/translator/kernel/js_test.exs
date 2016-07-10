
defmodule ElixirScript.Translator.JS.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "JS.function" do
    ex_ast = quote do
      JS.function hello(name) do
        "Hello #{name}"
      end
    end

    js_code = """
    function hello(name){
    return 'Hello ' + Elixir$ElixirScript$String$Chars.to_string(name);
    }
    """

    assert_translation(ex_ast, js_code)
  end

  test "JS.function without name" do
    ex_ast = quote do
      JS.function(name) do
        "Hello #{name}"
      end
    end

    js_code = """
    function(name){
    return 'Hello ' + Elixir$ElixirScript$String$Chars.to_string(name);
    }
    """

    assert_translation(ex_ast, js_code)
  end

  test "JS.generator" do
    ex_ast = quote do
      JS.generator hello(name) do
        JS.yield "Hello #{name}"
      end
    end

    js_code = """
    function* hello(name){
    return yield 'Hello ' + Elixir$ElixirScript$String$Chars.to_string(name);
    }
    """

    assert_translation(ex_ast, js_code)
  end

  test "JS.generator without name" do
    ex_ast = quote do
      JS.generator(name) do
        JS.yield "Hello #{name}"
      end
    end

    js_code = """
    function* (name){
    return yield 'Hello ' + Elixir$ElixirScript$String$Chars.to_string(name);
    }
    """

    assert_translation(ex_ast, js_code)
  end

  test "JS.async" do
    ex_ast = quote do
      JS.async hello(name) do
        JS.await "Hello #{name}"
      end
    end

    js_code = """
    async function hello(name){
    return await 'Hello ' + Elixir$ElixirScript$String$Chars.to_string(name);
    }
    """

    assert_translation(ex_ast, js_code)
  end

  test "JS.async without name" do
    ex_ast = quote do
      JS.async(name) do
        JS.await "Hello #{name}"
      end
    end

    js_code = """
    async function(name){
    return await 'Hello ' + Elixir$ElixirScript$String$Chars.to_string(name);
    }
    """

    assert_translation(ex_ast, js_code)
  end
end
