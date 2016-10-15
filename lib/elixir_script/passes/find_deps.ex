defmodule ElixirScript.Passes.FindDeps do
  @pass 3

  alias ElixirScript.Translator.Utils

  def execute(module_filepath_map, _) do
    Enum.map(module_filepath_map, &do_find_dependencies(&1))
  end

  defp do_find_dependencies({ module, module_data }) do
    {_, deps} = Macro.prewalk(module_data.ast, [], &collect_references(&1, &2))
    { module, Map.put(module_data, :deps, deps) }
  end

  defp collect_references({:import, _, [{{:., _, [{:__aliases__, _, head_import_name}, :{}]}, _, tail_imports }]}, state) do
    deps = Enum.map(tail_imports, fn({:__aliases__, context, name}) ->
      full_module_name = { :__aliases__, context, head_import_name ++ name }
      Utils.quoted_to_name(full_module_name)
    end)

    state ++ deps
  end

  defp collect_references({:import, _, [{:__aliases__, _, _} = module_name]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({:import, _, [{:__aliases__, _, _} = module_name, _]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    {ast, state ++ [module_name] }
  end

  defp collect_references({:alias, _, [{{:., _, [{:__aliases__, _, head_alias_name}, :{}]}, _, tail_aliases }]} = ast, state) do
    deps = Enum.map(tail_aliases, fn({:__aliases__, context, name}) ->
      full_module_name = { :__aliases__, context, head_alias_name ++ name }
      Utils.quoted_to_name(full_module_name)
    end)

    { ast, state ++ deps }
  end

  defp collect_references({:alias, _, [{:__aliases__, _, _} = module_name] } = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({:alias, _, [{:__aliases__, _, _} = module_name, _]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    {ast, state ++ [module_name] }
  end

  defp collect_references({:require, _, [{{:., _, [{:__aliases__, _, head_alias_name}, :{}]}, _, tail_aliases }]} = ast, state) do
    deps = Enum.map(tail_aliases, fn({:__aliases__, context, name}) ->
      full_module_name = { :__aliases__, context, head_alias_name ++ name }
      Utils.quoted_to_name(full_module_name)
    end)

    { ast, state ++ deps }
  end

  defp collect_references({:require, _, [{:__aliases__, _, _} = module_name] } = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({:require, _, [{:__aliases__, _, _} = module_name, _]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({:., _, [{:__aliases__, _, _} = module_name, _]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({{:., _, [{:__aliases__, _, _} = module_name, _]}, _, _ } = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references(ast, state) do
    { ast, state }
  end
end
