defmodule ElixirScript.Translate.Module do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Function
  alias ElixirScript.Translator.Identifier
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
        { name, _, _, _} -> name in used
        _ -> false
      end)
    end


    compiled_functions = used_defs
    |> Enum.map(&Function.compile(&1, state))

    exports = make_exports(used_defs)

    js_ast = ElixirScript.ModuleSystems.Namespace.build(
      module,
      compiled_functions,
      exports,
      nil
    )

    ModuleState.put_module(pid, module, Map.put(info, :js_ast, hd(js_ast))) 
  end

  defp make_exports(reachable_defs) do
    exports = Enum.reduce(reachable_defs, [], fn
      {{name, arity}, :def, _, _}, list ->
        function_name = ElixirScript.Translator.Identifier.make_function_name(name, arity)
          list ++ [J.property(function_name, function_name, :init, true)]
      _, list ->
        list
    end)

    J.object_expression(exports)
  end

  def is_elixir_module(Elixir) do
    true
  end

  def is_elixir_module(module) when is_atom(module) do
    str_module = Atom.to_string(module)

    case str_module do
      "Elixir." <> _ ->
        true
      _ ->
        false
    end
  end

  def is_elixir_module(_) do
    false
  end

  def is_js_module(module, state) do
    cond do
      module in ModuleState.get_javascript_modules(state.pid) ->
        true
      is_elixir_module(module) and hd(Module.split(module)) == "JS" ->
        true
      true ->
        false
    end
  end
end
