defmodule ElixirScript.Translator.Bug.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "Translate function with 0 arguments" do
    ex_ast = quote do
        def test do
          :atom
        end
    end

    js_code = """
      const test = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function(){
        return Symbol.for('atom');
      }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "Translate react element" do
    ex_ast = quote do
      React.createElement(
        React.Text,
        %{"style" => styles().welcome},
        "Welcome to React Native!"
      )
    end

    js_code = """
     React.createElement(React.Text,Elixir.Core.SpecialForms.map({
             style: Elixir.Core.Functions.call_property(styles,'welcome')
       }),'Welcome to React Native!')
    """

    assert_translation(ex_ast, js_code)

  end

  test "correctly not create 2 imports" do
    ex_ast = quote do
      defmodule App.Todo do
        JS.import JQuery, "jquery"
        JQuery.(e.target)
      end
    end

    js_code = """
    import { default as JQuery } from 'jquery';
    import * as Elixir$ElixirScript$Kernel from './Elixir.ElixirScript.Kernel';
    JQuery(Elixir.Core.Functions.call_property(e,'target'));
    export {};
    """

    assert_translation(ex_ast, js_code)
  end

  test "correctly translate module names when used" do
    ex_ast = quote do
      @graphic_store App.Stores.GraphicStore.create_store()
    end

    js_code = """
      const graphic_store = Elixir.Core.Functions.call_property(App.Stores.GraphicStore, 'create_store');

    """

    assert_translation(ex_ast, js_code)
  end

  test "replace !" do
    ex_ast = quote do
      Elixir.Enum.fetch!(data, i)
    end

    js_code = """
      Elixir.Enum.fetch__emark__(data, i)
    """

    assert_translation(ex_ast, js_code)
  end

  test "chain calls correctly" do
    ex_ast = quote do
      :this.getRawCanvas().getContext("2d")
    end

    js_code = """
      Elixir.Core.Functions.call_property(this, 'getRawCanvas').getContext('2d')
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      :this.getRawCanvas(one).get("fg").getContext("2d")
    end

    js_code = """
      this.getRawCanvas(one).get('fg').getContext('2d')
    """

    assert_translation(ex_ast, js_code)
  end

  test "correctly call multi-module functions" do
    ex_ast = quote do
      def getDispatcher() do
        DeLorean.Flux.createDispatcher(%{
          startPainting: fn() -> this.dispatch("startPainting") end,
          stopPainting: fn() -> this.dispatch("stopPainting") end,
          addPoint: fn(data) -> this.dispatch("addPoint", data) end,
          getStores: fn() -> %{ graphic: GraphicStore } end
        })
      end
    end


    js_code = """
     const getDispatcher = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     DeLorean.Flux.createDispatcher(Elixir.Core.SpecialForms.map({
             [Symbol.for('startPainting')]: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     this.dispatch('startPainting');
           })),     [Symbol.for('stopPainting')]: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     this.dispatch('stopPainting');
           })),     [Symbol.for('addPoint')]: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(data)    {
             return     this.dispatch('addPoint',data);
           })),     [Symbol.for('getStores')]: Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     Elixir.Core.SpecialForms.map({
             [Symbol.for('graphic')]: GraphicStore
       });
           }))
       }));
           }));
    """

    assert_translation(ex_ast, js_code)
  end


end
