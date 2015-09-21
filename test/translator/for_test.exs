defmodule ElixirScript.Translator.For.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple for" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], do: n * 2
    end

    js_code = """
     Kernel.SpecialForms._for(Kernel.SpecialForms.list(Kernel.SpecialForms.list(Patterns.variable(),Kernel.SpecialForms.list(1,2,3,4))),function(n)    {
             return     n * 2;
           },function()    {
             return     true;
           },Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate simple for with into" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], into: [], do: n * 2
    end

    js_code = """
     Kernel.SpecialForms._for(Kernel.SpecialForms.list(Kernel.SpecialForms.list(Patterns.variable(),Kernel.SpecialForms.list(1,2,3,4))),function(n)    {
             return     n * 2;
           },function()    {
             return     true;
           },Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with string" do
    ex_ast = quote do
      for n <- "Opera", do: n
    end

    js_code = """
     Kernel.SpecialForms._for(Kernel.SpecialForms.list(Kernel.SpecialForms.list(Patterns.variable(),'Opera')),function(n)    {
             return     n;
           },function()    {
             return     true;
           },Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate multiple generator for" do
    ex_ast = quote do
      for x <- [1, 2], y <- [2, 3], do: x*y
    end

    js_code = """
     Kernel.SpecialForms._for(Kernel.SpecialForms.list(
      Kernel.SpecialForms.list(Patterns.variable(), Kernel.SpecialForms.list(1,2)),
      Kernel.SpecialForms.list(Patterns.variable(), Kernel.SpecialForms.list(2,3))), function(x,y)    {
             return     x * y;
           },function()    {
             return     true;
           },Kernel.SpecialForms.list())
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
     let [r] = Patterns.match(Patterns.variable(),Kernel.SpecialForms._for(Kernel.SpecialForms.list(Kernel.SpecialForms.list(Patterns.variable(),Kernel.SpecialForms.list(1,2)),Kernel.SpecialForms.list(Patterns.variable(),Kernel.SpecialForms.list(2,3))),function(x,y)    {
             return     x * y;
           },function()    {
             return     true;
           },Kernel.SpecialForms.list()));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with filter" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
    end

    js_code = """
     Kernel.SpecialForms._for(Kernel.SpecialForms.list(Kernel.SpecialForms.list(Patterns.variable(),Kernel.SpecialForms.list(1,2,3,4,5,6))),function(n)    {
             return     n;
           },function(n)    {
             return     n % 2 == 0;
           },Kernel.SpecialForms.list())
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with pattern matched input" do
    ex_ast = quote do
      for {:user, name} <- [user: "john", admin: "john", user: "meg"] do
        String.upcase(name)
      end
    end

    js_code = """
     Kernel.SpecialForms._for(Kernel.SpecialForms.list(
      Kernel.SpecialForms.list(
        Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('user'),Patterns.variable()),
        Kernel.SpecialForms.list(
          Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('user'),'john'),
          Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('admin'),'john'),
          Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('user'),'meg')))),function(name)    {
             return     String.upcase(name);
           },function()    {
             return     true;
           },Kernel.SpecialForms.list()
      )
    """

    assert_translation(ex_ast, js_code)
  end
end