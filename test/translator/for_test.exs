defmodule ElixirScript.Translator.For.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple for" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], do: n * 2
    end

    js_code = """
     Elixir.Kernel.SpecialForms._for(Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(),Elixir.Kernel.SpecialForms.list(1,2,3,4))),function(n)    {
             return     n * 2;
           },function()    {
             return     true;
           },Elixir.Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate simple for with into" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], into: [], do: n * 2
    end

    js_code = """
     Elixir.Kernel.SpecialForms._for(Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(),Elixir.Kernel.SpecialForms.list(1,2,3,4))),function(n)    {
             return     n * 2;
           },function()    {
             return     true;
           },Elixir.Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with string" do
    ex_ast = quote do
      for n <- "Opera", do: n
    end

    js_code = """
     Elixir.Kernel.SpecialForms._for(Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(),'Opera')),function(n)    {
             return     n;
           },function()    {
             return     true;
           },Elixir.Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate multiple generator for" do
    ex_ast = quote do
      for x <- [1, 2], y <- [2, 3], do: x*y
    end

    js_code = """
     Elixir.Kernel.SpecialForms._for(Elixir.Kernel.SpecialForms.list(
      Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(), Elixir.Kernel.SpecialForms.list(1,2)),
      Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(), Elixir.Kernel.SpecialForms.list(2,3))), function(x,y)    {
             return     x * y;
           },function()    {
             return     true;
           },Elixir.Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate multiple generator for, assignment, and do block" do
    ex_ast = quote do
      r = for x <- [1, 2], y <- [2, 3] do
        x*y
      end
    end

    js_code = """
     let [r] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Kernel.SpecialForms._for(Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(),Elixir.Kernel.SpecialForms.list(1,2)),Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(),Elixir.Kernel.SpecialForms.list(2,3))),function(x,y)    {
             return     x * y;
           },function()    {
             return     true;
           },Elixir.Kernel.SpecialForms.list()));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with filter" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
    end

    js_code = """
     Elixir.Kernel.SpecialForms._for(Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(),Elixir.Kernel.SpecialForms.list(1,2,3,4,5,6))),function(n)    {
             return n;
           },function(n)    {
             return n % 2 == 0;
           },Elixir.Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with pattern matched input" do
    ex_ast = quote do
      for {:user, name} <- [user: "john", admin: "john", user: "meg"] do
        Elixir.String.upcase(name)
      end
    end

    js_code = """
    Elixir.Kernel.SpecialForms._for(Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
        values: [Elixir.Kernel.SpecialForms.atom('user'), Elixir.Core.Patterns.variable()]
  }),Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('user'),'john'),Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('admin'),'john'),Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('user'),'meg')))),function(name)    {
        return     Elixir.String.upcase(name);
      },function()    {
        return     true;
      },Elixir.Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end
end
