defmodule ElixirScript.Compiler do
  @moduledoc """
  Compiles the given modules to JavaScript.
  """

  @doc """
  Takes either a module name or a list of module names as
  the entry point(s) of an application/library. From there
  it will determine which modules and functions are needed
  to be compiled.
  """
  @spec compile([atom], []) :: nil
  def compile(entry_modules, opts \\ []) do
    opts = build_compiler_options(opts, entry_modules)
    {:ok, pid} = ElixirScript.State.start_link(opts)

    entry_modules = List.wrap(entry_modules)

    ElixirScript.FindUsedModules.execute(entry_modules, pid)

    ElixirScript.FindUsedFunctions.execute(entry_modules, pid)

    modules = ElixirScript.State.list_modules(pid)
    ElixirScript.Translate.execute(modules, pid)

    modules = ElixirScript.State.list_modules(pid)
    result = ElixirScript.Output.execute(modules, pid)

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
end
