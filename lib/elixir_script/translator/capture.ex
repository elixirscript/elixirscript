defmodule ElixirScript.Translator.Capture do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.PatternMatching.Match
  alias ElixirScript.Translator.Function

  def make_capture(function_name, arity, env) do
    params = Enum.map(1..arity, fn(x) -> {String.to_atom("__#{x}"), [], ElixirScript.Translator.Capture} end)

    { patterns, params, _ } = Match.build_match(params, env)
    |> Match.update_env(env)

    body = JS.block_statement([
      JS.return_statement(
        JS.call_expression(
          JS.identifier(function_name),
          params
        )
      )
    ])

    Function.make_defmatch([
      Function.make_function_clause(patterns, params, body)
    ])
  end

  def make_capture(module_name, function_name, arity, env) do
    arity_params = Enum.map(1..arity, fn(x) -> {String.to_atom("__#{x}"), [], ElixirScript.Translator.Capture} end)

    {_, _, name} = module_name

    if name == [:Kernel] or name == [Elixir, :Kernel] do
      name = [:ElixirScript, :Kernel]
    end

    { patterns, params, env } = Match.build_match(arity_params, env)
    |> Match.update_env(env)

    {func, _} = Function.make_function_call({:__aliases__, [], name }, function_name, arity_params, env)

    body = JS.block_statement([
      JS.return_statement(
        func
      )
    ])

    Function.make_defmatch([
      Function.make_function_clause(patterns, params, body)
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
