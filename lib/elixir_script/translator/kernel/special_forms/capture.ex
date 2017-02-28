defmodule ElixirScript.Translator.Capture do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Call
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Translator

  def make_capture(function_name, _, _) do
    Identifier.make_identifier(function_name)
  end

  def make_capture(module_name, function_name, _, env) do
    members = ["Elixir"] ++ Module.split(module_name) ++ ["__load"]

    ast = JS.member_expression(
        JS.call_expression(
          Identifier.make_namespace_members(members),
          [JS.identifier("Elixir")]
        ),
        Identifier.make_identifier(function_name)        
      )
  end

  def make_extern_capture(module_name, function_name, _, env) do
    members = Module.split(module_name) ++ [to_string(function_name)]
    Identifier.make_namespace_members(members)    
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
