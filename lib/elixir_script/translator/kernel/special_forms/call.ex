defmodule ElixirScript.Translator.Call do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Translator.Function

  def make_module_name(module_name, env) do
    members = ["Elixir"] ++ Module.split(module_name)
    { Identifier.make_namespace_members(members), env }
  end

  def make_extern_module_name(module_name, env) do
    members = Module.split(module_name)
    { Identifier.make_namespace_members(members), env }
  end

  def make_local_function_call({fun, _, nil}, params, env) do
    ast = JS.call_expression(
      Identifier.make_identifier(fun),
      Enum.map(params, fn(x) -> Translator.translate!(x, env) |> Function.applyAwait end)
     )

    {ast, env}
  end

  def make_local_function_call(function_name, params, env) do
    ast = JS.call_expression(
      Identifier.make_identifier(function_name),
      Enum.map(params, fn(x) -> Translator.translate!(x, env) |> Function.applyAwait end)
     )

    {ast, env}
  end

  def make_module_function_call(module_name, function_name, params, env) do
    ElixirScript.Translator.State.add_module_reference(env.state, env.module, module_name)

    members = ["Elixir"] ++ Module.split(module_name) ++ ["__load"]

    ast = JS.call_expression(
      JS.member_expression(
        JS.call_expression(
          Identifier.make_namespace_members(members),
          [JS.identifier("Elixir")]
        ),
        Identifier.make_identifier(function_name)
      ),
      Enum.map(params, fn(x) -> Translator.translate!(x, env) |> Function.applyAwait end)
     )

    {ast, env}
  end

  def make_module_function_call(module_name, function_name, env) do
    ElixirScript.Translator.State.add_module_reference(env.state, env.module, module_name)    
    make_module_function_call(module_name, function_name, [], env)
  end

  def make_extern_function_or_property_call(module_name, function_name, env) do
    members = Module.split(module_name)
    Identifier.make_namespace_members(members)

    js_ast = JS.expression_statement(JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Identifier.make_namespace_members(members),
        Translator.translate!(to_string(function_name), env)
      ]
    ))

    {js_ast, env}
  end

  def make_extern_function_call(module_name, function_name, params, env) do
    members = Module.split(module_name) ++ [to_string(function_name)]

    ast = JS.call_expression(
      Identifier.make_namespace_members(members),
      Enum.map(params, fn(x) -> Translator.translate!(x, env) |> Function.applyAwait end)
     )

    {ast, env}
  end

  def make_function_or_property_call(module_name, function_name, env) do
    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Translator.translate!(module_name, env),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    { js_ast, env }
  end

  def make_function_call(module_name, function_name, [], env) when is_atom(module_name) and is_atom(function_name) do
    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Identifier.make_identifier(module_name),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    {js_ast, env}
  end

  def make_function_call(module_name, function_name, params, env) when is_atom(module_name) and is_atom(function_name) do
    js_ast = JS.call_expression(
       JS.member_expression(
        Identifier.make_identifier(module_name),
        Identifier.make_identifier(function_name)
       ),
       Enum.map(params, fn(x) -> Translator.translate!(x, env) |> Function.applyAwait end)
    )

    {js_ast, env}
  end

  def make_function_call({{:., _, _}, _, _} = module_name, function_name, [], env) do
    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Translator.translate!(module_name, env),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    {js_ast, env}
  end

  def make_function_call({{:., _, _}, _, _} = module_name, function_name, params, env) do
     js_ast = JS.call_expression(
       JS.member_expression(
        Translator.translate!(module_name, env),
        Identifier.make_identifier(function_name)
       ),
       Enum.map(params, fn(x) -> Translator.translate!(x, env) |> Function.applyAwait end)
    )

    {js_ast, env}
  end

  def make_function_call(module_name, function_name, [], env) do
    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Translator.translate!(module_name, env),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    {js_ast, env}
  end

  def make_function_call(module_name, function_name, params, env) do
    call = JS.call_expression(
      JS.member_expression(
        Translator.translate!(module_name, env),
        Identifier.make_identifier(function_name)
      ),
      Enum.map(params, fn(x) -> Translator.translate!(x, env) |> Function.applyAwait end)
    )

    { call, env }
  end
end
