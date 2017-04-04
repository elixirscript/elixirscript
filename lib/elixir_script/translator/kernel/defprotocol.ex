defmodule ElixirScript.Translator.Defprotocol do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Defmodule
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Translator.Function
  require Logger

  @doc """
  Takes a protocol and turns it into a module
  """
  def make(name, functions, env) do
    { body, _ } = Defmodule.translate_body( {:__block__, [], [] }, env)
    app_name = State.get_module(env.state, name).app

    object = process_spec_functions(functions)
    |> Enum.map(fn({key, value}) ->
      Map.make_property(Identifier.make_identifier(key), value)
    end)
    |> JS.object_expression

    declarator = JS.variable_declarator(
      JS.identifier(Utils.name_to_js_name(name)),
      JS.call_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
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

    implementation_name_split = Module.split(name) ++ ["DefImpl"]
    implementation_name = Enum.join(["Elixir"] ++ implementation_name_split, "$")
    implementation_name_module = Module.concat(implementation_name_split)

    implementations = JS.for_of_statement(
      JS.variable_declaration([JS.variable_declarator(
                                  JS.object_pattern([
                                    JS.assignment_property(JS.identifier("Type")),
                                    JS.assignment_property(JS.identifier("Implementation"))
                                  ]),
                                  nil
      )], :let),
      JS.identifier(implementation_name),
      JS.call_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
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
    defimpl_import = ElixirScript.ModuleSystems.Namespace.import_module(implementation_name_module)

    %{
      name: name,
      body: [defimpl_import] ++ body,
      exports: JS.identifier(Utils.name_to_js_name(name)),
      app_name: app_name,
      env: env
    }
  end

  defp process_spec_functions(functions) do
    Enum.map(Keyword.keys(functions), fn(function_name) ->
      {function_name, Function.function_ast([], JS.block_statement([]))}
    end)
  end
end
