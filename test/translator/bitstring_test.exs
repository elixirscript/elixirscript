defmodule ElixirScript.Translator.Bitstring.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate bitstring" do
    ex_ast = quote do: <<1, 2, 3>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(1), Elixir.Core.BitString.integer(2), Elixir.Core.BitString.integer(3))")

    ex_ast = quote do: <<1, "foo">>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(1), Elixir.Core.BitString.binary('foo'))")

    ex_ast = quote do: <<1, "foo" :: binary>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(1), Elixir.Core.BitString.binary('foo'))")

    ex_ast = quote do: <<1, "foo" :: utf8, "bar" :: utf32>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(1), Elixir.Core.BitString.utf8('foo'), Elixir.Core.BitString.utf32('bar'))")

    ex_ast = quote do: <<102 :: integer-native, rest :: binary>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.native(Elixir.Core.BitString.integer(102)), Elixir.Core.BitString.binary(rest))")

    ex_ast = quote do: <<102 :: unsigned-big-integer, rest :: binary>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(Elixir.Core.BitString.big(Elixir.Core.BitString.unsigned(102))), Elixir.Core.BitString.binary(rest))")

    ex_ast = quote do: <<102, _rest :: size(16)>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(102), Elixir.Core.BitString.size(_rest, 16))")

    ex_ast = quote do: <<102, _rest :: size(16)-unit(4)>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(102), Elixir.Core.BitString.unit(Elixir.Core.BitString.size(_rest, 16), 4))")

    ex_ast = quote do: <<102, _rest :: 16 * 4>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(102), Elixir.Core.BitString.unit(Elixir.Core.BitString.size(_rest, 16), 4))")

    ex_ast = quote do: <<102, _rest :: _ * 4>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(102), Elixir.Core.BitString.unit(Elixir.Core.BitString.size(_rest, undefined), 4))")

    ex_ast = quote do: <<102, _rest :: 16>>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(102), Elixir.Core.BitString.size(_rest, 16))")

    ex_ast = quote do: << 1, <<2>> >>
    assert_translation(ex_ast, "new Elixir.Core.BitString(Elixir.Core.BitString.integer(1), new Elixir.Core.BitString(Elixir.Core.BitString.integer(2)))")
  end
end
