defmodule ElixirScript.Preprocess.Aliases do
  @moduledoc false

  @doc """
    Takes the ast, records any uses of outer modules, and updates the calls
    to make them look like as if using an alias

    ex.
      Hello.World.hi()

      #would turn into
      World.hi()

      #the "Hello.World" would be placed in a set and later used for building an alias
  """
  def process(module_name_list, ast, env) do
    new_ast = Macro.prewalk(ast, fn(x) ->
      process_aliases(x, env, module_name_list)
    end)

    module = ElixirScript.State.get_module(module_name_list)

    if module do
      { new_ast, ElixirScript.Module.aliases(module) }
    else
      { new_ast, [] }
    end
  end

  def process_aliases({{:., meta1, [{:__aliases__, meta2, aliases}, function]}, meta3, params}, _, module_name_list) when aliases in [[:Collectable], [:Enumerable], [:Inspect], [:List, :Chars], [:String, :Chars]] do
      new_ast = {{:., meta1, [{:__aliases__, meta2, List.last(aliases) |> List.wrap }, function]}, meta3, params}
      ElixirScript.State.add_alias(module_name_list, {:__aliases__, meta2, [:Elixir] ++ aliases})
      new_ast
  end


  def process_aliases({{:., meta1, [{:__aliases__, meta2, aliases}, function]}, meta3, params} = ast, _, module_name_list) do
    if ElixirScript.State.module_listed?(aliases) do
      new_ast = {{:., meta1, [{:__aliases__, meta2, List.last(aliases) |> List.wrap }, function]}, meta3, params}

      module = ElixirScript.State.get_module(module_name_list)

      if !ElixirScript.Module.has_alias?(module, {:__aliases__, meta2, List.last(aliases) |> List.wrap }) do
        ElixirScript.State.add_alias(module_name_list, {:__aliases__, meta2, aliases})
      end

      new_ast
    else
      ast
    end
  end

  def process_aliases(ast, _, _) do
    ast
  end
end
