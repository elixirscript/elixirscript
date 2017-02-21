defmodule ElixirScript.Translator.Defimpl do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Defmodule
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils

  def make(name, type, body, env) do

    type = map_to_js(type, env)
    {imports, js_imports, body, export} = Defmodule.process_module(name, body, env)

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
      std_lib: Defmodule.make_std_lib_import(env),      
      imports: imports,
      js_imports: js_imports,
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
