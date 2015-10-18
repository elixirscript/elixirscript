defmodule ElixirScript.Translator.Capture do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.PatternMatching.Match
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Function

  def make_capture(function_name, arity, env) do
    params = Enum.map(1..arity, fn(x) -> {String.to_atom("__#{x}"), [], ElixirScript.Translator.Capture} end)

    { patterns, params } = Match.build_match(params, env)

    body = JS.block_statement([
          JS.return_statement(
            JS.call_expression(
              JS.identifier(function_name),
              params
            )
          )
        ])


    Function.make_defmatch([
      Function.do_make_function_clause(patterns, params, body)
    ])
  end  

  def make_capture(module_name, function_name, arity, env) do
    params = Enum.map(1..arity, fn(x) -> {String.to_atom("__#{x}"), [], ElixirScript.Translator.Capture} end)

    if Function.module_in_standard_libs?(module_name) do
      module_name = [:Elixir, module_name]
    end

    { patterns, params } = Match.build_match(params, env)

    body = JS.block_statement([
      JS.return_statement(
        JS.call_expression(
          Utils.make_member_expression(module_name, function_name, env),
          params
        )
      )
    ])


    Function.make_defmatch([
      Function.do_make_function_clause(patterns, params, body)
    ])


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