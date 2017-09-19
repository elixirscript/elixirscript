defmodule ElixirScript.Compiler do
  @moduledoc """
  The entry point for the ElixirScript compilation process.
  Takes the given module(s) and compiles them and all modules
  and functions they use into JavaScript
  """

  @doc """
  Takes either a module name or a list of module names as
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
  @spec compile(atom | [atom] | binary, []) :: nil
  def compile(path, opts \\ [])

  def compile(path, opts) when is_binary(path) do
    opts = build_compiler_options(opts, [])
    {:ok, pid} = ElixirScript.State.start_link()

    path = if String.ends_with?(path, ".ex") or String.ends_with?(path, ".exs") do
      path
    else
      Path.join([path, "**", "*.{ex,exs}"])
    end

    files = Path.wildcard(path)

    Kernel.ParallelCompiler.files(files, [each_module: &on_module_compile(pid, &1, &2, &3)])

    entry_modules = pid
    |> ElixirScript.State.get_in_memory_modules
    |> Keyword.keys

    do_compile(entry_modules, pid, opts)
  end

  def compile(entry_modules, opts) do
    opts = build_compiler_options(opts, entry_modules)
    {:ok, pid} = ElixirScript.State.start_link()

    entry_modules = List.wrap(entry_modules)

    do_compile(entry_modules, pid, opts)
  end

  defp do_compile(entry_modules, pid, opts) do
    ElixirScript.FindUsedModules.execute(entry_modules, pid)

    ElixirScript.FindUsedFunctions.execute(entry_modules, pid)

    modules = ElixirScript.State.list_modules(pid)
    ElixirScript.Translate.execute(modules, pid)

    modules = ElixirScript.State.list_modules(pid)
    result = ElixirScript.Output.execute(modules, pid, opts)

    ElixirScript.State.stop(pid)

    result
  end

  defp build_compiler_options(opts, entry_modules) do
    default_options = Map.new
    |> Map.put(:output, Keyword.get(opts, :output))
    |> Map.put(:format, :es)
    |> Map.put(:entry_modules, entry_modules)
    |> Map.put(:root, Keyword.get(opts, :root, "."))

    options = default_options
    Map.put(options, :module_formatter, ElixirScript.ModuleSystems.ES)
  end

  defp on_module_compile(pid, _file, module, beam) do
    ElixirScript.State.put_in_memory_module(pid, module, beam)
  end
end
