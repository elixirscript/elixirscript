defmodule ElixirScript.Translator.Defimpl do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Defmodule
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils

  def make(name, type, body, env) do

    type = map_to_js(type, env)
    {body, export} = Defmodule.process_module(name, body, env)

    protocol_name = Atom.to_string(name) |> String.split(".DefImpl.") |> hd |> String.to_atom

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

    %{
      name: Utils.quoted_to_name({:__aliases__, [], name }),
      exports: export,
      body: body,
      app_name: State.get_module(env.state, name).app,
      protocol: protocol_name,
      env: env      
    }
  end

  defp map_to_js({:__aliases__, _, [:Integer]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier("Bootstrap"),
        JS.identifier(:Core)
      ),
      JS.identifier(:Integer)
    )
  end

  defp map_to_js({:__aliases__, _, [:Tuple]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier("Bootstrap"),
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
        JS.identifier("Bootstrap"),
        JS.identifier(:Core)
      ),
      JS.identifier(:BitString)
    )
  end

  defp map_to_js({:__aliases__, _, [:Float]}, _) do
    JS.member_expression(
      JS.member_expression(
        JS.identifier("Bootstrap"),
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
        JS.identifier("Bootstrap"),
        JS.identifier(:Core)
      ),
      JS.identifier(:PID)
    )
  end

  defp map_to_js({:__aliases__, _, [:Port]}, _) do
    JS.member_expression(
      JS.identifier("Bootstrap"),
      JS.identifier(:Port)
    )
  end

  defp map_to_js({:__aliases__, _, [:Reference]}, _) do
    JS.member_expression(
      JS.identifier("Bootstrap"),
      JS.identifier(:Reference)
    )
  end

  defp map_to_js({:__aliases__, _, [:Map]}, _) do
    JS.identifier(:Object)
  end

  defp map_to_js({:__aliases__, context, [:JS | rest]}, env) do
    ElixirScript.Translator.JS.translate_js_module({:__aliases__, context, rest}, env)
    |> elem(0)
  end

  defp map_to_js({:__aliases__, _, [:Any]}, _) do
    JS.identifier(:null)
  end


  defp map_to_js({:__aliases__, _, _} = module, env) do
    module = case ElixirScript.Translator.create_module_name(module, env) do
        {module, _} ->
          module
        module ->
          module
      end

    ElixirScript.Translator.translate!(module)
  end

end
