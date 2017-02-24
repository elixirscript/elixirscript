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
      const test = Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function(){
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
     React.createElement(React.Text,Object.freeze({
             style: Bootstrap.Core.Functions.call_property(styles,'welcome')
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
    JQuery(Bootstrap.Core.Functions.call_property(e,'target'));
    """

    assert_translation(ex_ast, js_code)
  end

  test "correctly translate module names when used" do
    ex_ast = quote do
      @graphic_store App.Stores.GraphicStore.create_store()
    end

    js_code = """
      const graphic_store = Bootstrap.Core.Functions.call_property(App.Stores.GraphicStore, 'create_store');

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
      Bootstrap.Core.Functions.call_property(this, 'getRawCanvas').getContext('2d')
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
     const getDispatcher = Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function()    {
             return     DeLorean.Flux.createDispatcher(Object.freeze({
             [Symbol.for('startPainting')]: Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function()    {
             return     this.dispatch('startPainting');
           })),     [Symbol.for('stopPainting')]: Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function()    {
             return     this.dispatch('stopPainting');
           })),     [Symbol.for('addPoint')]: Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(data)    {
             return     this.dispatch('addPoint',data);
           })),     [Symbol.for('getStores')]: Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function()    {
             return     Object.freeze({
             [Symbol.for('graphic')]: GraphicStore
       });
           }))
       }));
           }));
    """

    assert_translation(ex_ast, js_code)
  end


  test "test array returns correctly" do
    ex_ast = quote do
      def my_func(x) do
        [x.a, x.b]
      end
    end

    js_code = """
    const my_func = Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(x){
    return Object.freeze([Bootstrap.Core.Functions.call_property(x,'a'), Bootstrap.Core.Functions.call_property(x,'b')]);
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "Enum.member? translates to Bootstrap.Enum.member__qmark__" do

  end  

  test "pipe translates correctly" do
    ex_ast = quote do
       :document.getElementById("main") |> JS.update(%{"innerHTML" => @html})
    end

    js_code = """
      Object.assign(document.getElementById('main'), Object.freeze({
          innerHTML: html
      }))
    """

    assert_translation(ex_ast, js_code)   
  end

end
