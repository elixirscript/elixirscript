defmodule ElixirScript.Module do
  @moduledoc false

  defstruct name: nil, functions: Keyword.new, macros: Keyword.new, body: nil,
  aliases: [], requires: [], imports: [], js_imports: [], module_refs: [], type: :module,
  spec: nil, impls: HashDict.new

  def functions(nil) do
    []
  end

  def functions(module) do
    Keyword.keys(module.functions) |> Enum.uniq
  end

  def macros(nil) do
    []
  end

  def macros(module) do
    Keyword.keys(module.macros) |> Enum.uniq
  end


  def aliases(nil) do
    []
  end

  def aliases(module) do
    module.aliases
  end

  def requires(nil) do
    []
  end

  def requires(module) do
    module.requires
  end

  def imports(nil) do
    []
  end

  def imports(module) do
    module.imports
  end

  def has_alias?(nil, _) do
    false
  end

  def has_alias?(module, name) do
    case module.aliases do
      aliases when is_list(aliases) ->
        List.keymember?(module.aliases, name, 0)
      _ ->
        List.keymember?(Set.to_list(module.aliases), name, 0)
    end
  end

  def get_alias(nil, _) do
    nil
  end

  def get_alias(module, name) when is_list(name) do
    name = {:__aliases__, [], name } |> quoted_to_name
    get_alias(module, name)
  end

  def get_alias(module, name) when is_atom(name) do
    Enum.find(module.aliases, fn({the_alias, _}) ->
      name == the_alias
    end)
  end

  def get_alias(module, {:__aliases__, _, _} = ast) do
    name = quoted_to_name(ast)
    get_alias(module, name)
  end

  def imported?(nil, _) do
    false
  end

  def imported?(module, function_name) do
    imported_modules = Enum.find(module.imports, fn({_, funcs}) ->
      Enum.member?(funcs, function_name)
    end)

    if imported_modules do
      elem(imported_modules, 0)
    end
  end

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

end
