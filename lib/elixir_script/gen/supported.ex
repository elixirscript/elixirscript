defmodule ElixirScript.Gen.Supported do
  @moduledoc false
  @private_modules [
    Kernel.Utils,
    String.Normalizer,
    Version.Parser,
    IO.ANSI.Sequence,
    Version.Parser.DSL,
    String.Break,
    IO.ANSI.Docs,
    Kernel.LexicalTracker,
    Task.Supervised,
    Supervisor.Default,
    Registry.Partition,
    Module.LocalsTracker,
    Kernel.CLI,
    Registry.Supervisor,
    Stream.Reducers,
    Agent.Server,
  ]

  def generate() do
    File.open!("Supported.md", [:write], &write_to_file/1) 
  end

  def write_to_file(file) do
    IO.puts(file, "# Supported Elixir Modules")
    IO.puts(file, "List all public modules in the Elixir Standard Libary. If a function or macro is supported in ElixirScript, it is checked")
    module_map = get_module_map()

    Enum.each(module_map, fn({elixir_module, elixir_script_module}) ->
      IO.puts(file, "## #{inspect elixir_module}")   
      exports = elixir_module.__info__(:functions) ++ elixir_module.__info__(:macros)
      elixir_script_exports = if Code.ensure_loaded?(elixir_script_module) do
        elixir_script_module.__info__(:functions) ++ elixir_script_module.__info__(:macros)
      else
        []
      end

      Enum.each(exports, fn({func, arity}) -> 
        if Enum.member?(elixir_script_exports, {func, arity}) do
          IO.puts(file, "- [X] #{func}/#{arity}")
        else
          IO.puts(file, "- [ ] #{func}/#{arity}")          
        end
      end)
    end)
  end

  defp get_module_map() do
    Application.spec(:elixir, :modules)
    |> Enum.filter(&is_public(&1))
    |> Enum.reduce(Map.new, fn(x, acc) -> 
      try do
        elixirscript_module = (["ElixirScript"] ++ Module.split(x)) |> Module.concat()
        Map.put(acc, x, elixirscript_module)
      rescue
        FunctionClauseError ->
          acc
      end
    end)
  end

  defp is_public(m) when m in @private_modules do
    false
  end

  defp is_public(_) do
    true
  end
end