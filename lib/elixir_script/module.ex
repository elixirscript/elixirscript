defmodule ElixirScript.Module do
  @moduledoc false

  defstruct name: nil, functions: Keyword.new, macros: Keyword.new, body: nil,
  aliases: [], requires: [], imports: [], js_imports: []

  def functions(module) do
    Keyword.keys(module.functions) |> Enum.uniq
  end

  def macros(module) do
    Keyword.keys(module.macros) |> Enum.uniq
  end

  def aliases(module) do
    module.aliases
  end

  def requires(module) do
    module.requires
  end

  def imports(module) do
    module.imports
  end

  def has_alias?(module, {:__aliases__, _, _} = ast) do
    { name, _ } = Code.eval_quoted(ast)
    has_alias?(module, name)
  end

  def has_alias?(module, name) do
    List.keymember?(Set.to_list(module.aliases), name, 0)
  end

  def get_alias(nil, _) do
    nil
  end

  def get_alias(module, name) when is_list(name) do
    name = {:__aliases__, [], name }
    get_alias(module, name)
  end

  def get_alias(module, {:__aliases__, _, _} = ast) do
    { name, _ } = Code.eval_quoted(ast)

    Enum.find(module.aliases, fn({the_alias, _}) ->
      name == the_alias
    end)
  end

  def imported?(module, function_name) do
    imports = Enum.find(module.imports, fn({_, functions}) ->
      Enum.member?(functions, function_name)
    end)

    if imports do
      elem(imports, 0)
    end
  end

end
