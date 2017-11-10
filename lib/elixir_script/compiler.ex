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
  * `remove_unused_functions`: Removed unused functions in output. Defaults to
    removing unused functions when Mix.env == :prod
  """
  alias ElixirScript.{
    State,
    Translate,
    FindUsedModules,
    FindUsedFunctions,
    Output,
    Manifest,
  }
  alias ElixirScript.ModuleSystems.ES
  alias Kernel.ParallelCompiler

  @spec compile(atom | [atom] | binary, []) :: [{atom, map}]
  def compile(path, opts \\ [])

  def compile(path, opts) when is_binary(path) do
    opts = build_compiler_options(opts)
    {:ok, pid} = State.start_link()

    path = if String.ends_with?(path, [".ex", ".exs"]) do
      path
    else
      Path.join([path, "**", "*.{ex,exs}"])
    end

    files = Path.wildcard(path)

    ParallelCompiler.files(files, [
      each_module: &on_module_compile(pid, &1, &2, &3)
    ])

    entry_modules = pid
    |> State.get_in_memory_modules
    |> Keyword.keys

    do_compile(entry_modules, pid, opts)
  end

  def compile(entry_modules, opts) do
    opts = build_compiler_options(opts)
    {:ok, pid} = State.start_link()

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

    manifest_path = Path.join(Mix.Project.manifest_path(), ".compile.elixir_script")
    Manifest.write_manifest(manifest_path, modules, opts)

    result
  end

  defp build_compiler_options(opts) do
    default_options = Map.new
    |> Map.put(:output, Keyword.get(opts, :output))
    |> Map.put(:format, :es)
    |> Map.put(:root, Keyword.get(opts, :root, "."))
    |> Map.put(:remove_unused_functions, Keyword.get(opts, :remove_unused_functions, Mix.env == :prod))

    options = default_options
    Map.put(options, :module_formatter, ES)
  end

  defp on_module_compile(pid, _file, module, beam) do
    State.put_in_memory_module(pid, module, beam)
  end
end
