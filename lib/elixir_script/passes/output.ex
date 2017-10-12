defmodule ElixirScript.Output do
  @moduledoc false

  alias ElixirScript.State, as: ModuleState
  alias ESTree.Tools.{Builder, Generator}

  @doc """
  Takes outputs the JavaScript code in the specified output
  """
  @spec execute([atom], pid, map) :: nil
  def execute(modules, pid, opts) do
    modules = modules
    |> Enum.filter(fn {_, info} -> Map.has_key?(info, :js_ast) end)
    |> Enum.map(fn {module, info} ->
        {module, info.js_ast, info.used_modules}
      end
    )

    js_modules = ModuleState.js_modules(pid)
    |> Enum.filter(fn
      {_module, _name, nil} -> false
      _ -> true
    end)
    |> Enum.map(fn
      {module, name, path} ->
        import_path = Path.join(opts.root, path)
        {module, name, path, import_path}
    end)

    modules
    |> create_modules(opts, js_modules)
  end

  defp concat(code) do
    """
    'use strict';
    import ElixirScript from './ElixirScript.Core.js';
    #{code}
    """
  end

  defp prepare_js_ast(js_ast) do
    case js_ast do
      modules when is_list(modules) ->
        modules
        |> Enum.reduce([], &(&2 ++ &1.body))
        |> Builder.program
      _ ->
        js_ast
    end
  end

  defp create_modules(modules, opts, js_modules) do
    modules
    |> Task.async_stream(fn({module, [body, exports], used_modules}) ->
      modules = modules_to_import(used_modules) ++ js_modules

      imports = opts.module_formatter.build_imports(modules)
      exports = opts.module_formatter.build_export(exports)

      js_parts = List.wrap(imports) ++ body ++ List.wrap(exports)

      js_parts
      |> Builder.program
      |> prepare_js_ast
      |> Generator.generate
      |> concat
      |> output(module, Map.get(opts, :output), js_modules)
    end)
    |> Stream.run
  end

  defp modules_to_import(modules) do
    Enum.map(modules, &module_to_import(&1))
  end

  defp module_to_import(module) do
    {module, module_to_name(module), "", "./Elixir.#{inspect module}.js"}
  end

  def module_to_name(module) do
    "#{inspect module}"
    |> String.replace(".", "$")
  end

  defp output(code, _, nil, _) do
     code
  end

  defp output(code, _, :stdout, _) do
    IO.puts(code)
  end

  defp output(code, module, path, js_modules) do
    output_dir = Path.dirname(path)
    file_name = Path.join(output_dir, "Elixir.#{inspect module}.js")

    if !File.exists?(output_dir) do
      File.mkdir_p!(output_dir)
    end

    apps = get_app_names()
    Enum.each(js_modules, fn({_, _, path, _}) ->
      copy_javascript_module(apps, output_dir, path)
    end)

    copy_bootstrap_js(output_dir)
    File.write!(file_name, code)
  end

  defp copy_bootstrap_js(directory) do
    operating_path = Path.join([Mix.Project.build_path, "lib", "elixir_script", "priv"])
    path = Path.join([operating_path, "build", "es", "ElixirScript.Core.js"])
    File.cp!(path, Path.join([directory, "ElixirScript.Core.js"]))
  end

  defp get_app_names() do
    Mix.Project.config()[:app]
    deps = Mix.Project.deps_paths()
    |> Map.keys

    [Mix.Project.config()[:app]] ++ deps
  end

  defp copy_javascript_module(apps, output_dir, js_module_path) do
    Enum.each(apps, fn(app) ->
      base_path = Path.join([:code.priv_dir(app), "elixir_script"])

      js_input_path = cond do
        File.exists?(Path.join([base_path, js_module_path])) ->
          Path.join([base_path, js_module_path])
        File.exists?(Path.join([base_path, slashes_to_dots(js_module_path)])) ->
          Path.join([base_path, slashes_to_dots(js_module_path)])
        true ->
          nil
      end

      if js_input_path != nil do
        js_output_path = Path.join(output_dir, js_module_path)
        js_output_dir = Path.dirname(js_output_path)
        if !File.exists?(js_output_dir) do
          File.mkdir_p!(js_output_dir)
        end

        File.cp(js_input_path, js_output_path)
      end
    end)
  end

  defp slashes_to_dots(js_module_path) do
    js_module_path
    |> String.replace("/", ".")
  end
end
