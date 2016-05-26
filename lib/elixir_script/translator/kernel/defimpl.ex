defmodule ElixirScript.Translator.Defimpl do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Defmodule

  def make(name, type, body, env) do

    type = map_to_js(type, env)
    module = Defmodule.make_module(name, body, env)

    protocol_name = Atom.to_string(name) |> String.split(".DefImpl.") |> hd |> String.to_atom

    %ESTree.ExportDefaultDeclaration{ declaration: export } = List.last(module.body)
    export = JS.object_expression([
      JS.property(
        JS.literal("Type"),
        type
      ),
      JS.property(
        JS.literal("Implementation"),
        export
      )
    ])

    body = Enum.reverse(module.body)
    |> tl
    |> Enum.reverse

    %{ module | body: body ++ [JS.export_default_declaration(export)] }
    |> Map.put(:protocol, protocol_name)
  end

  defp map_to_js({:__aliases__, _, [:Integer]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:Integer)
    )
  end

  defp map_to_js({:__aliases__, _, [:Tuple]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:Tuple)
    )
  end

  defp map_to_js({:__aliases__, _, [:Atom]}, _) do
    JS.identifier(:Symbol)
  end

  defp map_to_js({:__aliases__, _, [:List]}, _) do
    JS.identifier(:Array)
  end

  defp map_to_js({:__aliases__, _, [:BitString]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:BitString)
    )
  end

  defp map_to_js({:__aliases__, _, [:Float]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:Float)
    )
  end

  defp map_to_js({:__aliases__, _, [:Function]}, _) do
    JS.identifier(:Function)
  end

  defp map_to_js({:__aliases__, _, [:PID]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Elixir),
        JS.identifier(:Core)
      ),
      JS.identifier(:PID)
    )
  end

  defp map_to_js({:__aliases__, _, [:Port]}, _) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.identifier(:Port)
    )
  end

  defp map_to_js({:__aliases__, _, [:Reference]}, _) do
    JS.member_expression(
      JS.identifier(:Elixir),
      JS.identifier(:Reference)
    )
  end

  defp map_to_js({:__aliases__, _, [:Map]}, _) do
    JS.identifier(:Object)
  end

  defp map_to_js({:__aliases__, _, [:Any]}, _) do
    JS.identifier(:null)
  end


  defp map_to_js({:__aliases__, _, _} = module, env) do
    ElixirScript.Translator.Struct.get_struct_class(
      module,
      env
    )
  end

end
