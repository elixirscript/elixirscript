defmodule ElixirScript.Translator.Utils do
  @moduledoc false

  def quoted_to_name(the_alias) do
    {name, _} = Code.eval_quoted(the_alias)
    name
  end

  def name_to_quoted(name) do
    name = name
    |> Atom.to_string
    |> String.split(".")
    |> tl
    |> Enum.map(fn x -> String.to_atom(x) end)

    { :__aliases__, [], name }
  end

  def name_to_js_name(name) do
    { :__aliases__, _, name } = name_to_quoted(name)
    Enum.join([:Elixir] ++ name, "$")
  end

  def name_to_js_file_name(name) do
    { :__aliases__, _, name } = name_to_quoted(name)
    Enum.join([:Elixir] ++ name, ".")
  end

  def make_local_file_path(file_name) do
    root = ElixirScript.Translator.State.get().compiler_opts.root

    case root do
      nil ->
        "./" <> file_name
      root ->
        root <> "/" <> file_name
    end
  end

  def make_local_file_path(file_name, root) do
    case root do
      nil ->
        "./" <> file_name
      root ->
        root <> "/" <> file_name
    end
  end

end
