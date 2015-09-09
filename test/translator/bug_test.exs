defmodule ElixirScript.Translator.Bug.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "correctly not create 2 imports" do
    ex_ast = quote do
      defmodule App.Todo do
        alias JQuery, from: "jquery", default: true
        JQuery.(e.target)
      end
    end

    js_code = """
     import JQuery from 'jquery';
     const __MODULE__ = Erlang.atom('Todo');
     
     JQuery(JS.get_property_or_call_function(e, 'target'));
     export {};
    """

    assert_translation(ex_ast, js_code)   
  end

  should "correctly translate module names when used" do
    ex_ast = quote do
      @graphic_store App.Stores.GraphicStore.create_store()
    end

    js_code = """
      const graphic_store = JS.get_property_or_call_function(App.Stores.GraphicStore, 'create_store');

    """

    assert_translation(ex_ast, js_code)   
  end
  
  should "replace !" do
    ex_ast = quote do
      Enum.fetch!(data, i)
    end

    js_code = """
      Enum.fetch__emark__(data, i)
    """

    assert_translation(ex_ast, js_code) 
  end

  should "chain calls correctly" do
    ex_ast = quote do
      :this.getRawCanvas().getContext("2d")
    end

    js_code = """
      JS.get_property_or_call_function(this, 'getRawCanvas').getContext('2d')
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
      let getDispatcher = fun([[], function() {
        return DeLorean.Flux.createDispatcher({
          [Erlang.atom('startPainting')]: fun([[], function() {
            return this.dispatch('startPainting');
          }]),
          [Erlang.atom('stopPainting')]: fun([[], function() {
            return this.dispatch('stopPainting');
          }]),
          [Erlang.atom('addPoint')]: fun([[fun.parameter], function(data) {
            return this.dispatch('addPoint', data);
          }]),
           [Erlang.atom('getStores')]: fun([[], function() {
            return {
              [Erlang.atom('graphic')]: GraphicStore
            };
          }])
        });
      }]);
    """

    assert_translation(ex_ast, js_code)
  end


end
