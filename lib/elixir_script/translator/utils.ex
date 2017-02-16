defmodule ElixirScript.Translator.Utils do
  @moduledoc false

  def quoted_to_name(the_alias) do
    {name, _} = Code.eval_quoted(the_alias)
    name
  end

  def name_to_quoted(name) when is_list(name) do
    { :__aliases__, [], name }
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

  def make_local_file_path(module_app_name, file_name, env) do
    root = ElixirScript.Translator.State.get(env.state).compiler_opts.root
    app_name = if is_binary(module_app_name), do: module_app_name, else: to_string(module_app_name)

    case root do
      nil ->
        Path.join(["..", app_name, file_name])
      root ->
        Path.join([root, app_name, file_name])
    end
  end

  def make_local_file_path(file_name, env) do
    root = ElixirScript.Translator.State.get(env.state).compiler_opts.root

    case root do
      nil ->
        Path.join([".", file_name])
      root ->
        Path.join([root, file_name])
    end
  end

  def make_local_file_path(module_app_name, file_name, root, _) do
    app_name = to_string(module_app_name)

    case root do
      nil ->
        Path.join(["..", app_name, file_name])
      root ->
        Path.join([root, app_name, file_name])
    end
  end

end
