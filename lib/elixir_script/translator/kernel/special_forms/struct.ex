defmodule ElixirScript.Translator.Struct do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Identifier

  def make_struct(attributes, env) do
    struct_name = Map.make_property(Translator.translate!(:__struct__, env), Translator.translate!({:__MODULE__, [], []}, env))

    defaults = Enum.map(attributes, fn
      ({x, y}) ->
        Map.make_property(
          Translator.translate!(x, env),
          Translator.translate!(y, env)
        )
      (x) ->
        Map.make_property(
          Translator.translate!(x, env),
          Translator.translate!(nil, env)
        )
    end)

    keys = Enum.map(attributes, fn
      ({x, _}) ->
        Translator.translate!(x, env)
      (x) ->
        Translator.translate!(x, env)
    end)

    keys = JS.array_expression(keys)
    defaults = JS.object_expression([struct_name] ++ defaults)

    allowed_keys = JS.variable_declaration([JS.variable_declarator(
      JS.identifier("allowed_keys"),
      keys      
    )], :const)

    value_keys = JS.variable_declaration([JS.variable_declarator(
      JS.identifier("value_keys"),
      JS.call_expression(
        JS.member_expression(
          JS.identifier("Object"),
          JS.identifier("keys")
        ),
        [JS.identifier("values")]
      )      
    )], :const)

    every_call = JS.call_expression(
      JS.member_expression(
        JS.identifier("value_keys"),
        JS.identifier("every")
      ),
      [
        JS.function_expression([JS.identifier("key")], [], JS.block_statement([
          JS.return_statement(
            JS.call_expression(
              JS.member_expression(
                JS.identifier("allowed_keys"),
                JS.identifier("includes")
              ),
              [JS.identifier("key")]         
            )
          )
        ]))
      ]
    )

    every_call_result = JS.variable_declaration([JS.variable_declarator(
      JS.identifier("every_call_result"),
      every_call      
    )], :const)

    bottom = JS.if_statement(
      JS.identifier("every_call_result"),
      JS.block_statement([
        JS.return_statement(
          JS.call_expression(
            JS.member_expression(
              JS.identifier("Object"),
              JS.identifier("assign")
            ),
            [JS.object_expression([]), defaults, JS.identifier("values")]
          )
        )     
      ]),
      JS.block_statement([
        JS.throw_statement(
          JS.literal("Unallowed key found")
        )
      ])
    )

    func = JS.function_expression([
      %ESTree.AssignmentPattern{
        left: JS.identifier("values"),
        right: JS.object_expression([])
      }
    ],
    [],
    JS.block_statement([
      allowed_keys,
      value_keys,
      every_call_result,
      bottom
    ]),
    false,
    false,
    true
    )

    JS.variable_declaration([JS.variable_declarator(
      JS.identifier("__struct__"),
      func      
    )], :const)
  end

end
