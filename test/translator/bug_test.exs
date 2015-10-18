defmodule ElixirScript.Translator.Bug.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "Translate react element" do
    ex_ast = quote do
      React.createElement(
        React.Text,
        %{"style" => styles().welcome},
        "Welcome to React Native!"
      )
    end

    js_code = """
     React.createElement(React.Text,Elixir.Kernel.SpecialForms.map({
             style: Elixir.JS.call_property(styles,'welcome')
       }),'Welcome to React Native!')
    """

    assert_translation(ex_ast, js_code) 

  end

  should "correctly not create 2 imports" do
    ex_ast = quote do
      defmodule App.Todo do
        JS.import JQuery, "jquery"
        JQuery.(e.target)
      end
    end

    js_code = """
     import { default as JQuery } from 'jquery';
     const __MODULE__ = Elixir.Kernel.SpecialForms.atom('Todo');
     
     JQuery(Elixir.JS.call_property(e, 'target'));
     export {};
    """

    assert_translation(ex_ast, js_code)   
  end

  should "correctly translate module names when used" do
    ex_ast = quote do
      @graphic_store App.Stores.GraphicStore.create_store()
    end

    js_code = """
      const graphic_store = Elixir.JS.call_property(App.Stores.GraphicStore, 'create_store');

    """

    assert_translation(ex_ast, js_code)   
  end
  
  should "replace !" do
    ex_ast = quote do
      Elixir.Enum.fetch!(data, i)
    end

    js_code = """
      Elixir.Enum.fetch__emark__(data, i)
    """

    assert_translation(ex_ast, js_code) 
  end

  should "chain calls correctly" do
    ex_ast = quote do
      :this.getRawCanvas().getContext("2d")
    end

    js_code = """
      Elixir.JS.call_property(this, 'getRawCanvas').getContext('2d')
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

  should "correctly call multi-module functions" do
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
     const getDispatcher = Elixir.Patterns.defmatch(Elixir.Patterns.make_case([],function()    {
             return     DeLorean.Flux.createDispatcher(Elixir.Kernel.SpecialForms.map({
             [Elixir.Kernel.SpecialForms.atom('startPainting')]: Elixir.Patterns.defmatch(Elixir.Patterns.make_case([],function()    {
             return     this.dispatch('startPainting');
           })),     [Elixir.Kernel.SpecialForms.atom('stopPainting')]: Elixir.Patterns.defmatch(Elixir.Patterns.make_case([],function()    {
             return     this.dispatch('stopPainting');
           })),     [Elixir.Kernel.SpecialForms.atom('addPoint')]: Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Patterns.variable()],function(data)    {
             return     this.dispatch('addPoint',data);
           })),     [Elixir.Kernel.SpecialForms.atom('getStores')]: Elixir.Patterns.defmatch(Elixir.Patterns.make_case([],function()    {
             return     Elixir.Kernel.SpecialForms.map({
             [Elixir.Kernel.SpecialForms.atom('graphic')]: GraphicStore
       });
           }))
       }));
           }));
    """

    assert_translation(ex_ast, js_code)
  end


end
