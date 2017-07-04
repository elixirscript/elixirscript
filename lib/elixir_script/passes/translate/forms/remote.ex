defmodule ElixirScript.Translate.Forms.Remote do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.{Form, Identifier}

  @erlang_modules [
    :erlang,
    :maps,
    :lists,
    :gen,
    :elixir_errors,
    :supervisor,
    :application,
    :code,
    :elixir_utils,
    :file
  ]

  @doc """
  Compiles functions into JavaScript AST.
  These are not actual function calls, but
  the function identifiers themselves. Also
  includes function heads for converting some
  erlang functions into JavaScript functions.
  """

  def compile({:., _, [:erlang, :+]}, state) do
    ast = erlang_compat_function("erlang", "plus")
    { ast, state }
  end

  def compile({:., _, [:erlang, :-]}, state) do
    ast = erlang_compat_function("erlang", "minus")
    { ast, state }
  end

  def compile({:., _, [:erlang, :*]}, state) do
    ast = erlang_compat_function("erlang", "multiply")
    { ast, state }
  end

  def compile({:., _, [:erlang, :/]}, state) do
    ast = erlang_compat_function("erlang", "div")
    { ast, state }
  end

  def compile({:., _, [:erlang, :==]}, state) do
    ast = erlang_compat_function("erlang", "equal")
    { ast, state }
  end

  def compile({:., _, [:erlang, :>]}, state) do
    ast = erlang_compat_function("erlang", "greaterThan")
    { ast, state }
  end

  def compile({:., _, [:erlang, :>=]}, state) do
    ast = erlang_compat_function("erlang", "greaterThanOrEqualTo")
    { ast, state }
  end

  def compile({:., _, [:erlang, :"/="]}, state) do
    ast = erlang_compat_function("erlang", "doesNotEqual")
    { ast, state }
  end

  def compile({:., _, [:erlang, :"<"]}, state) do
    ast = erlang_compat_function("erlang", "lessThan")
    { ast, state }
  end

  def compile({:., _, [:erlang, :"=<"]}, state) do
    ast = erlang_compat_function("erlang", "lessThanOrEqualTo")
    { ast, state }
  end

  def compile({:., _, [:erlang, :"=:="]}, state) do
    ast = erlang_compat_function("erlang", "strictlyEqual")
    { ast, state }
  end

  def compile({:., _, [:erlang, :"=/="]}, state) do
    ast = erlang_compat_function("erlang", "doesNotStrictlyEqual")
    { ast, state }
  end

  def compile({:., _, [:erlang, function]}, state) when function in [:andalso, :and] do
    ast = erlang_compat_function("erlang", "and")
    { ast, state }
  end

  def compile({:., _, [:erlang, function]}, state) when function in [:orelse, :or] do
    ast = erlang_compat_function("erlang", "or")
    { ast, state }
  end

  def compile({:., _, [:erlang, :++]}, state) do
    ast = erlang_compat_function("erlang", "list_concatenation")
    { ast, state }
  end

  def compile({:., _, [:erlang, :--]}, state) do
    ast = erlang_compat_function("erlang", "list_substraction")
    { ast, state }
  end

  def compile({:., _, [module, function]}, state) when module in @erlang_modules do
    ast = J.member_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier(module)
      ),
      ElixirScript.Translate.Identifier.make_function_name(function)
    )

    { ast, state }
  end

  def compile({:., _, [function_name]}, state) do
    Form.compile(function_name, state)
  end

  def compile({:., _, [module, function]}, state) do
    function_name = if ElixirScript.Translate.Module.is_js_module(module, state) do
        ElixirScript.Translate.Identifier.make_extern_function_name(function)
    else
        ElixirScript.Translate.Identifier.make_function_name(function)
    end

    ast = J.member_expression(
      process_module_name(module, state),
      function_name
    )

    {ast, state}
  end

  def process_module_name(module, state) when is_atom(module) do
    cond do
      ElixirScript.Translate.Module.is_js_module(module, state) ->
        process_js_module_name(module, state)
      module === Elixir ->
        members = ["Elixir", "__load"]

        J.call_expression(
          Identifier.make_namespace_members(members),
          [J.identifier("Elixir")]
        )
      ElixirScript.Translate.Module.is_elixir_module(module) ->
        members = ["Elixir"] ++ Module.split(module) ++ ["__load"]

        J.call_expression(
          Identifier.make_namespace_members(members),
          [J.identifier("Elixir")]
        )
      true ->
        ElixirScript.Translate.Identifier.make_identifier(module)
    end
  end

  def process_module_name(module, state) do
    Form.compile!(module, state)
  end

  defp process_js_module_name(module, _) do
    case Module.split(module) do
      ["JS"] ->
        J.member_expression(
          J.member_expression(
            J.identifier("Bootstrap"),
            J.identifier("Core")
          ),
          J.identifier("global")
        )
      ["JS" | rest] ->
        Identifier.make_namespace_members(rest)
      x ->
        Identifier.make_namespace_members(x)
    end
  end

  defp erlang_compat_function(module, function) do
    J.member_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier(module)
      ),
      ElixirScript.Translate.Identifier.make_function_name(function)
    )
  end
end