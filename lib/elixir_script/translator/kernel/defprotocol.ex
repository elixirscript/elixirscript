defmodule ElixirScript.Translator.Defprotocol do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Defmodule
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Identifier
  require Logger

  @doc """
  Takes a protocol and turns it into a module
  """
  def make(name, functions, env) do
    { body, _ } = Defmodule.translate_body( {:__block__, [], [] }, env)

    app_name = State.get_module(env.state, name).app

    State.add_javascript_module_reference(
      env.state,
      env.module,
      {:__aliases__, [], [:Implementations]},
      Utils.make_local_file_path(app_name, Utils.name_to_js_file_name(name) <> ".Defimpl", env)
    )

    object = process_spec_functions(functions)
    |> Enum.map(fn({key, value}) ->
      Map.make_property(Identifier.make_identifier(key), value)
    end)
    |> JS.object_expression

    declarator = JS.variable_declarator(
      JS.identifier(Utils.name_to_js_name(name)),
      JS.call_expression(
        JS.member_expression(
          JS.identifier(:Elixir),
          JS.member_expression(
            JS.identifier(:Core),
            JS.member_expression(
              JS.identifier(:Functions),
              JS.identifier(:defprotocol)
            )
          )
        ),
        [object]
      )
    )

    declaration = JS.variable_declaration([declarator], :const)

    implementations = JS.for_of_statement(
      JS.variable_declaration([JS.variable_declarator(
                                  JS.object_pattern([
                                    JS.assignment_property(JS.identifier("Type")),
                                    JS.assignment_property(JS.identifier("Implementation"))
                                  ]),
                                  nil
      )], :let),
      JS.identifier("Implementations"),
      JS.call_expression(
        JS.member_expression(
          JS.identifier(:Elixir),
          JS.member_expression(
            JS.identifier(:Core),
            JS.member_expression(
              JS.identifier(:Functions),
              JS.identifier(:defimpl)
            )
          )
        ),
        [
          JS.identifier(Utils.name_to_js_name(name)),
          JS.identifier("Type"),
          JS.identifier("Implementation")
        ]
      )
    )

    body = body ++ [declaration] ++ [implementations]
    body = env.module_formatter.build(body, JS.identifier(Utils.name_to_js_name(name)), env)

    %{
      name: name,
      body: body,
      app_name: app_name
    }
  end

  defp process_spec_functions(functions) do
    Enum.map(Keyword.keys(functions), fn(function_name) ->
      {function_name, JS.function_expression([], [], JS.block_statement([]))}
    end)
  end
end
