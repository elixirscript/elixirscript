defmodule ElixirScript.Translator.With.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper


  test "translate with" do
    ex_ast = quote do
      with {:ok, width} <- Map.fetch(opts, :width),
      {:ok, height} <- Map.fetch(opts, :height),
      do: {:ok, width * height}
    end

    js_code = """
    Elixir.Core.SpecialForms._with([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
    values: [Symbol.for('ok'), Elixir.Core.Patterns.variable()]
    }), function()    {
    return     Elixir$ElixirScript$Map.fetch(opts,Symbol.for('width'));
    }],[Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
    values: [Symbol.for('ok'), Elixir.Core.Patterns.variable()]
    }), function(width)    {
    return     Elixir$ElixirScript$Map.fetch(opts,Symbol.for('height'));
    }],function(width,height)    {
    return     new Elixir.Core.Tuple(Symbol.for('ok'),width * height);
    })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with with bare expression" do
    ex_ast = quote do
      with {:ok, width} <- Map.fetch(opts, :width),
      double_width = width * 2,
      {:ok, height} <- Map.fetch(opts, :height),
      do: {:ok, double_width * height}
    end

    js_code = """
    Elixir.Core.SpecialForms._with([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
    values: [Symbol.for('ok'), Elixir.Core.Patterns.variable()]
    }), function()    {
    return     Elixir$ElixirScript$Map.fetch(opts,Symbol.for('width'));
    }],[Elixir.Core.Patterns.variable(), function(width)    {
    return     width * 2;
    }],[Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
    values: [Symbol.for('ok'), Elixir.Core.Patterns.variable()]
    }), function(width,double_width)    {
    return     Elixir$ElixirScript$Map.fetch(opts,Symbol.for('height'));
    }],function(width,double_width,height)    {
    return     new Elixir.Core.Tuple(Symbol.for('ok'),double_width * height);
    })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with with else" do
    ex_ast = quote do
      with {:ok, width} <- Map.fetch(opts, :width),
           {:ok, height} <- Map.fetch(opts, :height) do
        {:ok, width * height}
      else
        :error -> {:error, :wrong_data}
      end
    end

    js_code = """
    Elixir.Core.SpecialForms._with([Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
    values: [Symbol.for('ok'), Elixir.Core.Patterns.variable()]
    }), function()    {
    return     Elixir$ElixirScript$Map.fetch(opts,Symbol.for('width'));
    }],[Elixir.Core.Patterns.type(Elixir.Core.Tuple,{
    values: [Symbol.for('ok'), Elixir.Core.Patterns.variable()]
    }), function(width)    {
    return     Elixir$ElixirScript$Map.fetch(opts,Symbol.for('height'));
    }],function(width,height)    {
    return     new Elixir.Core.Tuple(Symbol.for('ok'),width * height);
    },Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Symbol.for('error')],function()    {
    return     new Elixir.Core.Tuple(Symbol.for('error'),Symbol.for('wrong_data'));
    })))
    """

    assert_translation(ex_ast, js_code)
  end
end
