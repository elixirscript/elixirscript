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

    IO.puts "Finding used modules"
    ElixirScript.FindUsedModules.execute(entry_modules, pid)

    IO.puts "Finding used functions"
    ElixirScript.FindUsedFunctions.execute(entry_modules, pid)
    
    IO.puts "Compiling"
    modules = ElixirScript.State.list_modules(pid)
    ElixirScript.Translate.execute(modules, pid)

    IO.puts "Building Output"
    modules = ElixirScript.State.list_modules(pid)
    result = ElixirScript.Output.execute(modules, pid)
  
    ElixirScript.State.stop(pid)

    result
  end

  defp build_compiler_options(opts, entry_modules) do
    default_options = Map.new
    |> Map.put(:output, Keyword.get(opts, :output))
    |> Map.put(:format, Keyword.get(opts, :format, :es))
    |> Map.put(:js_modules, Keyword.get(opts, :js_modules, []))
    |> Map.put(:entry_modules, entry_modules)

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