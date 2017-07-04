defmodule ElixirScript.Translate.Protocol do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.{Function, Identifier}
  alias ElixirScript.State, as: ModuleState


  @doc """
  This compiles and consolidates the given protocol
  """
  def compile(module, %{protocol: true, impls: impls, functions: functions} = info, pid) do
    object = Enum.map(functions, fn {function, _} ->
      {Identifier.make_function_name(function), J.function_expression([], [], J.block_statement([]))}
    end)
    |> Enum.map(fn({key, value}) -> ElixirScript.Translate.Forms.Map.make_property(key, value) end)
    |> J.object_expression

    declarator = J.variable_declarator(
      J.identifier("protocol"),
      J.call_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.member_expression(
            J.identifier(:Core),
            J.member_expression(
              J.identifier(:Functions),
              J.identifier(:defprotocol)
            )
          )
        ),
        [object]
      )
    )

    declaration = J.variable_declaration([declarator], :const)

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

      ast = J.call_expression(
        Identifier.make_namespace_members(members),
        [J.identifier("Elixir")]
      )

      J.call_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.member_expression(
            J.identifier(:Core),
            J.member_expression(
              J.identifier(:Functions),
              J.identifier(:defimpl)
            )
          )
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
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier(:Core)
      ),
      J.identifier(:Integer)
    )
  end

  defp map_to_js(Tuple) do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier(:Core)
      ),
      J.identifier(:Tuple)
    )
  end

  defp map_to_js(Atom) do
    J.identifier(:Symbol)
  end

  defp map_to_js(List) do
    J.identifier(:Array)
  end

  defp map_to_js(BitString) do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier(:Core)
      ),
      J.identifier(:BitString)
    )
  end

  defp map_to_js(Float) do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier(:Core)
      ),
      J.identifier(:Float)
    )
  end

  defp map_to_js(Function) do
    J.identifier(:Function)
  end

  defp map_to_js(PID) do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier(:Core)
      ),
      J.identifier(:PID)
    )
  end

  defp map_to_js(Port) do
    J.member_expression(
      J.identifier("Bootstrap"),
      J.identifier(:Port)
    )
  end

  defp map_to_js(Reference) do
    J.member_expression(
      J.identifier("Bootstrap"),
      J.identifier(:Reference)
    )
  end

  defp map_to_js(Map) do
    J.identifier(:Object)
  end

  defp map_to_js(Any) do
    J.identifier(:null)
  end

  defp map_to_js(module) when is_atom(module) do
    case Module.split(module) do
      ["JS" | rest] ->
        Identifier.make_namespace_members(rest)
      _ ->
        J.call_expression(
          J.member_expression(
            J.identifier("Symbol"),
            J.identifier("for")
          ),
          [J.literal(module)]
        )
    end
  end
end