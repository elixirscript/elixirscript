defmodule ElixirScript.Passes.CreateJSModules do
  @moduledoc false
  alias ElixirScript.Translator.Utils
  alias ESTree.Tools.Builder, as: JS

  def execute(compiler_data, opts) do
    namespace_modules = Enum.reduce(compiler_data.data, [], fn
      ({_, %{load_only: true} = module_data}, acc) ->
        acc

      ({module_name, module_data}, acc) ->
        body = generate_namespace_module(
          module_data.type,
          module_name,
          Map.get(module_data, :javascript_module, module_data),
          opts,
          compiler_data.state
        )

        acc ++ List.wrap(body)
    end)

    compiled = compile(namespace_modules, opts)
    Map.put(compiler_data, :compiled, compiled)
  end

  defp generate_namespace_module(:consolidated, module_name, js_module, opts, state) do
    env = ElixirScript.Translator.LexicalScope.module_scope(
      js_module.name,
      Utils.name_to_js_file_name(js_module.name) <> ".js",
      opts.env,
      state,
      opts)

    body = ElixirScript.ModuleSystems.Namespace.build(
      module_name,
      js_module.imports,
      js_module.body,
      js_module.exports,
      env
    )

    body
  end

  defp generate_namespace_module(_, module_name, js_module, _, _) do
    body = ElixirScript.ModuleSystems.Namespace.build(
      module_name,
      js_module.imports,
      js_module.body,
      js_module.exports,
      js_module.env
    )

    body
  end

  defp compile(body, opts) do
    declarator = JS.variable_declarator(
      JS.identifier("Elixir"),
      JS.object_expression([])
    )

    elixir = JS.variable_declaration([declarator], :const)

    start = JS.assignment_expression(
      :=,
      JS.member_expression(
        JS.identifier("Elixir"),
        JS.identifier("start")
      ),
      JS.function_expression(
        [JS.identifier(:app), JS.identifier(:args)],
        [],
        JS.block_statement([
          JS.call_expression(
            JS.member_expression(
              JS.call_expression(
                JS.member_expression(
                  JS.identifier(:app),
                  JS.identifier("__load")
                ),
                [JS.identifier("Elixir")]
              ),
              JS.identifier("start")
            ),
            [ElixirScript.Translator.Primitive.make_atom(:normal), JS.identifier(:args)]
          )
        ])
      )
    )

    ast = opts.module_formatter.build(
      [],
      [{"Bootstrap", "./Elixir.Bootstrap", true }] ++ opts.js_modules,
      [elixir, start] ++ body,
      JS.identifier("Elixir")
    )

    ast
  end

end
