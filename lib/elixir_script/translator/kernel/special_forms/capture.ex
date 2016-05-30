defmodule ElixirScript.Translator.Capture do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Call
  alias ElixirScript.Translator.Identifier

  def make_capture(function_name, arity, env) do
    { patterns, params, _ } = process_params(arity, env)

    body = JS.block_statement([
      JS.return_statement(
        JS.call_expression(
          Identifier.make_identifier(function_name),
          params
        )
      )
    ])

    make_capture_function(patterns, params, body)
  end

  def make_capture(module_name, function_name, arity, env) do
    arity_params = Enum.map(1..arity, fn(x) -> {String.to_atom("__#{x}"), [], ElixirScript.Translator.Capture} end)

    { patterns, params, env } = process_params(arity, env)

    { _, _, name } = module_name

    if name == [:Kernel] or name == [Elixir, :Kernel] do
      name = [:ElixirScript, :Kernel]
    end

    { func, _ } = Call.make_function_call({:__aliases__, [], name }, function_name, arity_params, env)

    body = JS.block_statement([
      JS.return_statement(
        func
      )
    ])

    make_capture_function(patterns, params, body)
  end

  defp process_params(arity, env) do
    params = Enum.map(1..arity, fn(x) -> {String.to_atom("__#{x}"), [], ElixirScript.Translator.Capture} end)
    PatternMatching.process_match(params, env)
  end

  defp make_capture_function(patterns, params, body) do
    Function.make_defmatch([
      Function.make_function_clause(patterns, params, body, nil)
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
