defmodule ElixirScript.Translate do
  @moduledoc false

  alias ElixirScript.State, as: ModuleState
  alias ESTree.Tools.{Builder, Generator}

  @doc """
  Takes a list of modules and translates their ast into
  JavaScript AST. The modules are the ones collected from
  the FindUsed pass.
  """
  @spec execute([atom], pid) :: nil
  def execute(modules, pid) do
    Enum.each(modules, fn({module, info}) ->
      ElixirScript.Translate.Module.compile(module, info, pid)
    end)

    modules = ElixirScript.State.list_modules(pid)

    modules = Enum.filter_map(modules,
      fn {_, info} -> Map.has_key?(info, :js_ast) end,
      fn {_module, info} -> 
        info.js_ast 
      end
    )

    opts = ModuleState.get_compiler_opts(pid)

    bundle(modules, opts)
  end

  defp bundle(modules, opts) do
    ElixirScript.Passes.CreateJSModules.compile(modules, opts)

    js_code = modules
    |> ElixirScript.Passes.CreateJSModules.compile(opts)
    |> List.wrap
    |> Builder.program
    |> prepare_js_ast
    |> Generator.generate

    concat(js_code)
    #|> IO.puts 
  end

  defp concat(code) do
    "'use strict';\n" <> ElixirScript.get_bootstrap_js("iife") <> "\n" <> code
  end

  defp prepare_js_ast(js_ast) do
    case js_ast do
      modules when is_list(modules) ->
        modules
        |> Enum.reduce([], &(&2 ++ &1.body))
        |> Builder.program
      %ElixirScript.Translator.Group{body: body} ->
        Builder.program(body)
      %ElixirScript.Translator.Empty{} ->
        Builder.program([])
      _ ->
        js_ast
    end
  end
end
