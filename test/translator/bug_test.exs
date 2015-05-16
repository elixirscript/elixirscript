defmodule ElixirScript.Translator.Bug.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "correctly handle casing module imports" do
    ex_ast = quote do
      alias Stores.GraphicStore
    end

    js_code = """
      import GraphicStore from 'stores/graphic_store';
    """

    assert_translation(ex_ast, js_code)
  end

  should "correctly handle local default module importing" do
    ex_ast = quote do
      require Stores.GraphicStore
    end

    js_code = """
      import GraphicStore from 'stores/graphic_store';
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