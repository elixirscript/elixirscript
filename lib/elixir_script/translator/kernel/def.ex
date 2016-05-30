defmodule  ElixirScript.Translator.Def do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Identifier

  def process_function(name, functions, env) do
    { result, _ } = Function.make_anonymous_function(functions, env, name)

    declarator = JS.variable_declarator(
      Identifier.make_identifier(name),
      result
    )

    { JS.variable_declaration([declarator], :const), env }
  end
end
