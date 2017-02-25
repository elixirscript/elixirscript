defmodule ElixirScript.Translator.Bitstring.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate bitstring" do
    ex_ast = quote do: <<1, 2, 3>>
    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(1), Bootstrap.Core.BitString.integer(2), Bootstrap.Core.BitString.integer(3))")

    ex_ast = quote do: <<1, "foo">>
    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(1), Bootstrap.Core.BitString.binary('foo'))")

    ex_ast = quote do: <<1, "foo" :: binary>>
    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(1), Bootstrap.Core.BitString.binary('foo'))")

    ex_ast = quote do: <<1, "foo" :: utf8, "bar" :: utf32>>
    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(1), Bootstrap.Core.BitString.utf8('foo'), Bootstrap.Core.BitString.utf32('bar'))")

    ex_ast = quote do
       rest = "oo"
       <<102 :: integer-native, rest :: binary>>
    end
    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.native(Bootstrap.Core.BitString.integer(102)), Bootstrap.Core.BitString.binary(rest))")

    ex_ast = quote do
      rest = "oo"
      <<102 :: unsigned-big-integer, rest :: binary>>
    end
    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(Bootstrap.Core.BitString.big(Bootstrap.Core.BitString.unsigned(102))), Bootstrap.Core.BitString.binary(rest))")

    ex_ast = quote do
      rest = 100
       <<102, rest :: size(16)>>
    end

    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(102), Bootstrap.Core.BitString.size(rest, 16))")

    ex_ast = quote do
      rest = 100
       <<102, rest :: size(16)-unit(4)>>
    end

    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(102), Bootstrap.Core.BitString.unit(Bootstrap.Core.BitString.size(rest, 16), 4))")

    ex_ast = quote do
      rest = 100
       <<102, rest :: 16 * 4>>
      end

    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(102), Bootstrap.Core.BitString.unit(Bootstrap.Core.BitString.size(rest, 16), 4))")

    ex_ast = quote do
      rest = 100
       <<102, rest :: 16>>
      end

    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(102), Bootstrap.Core.BitString.size(rest, 16))")

    ex_ast = quote do: << 1, <<2>> >>
    assert_translation(ex_ast, "new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(1), new Bootstrap.Core.BitString(Bootstrap.Core.BitString.integer(2)))")
  end

  test "translate pattern matching bitstring" do
    ex_ast = quote do: <<name::binary-size(5), " the ", species::binary>> = <<"Frank the Walrus">>
    js_code = """
    let [name,species] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.bitStringMatch(Bootstrap.Core.BitString.size(Bootstrap.Core.BitString.binary({
    'value': Bootstrap.Core.Patterns.variable()
    }),5),Bootstrap.Core.BitString.binary(' the '),Bootstrap.Core.BitString.binary({
    'value': Bootstrap.Core.Patterns.variable()
    })),'Frank the Walrus');
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: <<int::integer>> = <<-100>>
    js_code = """
    let [int] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.bitStringMatch(Bootstrap.Core.BitString.integer({
    'value': Bootstrap.Core.Patterns.variable()
    })),new Bootstrap.Core.BitString(Bootstrap.Core.BitString.binary(-100)));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: <<-100::signed, _rest::binary>> = <<-100, "foo">>
    js_code = """
    let [_rest] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.bitStringMatch(Bootstrap.Core.BitString.signed(-100),Bootstrap.Core.BitString.binary({
    'value': Bootstrap.Core.Patterns.variable()
    })),new Bootstrap.Core.BitString(Bootstrap.Core.BitString.binary(-100),Bootstrap.Core.BitString.binary('foo')));
    """

    assert_translation(ex_ast, js_code)
  end

end
