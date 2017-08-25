defmodule ElixirScript.Translate.Protocol do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Helpers
  alias ElixirScript.Translate.{Function, Identifier}
  alias ElixirScript.State, as: ModuleState


  @doc """
  This compiles and consolidates the given protocol
  """
  def compile(module, %{protocol: true, impls: impls, functions: functions} = info, pid) do
    object = Enum.map(functions, fn {function, _} ->
      {Identifier.make_function_name(function), Helpers.function([], J.block_statement([]))}
    end)
    |> Enum.map(fn({key, value}) -> ElixirScript.Translate.Forms.Map.make_property(key, value) end)
    |> J.object_expression

    declaration = Helpers.declare(
      "protocol",
      Helpers.call(
        J.member_expression(
          Helpers.functions(),
          J.identifier(:defprotocol)
        ),
        [object]
      )
    )

    body = build_implementations(impls)

    body = [declaration] ++ body

    js_ast = ElixirScript.ModuleSystems.Namespace.build(
      module,
      body,
      J.identifier("protocol")
    )

    ModuleState.put_module(pid, module, Map.put(info, :js_ast, hd(js_ast)))
  end

  defp build_implementations(impls) do
    Enum.map(impls, fn({impl, impl_for}) ->
      members = ["Elixir"] ++ Module.split(impl) ++ ["__load"]

      ast = Helpers.call(
        Identifier.make_namespace_members(members),
        [J.identifier("Elixir")]
      )

      Helpers.call(
        J.member_expression(
          Helpers.functions(),
          J.identifier(:defimpl)
        ),
        [
          J.identifier("protocol"),
          map_to_js(impl_for),
          ast
        ]
      )
    end)
  end

  defp map_to_js(Integer) do
    Helpers.core_module("Integer")
  end

  defp map_to_js(Tuple) do
    Helpers.tuple()
  end

  defp map_to_js(Atom) do
    J.identifier(:Symbol)
  end

  defp map_to_js(List) do
    J.identifier(:Array)
  end

  defp map_to_js(BitString) do
    Helpers.bitstring()
  end

  defp map_to_js(Float) do
    Helpers.core_module("Float")
  end

  defp map_to_js(Function) do
    J.identifier(:Function)
  end

  defp map_to_js(PID) do
    Helpers.core_module("PID")
  end

  defp map_to_js(Port) do
    Helpers.core_module("Port")
  end

  defp map_to_js(Reference) do
    Helpers.core_module("Reference")
  end

  defp map_to_js(Map) do
    J.identifier(:Map)
  end

  defp map_to_js(Any) do
    J.identifier(:null)
  end

  defp map_to_js(module) when is_atom(module) do
    case Module.split(module) do
      ["JS" | rest] ->
        Identifier.make_namespace_members(rest)
      _ ->
        Helpers.symbol(module)
    end
  end
end
