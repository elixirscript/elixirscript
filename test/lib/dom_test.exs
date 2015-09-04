defmodule ElixirScript.Lib.DOM.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate dom" do
    ex_ast = quote do
      DOM.section id: "todoapp" do
        DOM.header id: "header" do
          DOM.h1 do
            "todos"
          end
          DOM.input [id: "new-todo", placeholder: "What needs to be done?", autofocus: true]
        end
        DOM.section id: "main"
      end
    end

    js_code = """
    virtualDom.h('section', { 'id': 'todoapp' },
      Erlang.list(
        virtualDom.h('header', { 'id': 'header' },
          Erlang.list(
            virtualDom.h('h1', {}, Erlang.list(
              'todos'
              )
            ),
            virtualDom.h('input', { 
              'id': 'new-todo', 
              'placeholder': 'What needs to be done?',
              'autofocus': true 
              }
            )
          )
        ),
        virtualDom.h('section',{ 'id': 'main' })
      )
    )
    """

    assert_translation(ex_ast, js_code)
  end
end