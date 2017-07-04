defmodule ElixirScript.Translate.Module do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Function
  alias ElixirScript.State, as: ModuleState

  @doc """
  Translate the given module's ast to
  JavaScript AST
  """
  def compile(module, %{protocol: true} = info, pid) do
    ElixirScript.Translate.Protocol.compile(module, info, pid)
  end

  def compile(module, info, pid) do
    %{
      attributes: attrs,
      compile_opts: _compile_opts,
      definitions: defs,
      file: _file,
      line: _line,
      module: ^module,
      unreachable: unreachable,
      used: used
    } = info

    state = %{
      module: module,
      pid: pid
    }

    # Filter so that we only have the
    # Used functions to compile
    reachable_defs = Enum.filter(defs, fn
        { _, type, _, _} when type in [:defmacro, :defmacrop] -> false
        { name, _, _, _} -> not(name in unreachable)
        _ -> true
      end)

    used_defs = if Keyword.has_key?(attrs, :protocol_impl) do
      reachable_defs
    else
      Enum.filter(reachable_defs, fn
        { {:start, 2}, _, _, _ } -> true
        { {:__struct__, _}, _, _, _ } -> true
        { name, _, _, _} -> name in used
        _ -> false
      end)
    end

    #we combine our function arities
    combined_defs = combine_defs(used_defs)
    exports = make_exports(module, combined_defs)

    # If there are no public exports, skip compilation
    case exports do
      %ESTree.ObjectExpression{ properties: [] } ->
        nil
      _ ->
        { compiled_functions, _ } = Enum.map_reduce(combined_defs, state, &Function.compile(&1, &2))

        js_ast = ElixirScript.ModuleSystems.Namespace.build(
          module,
          compiled_functions,
          exports
        )

        ModuleState.put_module(pid, module, Map.put(info, :js_ast, hd(js_ast)))
    end
  end

  defp combine_defs(used_defs) do
    used_defs
    |> Enum.sort(fn { {name1, arity1}, _, _, _ }, { {name2, arity2}, _, _, _ } -> "#{name1}#{arity1}" < "#{name2}#{arity2}" end)
    |> Enum.group_by(fn {{name, _}, _, _, _ } -> name end)
    |> Enum.map(fn {group, funs} ->
        {_, type, _, _} = hd(funs)
        Enum.reduce(funs, {{group, nil}, type, [], []}, fn {_, _, _, clauses}, {name, type, context, acc_clauses} ->
          {name, type, context, acc_clauses ++ clauses}
        end)
      end)
  end

  defp make_exports(module, reachable_defs) do
    exports = Enum.reduce(reachable_defs, [], fn
      {{name, _arity}, :def, _, _}, list ->
        function_name = ElixirScript.Translate.Identifier.make_identifier(name)
          list ++ [J.property(function_name, function_name, :init, true)]
      _, list ->
        list
    end)

    # Add an attribute to use to determine if this is a module
    # Will be used by the is_atom implementation
    exports = exports ++ [%ESTree.Property{
      key: J.identifier("__MODULE__"),
      value: J.call_expression(
        J.member_expression(
          J.identifier("Symbol"),
          J.identifier("for")
        ),
        [J.literal(to_string(module))]
      )
    }]

    J.object_expression(exports)
  end

  @doc """
  Determins if the given atom
  is an Elixir function
  """
  def is_elixir_module(module) when is_atom(module) do
    str_module = Atom.to_string(module)

    case str_module do
      "Elixir" <> _ ->
        true
      _ ->
        false
    end
  end

  def is_elixir_module(_) do
    false
  end

  @doc """
  Determines is given function is a JS module.
  A JS module is either one that begins with "JS"
  or is a module defined from the js_modules compiler
  opt
  """
  def is_js_module(module, state) do
    cond do
      module in ModuleState.get_javascript_modules(state.pid) ->
        true
      module === Elixir ->
        false
      is_elixir_module(module) and hd(Module.split(module)) == "JS" ->
        true
      true ->
        false
    end
  end
end
