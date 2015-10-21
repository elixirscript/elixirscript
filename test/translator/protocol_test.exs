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
    const __MODULE__ = Elixir.Kernel.SpecialForms.atom('ElixirScript.Collectable');

    let Collectable = Elixir.Kernel.defprotocol({
      into: Elixir.Patterns.defmatch(
        Elixir.Patterns.make_case([Elixir.Patterns.variable()], function(collectable){
          return null;
        })
      )
    });

    export default Collectable;
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
         const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Blank');
         let Blank = Elixir.Kernel.defprotocol({
             blank__qmark__: Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Patterns.variable()],function(data)    {
             return     null;
           }))
       });
         Elixir.Kernel.defimpl(Blank,Elixir.Kernel.is_list,{
             blank__qmark__: Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.list()],function()    {
             return     true;
           }),Elixir.Patterns.make_case([Elixir.Patterns.wildcard()],function()    {
             return     false;
           }))
       })
         Elixir.Kernel.defimpl(Blank,Elixir.Kernel.is_atom,{
             blank__qmark__: Elixir.Patterns.defmatch(Elixir.Patterns.make_case([false],function()    {
             return     true;
           }),Elixir.Patterns.make_case([null],function()    {
             return     true;
           }),Elixir.Patterns.make_case([Elixir.Patterns.wildcard()],function()    {
             return     false;
           }))
       })
         Elixir.Kernel.defimpl(Blank,Elixir.Kernel.is_integer,{
             blank__qmark__: Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Patterns.variable()],function(number)    {
             return     false;
           }))
       })
         export default Blank;
    """

    assert_translation(ex_ast, js_code)
  end

end