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
  * `remove_unused_functions`: Removed unused functions in output. Defaults to
    removing unused functions when Mix.env == :prod
  """
  @spec compile(atom | [atom], []) :: nil
  def compile(entry_modules, opts \\ []) do
    opts = build_compiler_options(opts, entry_modules)
    {:ok, pid} = ElixirScript.State.start_link()

    entry_modules = List.wrap(entry_modules)

    ElixirScript.FindUsedModules.execute(entry_modules, pid)

    if opts.remove_unused_functions do
      ElixirScript.FindUsedFunctions.execute(entry_modules, pid)
    end

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
    |> Map.put(:remove_unused_functions, Keyword.get(opts, :remove_unused_functions, Mix.env == :prod))

    options = default_options
    Map.put(options, :module_formatter, ElixirScript.ModuleSystems.ES)
  end
end
