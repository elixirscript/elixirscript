defmodule  ElixirScript.Translator.Def do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Translator

  def process_function(name, functions, env) do
    { result, _ } = Function.make_anonymous_function(functions, env, name)

    declarator = JS.variable_declarator(
      Identifier.make_identifier(name),
      result
    )

    { JS.variable_declaration([declarator], :const), env }
  end

  def process_delegate(name, params, options, env) do
    translated_params = Enum.map(params, &Translator.translate!(&1, env))
    to = options[:to]
    as = options[:as] || name

    function = Function.function_ast(
      translated_params,
      JS.block_statement([
        JS.return_statement(
          Translator.translate!({{:., [], [to, as]}, [], params}, env)
        )
      ])
    )

    declarator = JS.variable_declarator(
      Identifier.make_identifier(name),
      function
    )

    { JS.variable_declaration([declarator], :const), env }      
  end
end
