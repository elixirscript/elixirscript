defmodule ElixirScript.Translator.Bitstring.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate bitstring" do
    ex_ast = quote do: <<1, 2, 3>>
    assert_translation(ex_ast, "BitString(BitString.integer(1), BitString.integer(2), BitString.integer(3))")

    ex_ast = quote do: <<1, "foo">>
    assert_translation(ex_ast, "BitString(BitString.integer(1), BitString.binary('foo'))")

    ex_ast = quote do: <<1, "foo" :: binary>>
    assert_translation(ex_ast, "BitString(BitString.integer(1), BitString.binary('foo'))")

    ex_ast = quote do: <<1, "foo" :: utf8, "bar" :: utf32>>
    assert_translation(ex_ast, "BitString(BitString.integer(1), BitString.utf8('foo'), BitString.utf32('bar'))")

    ex_ast = quote do: <<102 :: integer-native, rest :: binary>>
    assert_translation(ex_ast, "BitString(BitString.native(BitString.integer(102)), BitString.binary(rest))")

    ex_ast = quote do: <<102 :: unsigned-big-integer, rest :: binary>>
    assert_translation(ex_ast, "BitString(BitString.integer(BitString.big(BitString.unsigned(102))), BitString.binary(rest))")

    ex_ast = quote do: <<102, _rest :: size(16)>>
    assert_translation(ex_ast, "BitString(BitString.integer(102), BitString.size(_rest, 16))")

    ex_ast = quote do: <<102, _rest :: size(16)-unit(4)>>
    assert_translation(ex_ast, "BitString(BitString.integer(102), BitString.unit(BitString.size(_rest, 16), 4))")

    ex_ast = quote do: <<102, _rest :: 16 * 4>>
    assert_translation(ex_ast, "BitString(BitString.integer(102), BitString.unit(BitString.size(_rest, 16), 4))")

    ex_ast = quote do: <<102, _rest :: _ * 4>>
    assert_translation(ex_ast, "BitString(BitString.integer(102), BitString.unit(BitString.size(_rest, undefined), 4))")

    ex_ast = quote do: <<102, _rest :: 16>>
    assert_translation(ex_ast, "BitString(BitString.integer(102), BitString.size(_rest, 16))")

    ex_ast = quote do: << 1, <<2>> >>
    assert_translation(ex_ast, "BitString(BitString.integer(1), BitString(BitString.integer(2)))")
  end


  should "translate bitstring pattern match" do
    ex_ast = quote do: <<-100 :: signed, _rest :: binary>> = <<-100, "foo">>
    js_code = """
      var _rest;

      //check if sizes match. if so then 
      if(Kernel.match(BitString(BitString.signed(-100)), 
        BitString(BitString.integer(-100), BitString.binary("foo")))){
        _rest = BitString(BitString.integer(-100), BitString.binary("foo"))).value.slice(1, 3);
      }else{
        throw new MatchError(no match of right hand side value)
      }

    """

    ex_ast = quote do: <<val, _rest :: binary>> = <<-100, "foo">>
    js_code = """
      var _rest;

      if(Kernel.match(BitString(BitString.signed(-100)), 
        BitString(BitString.integer(-100), BitString.binary("foo")))){
        _rest = BitString(BitString.integer(-100), BitString.binary("foo"))).value.slice(1, 3);
      }else{
        throw new MatchError(no match of right hand side value)
      }

    """


    

    ex_ast = quote do: <<102, _rest :: size(16)>> = "foo"
    js_code = """
      var _rest;

      if(Kernel.match(BitString(BitString.integer(102), BitString.size(_rest, 16)), BitString(BitString.binary("foo")).value)){
        _rest = BitString(BitString.binary("foo")).value.slice(1, 3);
      }else{
        throw new MatchError(no match of right hand side value)
      }

    """
    assert_translation(ex_ast, js_code)

    #<<102, _rest :: size(2)-unit(8)>> = "foo"

    #<<102, _rest :: size(32)>> = "foo"

    #<< x :: 8 >> == << x :: size(8) >>

    #<< x :: 8 * 4 >> == << x :: size(8)-unit(4) >>

    #<< x :: _ * 4 >> == << x :: unit(4) >>
  end
end