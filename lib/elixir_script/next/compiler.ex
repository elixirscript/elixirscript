defmodule ElixirScript.Compiler do
  alias ESTree.Tools.{Builder, Generator}
  
  def compile(entry_modules, opts \\ []) do
    opts = build_compiler_options(opts)
    {:ok, pid} = ElixirScript.State.start_link(opts)

    modules = List.wrap(entry_modules)
    Enum.each(modules, fn(module) ->
      case ElixirScript.State.get_module(pid, module) do
        nil ->
         ElixirScript.Experimental.Module.compile(module, pid)
        _ ->
          nil 
      end
    end)

    modules = ElixirScript.State.list_modules(pid)
    |> Enum.map(fn {_module, info} -> info.js_ast end)

    bundle(modules, opts)
  
    ElixirScript.State.stop(pid)
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

  defp build_compiler_options(opts) do
    default_options = Map.new
    |> Map.put(:full_build, false)
    |> Map.put(:output, nil)
    |> Map.put(:app, :app)
    |> Map.put(:format, :es)
    |> Map.put(:js_modules, Keyword.get(opts, :js_modules, []))
    |> Map.put(:remove_unused, false)

    options = default_options
    Map.put(options, :module_formatter, get_module_formatter(options[:format]))
  end

  defp get_module_formatter(:umd) do
    ElixirScript.ModuleSystems.UMD
  end

  defp get_module_formatter(:common) do
    ElixirScript.ModuleSystems.Common
  end

  defp get_module_formatter(_) do
    ElixirScript.ModuleSystems.ES
  end
end