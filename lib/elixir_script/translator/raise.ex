defmodule ElixirScript.Translator.Raise do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator


  def throw_error(module_name, data, env) do
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
                Translator.translate(v, env)
              )
            end)
          )
        ]
      )
    )
  end

  def throw_error(message, env) do
    JS.throw_statement(
      JS.new_expression(
        JS.identifier("RuntimeError"),
        [
          JS.object_expression(
            [
              JS.property(JS.identifier(:__struct__), Translator.translate(:RuntimeError, env)),
              JS.property(JS.identifier("message"), JS.literal(message))
            ]
          )
        ]

      )
    )
  end

end