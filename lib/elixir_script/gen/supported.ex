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
    module_map = get_module_list()

    Enum.each(module_map, fn({elixir_module, elixir_script_module}) ->
      IO.puts(file, "## #{inspect elixir_module}")   
      exports = elixir_module.__info__(:functions) ++ elixir_module.__info__(:macros)

      elixir_script_exports = cond do
        elixir_script_module == ElixirScript.Kernel.SpecialForms ->
          extra(elixir_script_module)
        Code.ensure_loaded?(elixir_script_module) ->
          elixir_script_module.__info__(:functions) ++ elixir_script_module.__info__(:macros) ++ extra(elixir_script_module)
        true ->
          []
      end

      Enum.each(exports, fn({func, arity}) -> 
        if Enum.member?(elixir_script_exports, {func, arity}) do
          IO.puts(file, "- [X] `#{func}/#{arity}`")
        else
          IO.puts(file, "- [ ] `#{func}/#{arity}`")          
        end
      end)
    end)
  end

  defp get_module_list() do
    Application.spec(:elixir, :modules)
    |> Enum.filter(&is_public(&1))
    |> Enum.sort(fn(x, y) -> to_string(x) >= to_string(y) end)
    |> Enum.reduce(Keyword.new, fn(x, acc) -> 
      try do
        elixirscript_module = (["ElixirScript"] ++ Module.split(x)) |> Module.concat()
        Keyword.put(acc, x, elixirscript_module)
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

  defp extra(ElixirScript.Kernel.SpecialForms) do
    [
      %: 2,
      %{}: 1,
      &: 1,
      ".": 2,
      "::": 2,
      <<>>: 1,
      =: 2,
      ^: 1,
      __CALLER__: 0,
      __DIR__: 0,
      __ENV__: 0,
      __MODULE__: 0,
      __aliases__: 1,
      __block__: 1,
      alias: 2,
      case: 2,
      cond: 1,
      fn: 1,
      for: 1,
      import: 2,
      quote: 2,
      require: 2,
      super: 1,
      try: 1,
      unquote: 1,
      unquote_splicing: 1,
      with: 1,
      {}: 1,
    ]
  end

  defp extra(ElixirScript.Kernel) do
    [
      !=: 2,
      !==: 2,
      *: 2,
      +: 1,
      +: 2,
      ++: 2,
      -: 1,
      -: 2,
      --: 2,
      /: 2,
      <: 2,
      <=: 2,
      ==: 2,
      ===: 2,
      =~: 2,
      >: 2,
      >=: 2,
      div: 2,
      rem: 2,
      !: 1,
      &&: 2,
      <>: 2,
      @: 1,
      and: 2,
      def: 1,
      def: 2,
      defdelegate: 2,
      defexception: 1,
      defimpl: 2,
      defimpl: 3,
      defmacro: 1,
      defmacro: 2,
      defmacrop: 1,
      defmacrop: 2,
      defmodule: 2,
      defoverridable: 1,
      defp: 1,
      defp: 2,
      defprotocol: 2,
      defstruct: 1,
      raise: 1,
      raise: 2,
      or: 2,
      use: 1,
      use: 2,
      ||: 2,
    ]
  end


  defp extra(_) do
    []
  end
end