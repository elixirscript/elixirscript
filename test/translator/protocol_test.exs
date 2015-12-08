defmodule ElixirScript.Translator.Protocol.Test do
  use ShouldI
  import ElixirScript.TestHelper

  test "parse protocol spec" do
    ex_ast = quote do
      defprotocol ElixirScript.Collectable do
        def into(collectable)
      end
    end

    js_code = """
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elixir.ElixirScript.Collectable');

    let Elixir$ElixirScript$Collectable = Elixir.Kernel.defprotocol({
      into: Elixir.Core.Patterns.defmatch(
        Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()], function(collectable){
          return null;
        })
      )
    });

    export default Elixir$ElixirScript$Collectable;
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate standard lib protocol defimpl" do
    ex_ast = quote do
      defimpl String.Chars, for: Duck do
        def to_string(duck), do: "quack"
      end
    end

    js_code = """
     Elixir.Kernel.defimpl(Elixir.String.Chars, Duck, {
             to_string: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(duck)    {
             return     'quack';
           }))
       })
    """

    assert_translation(ex_ast, js_code)
  end


  test "parse protocol spec with implementations" do
    ex_ast = quote do
      defprotocol Blank do
        def blank?(data)
      end

      defimpl Blank, for: Integer do
        def blank?(number), do: false
      end

      defimpl Blank, for: List do
        def blank?([]), do: true
        def blank?(_),  do: false
      end

      defimpl Blank, for: Atom do
        def blank?(false), do: true
        def blank?(nil),   do: true
        def blank?(_),     do: false
      end
    end

    js_code = """
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Elixir.Blank');
         let Elixir$Blank = Elixir.Kernel.defprotocol({
             blank__qmark__: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(data)    {
             return     null;
           }))
       });
         Elixir.Kernel.defimpl(Elixir$Blank, Array,{
             blank__qmark__: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.list()],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
             return     false;
           }))
       })
         Elixir.Kernel.defimpl(Elixir$Blank,Symbol,{
             blank__qmark__: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([false],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([null],function()    {
             return     true;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
             return     false;
           }))
       })
         Elixir.Kernel.defimpl(Elixir$Blank, Elixir.Core.Integer, {
             blank__qmark__: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
             return     false;
           }))
       })
         export default Elixir$Blank;
    """

    assert_translation(ex_ast, js_code)
  end

end
