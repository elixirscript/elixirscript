defmodule ElixirScript.Translator.Bug.Test do
  use ShouldI
  import ElixirScript.TestHelper

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
      Kernel.JS.get_property_or_call_function(this, 'getRawCanvas').getContext('2d')
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
     export function getDispatcher() {
         return DeLorean.Flux.createDispatcher({
             'startPainting': function () {
                 return this.dispatch('startPainting');
             },
             'stopPainting': function () {
                 return this.dispatch('stopPainting');
             },
             'addPoint': function (data) {
                 return this.dispatch('addPoint', data);
             },
             'getStores': function () {
                 return { 'graphic': GraphicStore };
             }
         });
     }
    """

    assert_translation(ex_ast, js_code)
  end


end