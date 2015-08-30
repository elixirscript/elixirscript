defmodule ElixirScript.Translator.Raise do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator


  def throw_error(module_name, data) do
    JS.throw_statement(
      JS.new_expression(
        JS.identifier(List.last(module_name)),
        [
          JS.call_expression(
            JS.member_expression(
              JS.identifier(List.last(module_name)),
              JS.identifier(:defexception)
            ),
            Enum.map(data, fn({k, v})->
              JS.assignment_expression(
                :=,
                JS.identifier(k),
                Translator.translate(v)
              )
            end)
          )
        ]
      )
    )
  end

  def throw_error(message) do
    JS.throw_statement(
      JS.new_expression(
        JS.identifier("RuntimeError"),
        [
          JS.object_expression(
            [
              JS.property(JS.identifier(:__struct__), Translator.translate(:RuntimeError)),
              JS.property(JS.identifier("message"), JS.literal(message))
            ]
          )
        ]

      )
    )
  end

end