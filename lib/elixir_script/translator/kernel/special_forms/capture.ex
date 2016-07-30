defmodule ElixirScript.Translator.Capture do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Call
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Translator

  def make_capture(function_name, arity, env) do
    Identifier.make_identifier(function_name)
  end

  def make_capture(module_name, function_name, arity, env) do
    JS.member_expression(
      Translator.translate!(module_name, env),
      JS.identifier(function_name)
    )
  end

  def find_value_placeholders(ast) do
    case ast do
      list when is_list(list) ->
        Enum.map(list, &find_value_placeholders(&1))
      {:&, _, [number]} when is_number(number) ->
        [{String.to_atom("__#{number}"), [], ElixirScript.Translator.Capture}]
      tuple when is_tuple(tuple) ->
        Enum.map(Tuple.to_list(tuple), &find_value_placeholders(&1))
      _ ->
        []
    end
  end
end
