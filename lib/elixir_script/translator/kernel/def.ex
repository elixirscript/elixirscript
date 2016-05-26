defmodule  ElixirScript.Translator.Def do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils

  def process_function(name, functions, env) do
    { result, _ } = Function.make_anonymous_function(functions, env, name)

    declarator = JS.variable_declarator(
      JS.identifier(Utils.filter_name(name)),
      result
    )

    { JS.variable_declaration([declarator], :const), env }
  end
end
