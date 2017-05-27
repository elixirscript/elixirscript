defmodule ElixirScript.FindUsed do
  @moduledoc false
  alias ElixirScript.State, as: ModuleState

  @doc """
  Takes a list of entry modules and finds modules they use along with
  documenting the functions used. The data collected about used functions
  is used to filter only the used functions for compilation
  """
  @spec execute([atom], pid) :: nil
  def execute(modules, pid) do
    Enum.each(List.wrap(modules), fn(module) ->
      if ElixirScript.State.get_module(pid, module) == nil do
        do_execute(module, pid)
      end
    end)
  end

  defp do_execute(module, pid) do
    case ElixirScript.Beam.debug_info(module) do
      {:ok, info} ->
        walk_module(module, info, pid)
      {:ok, module, implementations} ->
        walk_protocol(module, implementations, pid)
      {:error, error} ->
        raise "An error occurred while compiling #{inspect module}: #{error}"
    end
  end

  defp walk_module(module, info, pid) do
    %{
      attributes: _attrs, 
      compile_opts: _compile_opts,
      definitions: defs,
      file: _file,
      line: _line, 
      module: ^module, 
      unreachable: unreachable
    } = info

    ModuleState.put_module(pid, module, info)

    reachable_defs = Enum.filter(defs, fn
      { _, type, _, _} when type in [:defmacro, :defmacrop] -> false
      { name, _, _, _} -> not(name in unreachable)
      _ -> true
    end)

    state = %{
      pid: pid,
      module: module
    }

    Enum.each(reachable_defs, &walk(&1, state))

  end

  defp walk_protocol(module, implementations, pid) do
    ModuleState.put_module(pid, module, %{})
    Enum.each(implementations, fn({impl, info}) -> walk_module(impl, info, pid) end) 
  end

  defp walk({{_name, _arity}, _type, _, clauses}, state) do
    Enum.each(clauses, &walk(&1, state))
  end

  defp walk({ _, _args, _guards, body}, state) do
    case body do
      nil ->
        nil
      {:__block__, _, block_body} ->
        Enum.map(block_body, &walk(&1, state))
      b when is_list(b) ->
        Enum.map(b, &walk(&1, state))
      _ ->
        walk(body, state)
    end
  end

  defp walk({:->, _, [[{:when, _, params}], body ]}, state) do
    guards = List.last(params)
    params = params |> Enum.reverse |> tl |> Enum.reverse

    walk({[], params, guards, body}, state)
  end

  defp walk({:->, _, [params, body]}, state) do
    walk({[], params, [], body}, state)
  end

  defp walk(form, state) when is_list(form) do
    Enum.each(form, &walk(&1, state))
  end

  #defp walk(form, state) when is_atom(form) do
    #if ElixirScript.Translate.Module.is_elixir_module(form) do
    #  if ModuleState.get_module(state.pid, form) == nil do
    #    execute(form, state.pid)
    #  end
    #end
  #end

  defp walk({a, b}, state) do
    walk({:{}, [], [a, b]}, state)
  end

  defp walk({:{}, _, elements}, state) do
    Enum.each(elements, &walk(&1, state))
  end

  defp walk({:%{}, _, properties}, state) do
    Enum.each(properties, fn (val) -> walk(val, state) end)
  end

  defp walk({:<<>>, _, elements}, state) do
    Enum.each(elements, fn (val) -> walk(val, state) end)
  end

  defp walk({:=, _, [left, right]}, state) do
    walk(left, state)
    walk(right, state)
  end

  defp walk({:%, _, [module, params]}, state) do
    if ElixirScript.Translate.Module.is_elixir_module(module) do
      if ModuleState.get_module(state.pid, module) == nil do
        do_execute(module, state.pid)
      end
    end
    Enum.each(params, &walk(&1, state))
  end

  defp walk({:for, _, generators}, state) do
    Enum.each(generators, fn
      {:<<>>, _, body} ->
        walk(body, state)

      {:<-, _, [identifier, enum]} ->
        walk(identifier, state)
        walk(enum, state)

      [into: expression] ->
        walk(expression, state)

      [into: expression, do: expression2] ->
        walk(expression, state)
        walk(expression2, state)

      [do: expression] ->
        walk(expression, state)

      filter ->
        walk(filter, state)
    end)
  end

  defp walk({:case, _, [condition, [do: clauses]]}, state) do
    Enum.each(clauses, &walk(&1, state))
    walk(condition, state)
  end

  defp walk({:cond, _, [[do: clauses]]}, state) do
    Enum.each(clauses, fn({:->, _, [clause, clause_body]}) ->
      Enum.each(List.wrap(clause_body), &walk(&1, state))
      walk(hd(clause), state)
    end)
  end

  defp walk({:receive, _context, _}, _state) do
    nil
  end

  defp walk({:try, _, [blocks]}, state) do
    try_block = Keyword.get(blocks, :do)
    rescue_block = Keyword.get(blocks, :rescue, nil)
    catch_block = Keyword.get(blocks, :catch, nil)
    after_block = Keyword.get(blocks, :after, nil)
    else_block = Keyword.get(blocks, :else, nil)

    Enum.each(List.wrap(try_block), &walk(&1, state))

    if rescue_block do
      Enum.each(rescue_block, fn
            {:->, _, [ [{:in, _, [param, names]}], body]} ->
              walk({[], [param], [{{:., [], [Enum, :member?]}, [], [param, names]}], body}, state)
            {:->, _, [ [param], body]} ->
              walk({[], [param], [], body}, state)
            end)
    end

    if catch_block do
      walk({:fn, [], catch_block}, state)
    end

    if after_block do
      Enum.each(List.wrap(after_block), &walk(&1, state))
    end

    if else_block do
      walk({:fn, [], else_block}, state)
    end
  end

  defp walk({:fn, _, clauses}, state) do
    Enum.each(clauses, &walk(&1, state))
  end

  defp walk({{:., _, [:erlang, _]}, _, _}, _state) do
    nil
  end

  defp walk({{:., _, [:lists, _]}, _, _}, _state) do
    nil
  end

  defp walk({{:., _, [:maps, _]}, _, _}, _state) do
    nil
  end

  defp walk({{:., _, [module, function]}, _, params}, state) do
    cond do
      ElixirScript.Translate.Module.is_js_module(module, state) ->
        nil
      ElixirScript.Translate.Module.is_elixir_module(module) ->
        if ModuleState.get_module(state.pid, module) == nil do
          execute(module, state.pid)
        end
        ModuleState.add_used(state.pid, module, {function, length(params)})
      true ->
        nil         
    end

    Enum.each(params, &walk(&1, state))
  end

  defp walk({:super, _, params}, state) do
    Enum.each(params, &walk(&1, state))
  end

  defp walk({function, _, params}, state) when is_atom(function) and is_list(params) do
    ModuleState.add_used(state.pid, state.module, {function, length(params)})    
    Enum.each(params, &walk(&1, state))
  end

  defp walk({_, _, params}, state) when is_list(params) do
    Enum.each(params, &walk(&1, state))
  end

  defp walk(_, _) do
    nil
  end

end