defmodule ElixirScript.Compiler do
  @moduledoc """
  The entry point for the ElixirScript compilation process.
  Takes the given module(s) and compiles them and all modules
  and functions they use into JavaScript.

  Will also take a path to Elixir files
  """

  @doc """
  Takes either a module name, list of module names, or a path as
  the entry point(s) of an application/library. From there
  it will determine which modules and functions are needed
  to be compiled.

  Available options are:
  * `output`: The path of the generated JavaScript file.

    If output is `nil`, then generated code is sent to standard out

    If output is a path, the generated code placed in that path.
    If path ends in `.js` then that will be the name of the file.
    If a directory is given, file will be named `elixirscript.build.js`

  * `root`: Optional root for imports of FFI JavaScript modules. Defaults to `.`.
  """
  alias ElixirScript.{
    State,
    Translate,
    FindUsedModules,
    FindUsedFunctions,
    Output
  }

  alias ElixirScript.ModuleSystems.ES
  alias Kernel.ParallelCompiler

  @type compiler_input ::
          atom
          | [atom]
          | binary

  @spec compile(compiler_input, []) :: map
  def compile(path, opts \\ [])

  def compile(path, opts) when is_binary(path) do
    opts = build_compiler_options(opts)
    {:ok, pid} = State.start_link(opts)

    path =
      if String.ends_with?(path, [".ex", ".exs"]) do
        path
      else
        Path.join([path, "**", "*.{ex,exs}"])
      end

    files = Path.wildcard(path)

    ParallelCompiler.compile(files, each_module: &on_module_compile(pid, &1, &2, &3))

    entry_modules =
      pid
      |> State.get_in_memory_modules()
      |> Keyword.keys()

    do_compile(entry_modules, pid, opts)
  end

  def compile(entry_modules, opts) do
    opts = build_compiler_options(opts)
    {:ok, pid} = State.start_link(opts)

    entry_modules = List.wrap(entry_modules)

    do_compile(entry_modules, pid, opts)
  end

  defp do_compile(entry_modules, pid, opts) do
    FindUsedModules.execute(entry_modules, pid)

    if opts.remove_unused_functions do
      FindUsedFunctions.execute(entry_modules, pid)
    end

    modules = State.list_modules(pid)
    Translate.execute(modules, pid)

    modules = State.list_modules(pid)
    result = Output.execute(modules, pid, opts)

    State.stop(pid)

    transform_output(modules, result, opts)
  end

  defp build_compiler_options(opts) do
    remove_used_functions? = Keyword.get(opts, :remove_unused_functions, true)

    default_options =
      Map.new()
      |> Map.put(:output, Keyword.get(opts, :output))
      |> Map.put(:format, :es)
      |> Map.put(:root, Keyword.get(opts, :root, "."))
      |> Map.put(:remove_unused_functions, remove_used_functions?)

    options = default_options
    Map.put(options, :module_formatter, ES)
  end

  defp on_module_compile(pid, _file, module, beam) do
    State.put_in_memory_module(pid, module, beam)
  end

  defp transform_output(modules, compiled_js, opts) do
    output_path =
      cond do
        opts.output == nil or opts.output == :stdout ->
          ""

        File.dir?(opts.output) ->
          opts.output

        true ->
          Path.dirname(opts.output)
      end

    data = %{
      ElixirScript.Core => %{
        references: [],
        last_modified: nil,
        beam_path: nil,
        source: nil,
        js_path: Path.join(output_path, "ElixirScript.Core.js"),
        diagnostics: [],
        js_code: nil,
        type: :ffi
      }
    }

    Enum.reduce(modules, data, fn {module, info}, current_data ->
      diagnostics =
        Map.get(info, :diagnostics, [])
        |> Enum.map(fn x ->
          Map.put(x, :file, Map.get(info, :file))
        end)

      info = %{
        references: Map.get(info, :used_modules, []),
        last_modified: Map.get(info, :last_modified, nil),
        beam_path: Map.get(info, :beam_path),
        source: Map.get(info, :file),
        js_path: Path.join(output_path, "#{module}.js"),
        diagnostics: diagnostics
      }

      info =
        case Keyword.get(compiled_js, module) do
          [js_input_path, js_output_path] ->
            last_modified =
              case File.stat(js_input_path, time: :posix) do
                {:ok, file_info} ->
                  file_info.mtime

                _ ->
                  nil
              end

            info
            |> Map.put(:last_modified, last_modified)
            |> Map.put(:beam_path, nil)
            |> Map.put(:source, js_input_path)
            |> Map.put(:js_path, js_output_path)
            |> Map.put(:js_code, nil)
            |> Map.put(:type, :ffi)

          js_code ->
            info
            |> Map.put(:js_path, Path.join(output_path, "#{module}.js"))
            |> Map.put(:js_code, js_code)
            |> Map.put(:type, :module)
        end

      Map.put(current_data, module, info)
    end)
  end
end
