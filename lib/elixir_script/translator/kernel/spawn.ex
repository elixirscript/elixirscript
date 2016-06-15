defmodule ElixirScript.Translator.Spawn do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Function


  def make_spawn(func, env) do
    do_spawn_with_fn(func, env, "spawn")
  end

  def make_spawn_link(func, env) do
    do_spawn_with_fn(func, env, "spawn_link")
  end

  defp do_spawn_with_fn(func, env, spawn_func_name) do

    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Elixir"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("get_global")
      ), [])


    js_ast = JS.call_expression(
      JS.member_expression(
        js_ast,
        JS.identifier("processes")
      ),
      JS.identifier(spawn_func_name),
      [
        !Translator.translate(func, %{ env | in_process: true })
      ]
    )


    { js_ast, env }


  end

  def make_spawn(module, fun, args, env) do
    do_spawn_with_mod(module, fun, args, env, "spawn")
  end

  def make_spawn_link(module, fun, args, env) do
    do_spawn_with_mod(module, fun, args, env, "spawn_link")
  end

  defp do_spawn_with_mod(module, fun, args, env, spawn_func_name) do

    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Elixir"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("get_global")
      ), [])


    run_func = JS.member_expression(
      JS.member_expression(
        JS.identifier("Elixir"),
        JS.member_expression(
          JS.identifier("Core"),
          JS.identifier("Functions")
        )
      ),
      JS.identifier("run")
    )


    module_name = Function.get_module_name_for_function(module, env)
    func = to_string(fun)
    args = Translator.translate!(args, env)

    func_to_run = JS.member_expression(
      JS.identifier(module_name),
      JS.identifier(func),
      true
    )


    js_ast = JS.call_expression(
      JS.member_expression(
        js_ast,
        JS.identifier("processes")
      ),
      JS.identifier(spawn_func_name),
      [
        run_func,
        JS.array_expression([func_to_run, args])
      ]
    )


    { js_ast, env }


  end



end
