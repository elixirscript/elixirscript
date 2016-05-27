defmodule ElixirScript.Translator.Call do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Identifier


  def make_function_or_property_call(module_name, function_name, env) do
    the_name = get_module_name_for_function(module_name, env)

    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Elixir"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Utils.make_module_expression_tree(the_name, false, env),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    { js_ast, env }
  end


  defp get_module_name_for_function(module_name, env) do
    case module_name do
      {:__aliases__, _, name} ->
        module_name = Utils.quoted_to_name(name)
        get_js_name(module_name, env)
      {name, _, _} when is_atom(name) ->
        get_js_name(name, env)
      {{:., _, [_, _]}, _, _ } = ast ->
        ast
      {{:., _, [{:__aliases__, _, _}]}, _, _} = ast ->
        ast
      ast when is_list(ast) ->
        ast
      name ->
        get_js_name(name, env)
    end
  end


  def make_function_call(function_name, params, env) when is_tuple(function_name) do
    { Utils.make_call_expression(function_name, params, env), env }
  end

  def make_function_call(function_name, params, env) do
    { Utils.make_call_expression(function_name, params, env), env }
  end

  def make_function_call(module_name, function_name, params, env) when is_list(module_name) do
    call = JS.call_expression(
      JS.member_expression(
        Translator.translate!(module_name, env),
        Identifier.make_identifier(function_name)
      ),
      Enum.map(params, &Translator.translate!(&1, env))
    )

    { call, env }
  end

  def make_function_call(module_name, function_name, params, env) do
    the_name = get_module_name_for_function(module_name, env)
    { Utils.make_call_expression(the_name, function_name, params, env), env }
  end


  defp get_js_name([Elixir | _] = list, _) do
    list
  end

  defp get_js_name(module_name, env) when is_list(module_name) do
    Utils.quoted_to_name({:__aliases__, [], module_name})
    |> get_js_name(env)
  end

  defp get_js_name(module_name, env) do

    cond do
      module_name in env.requires ->
        Utils.name_to_js_name(module_name)

      module_name in ElixirScript.Translator.State.list_module_names ->
        ElixirScript.Translator.State.add_module_reference(env.module, module_name)
        Utils.name_to_js_name(module_name)

      true ->
        case Atom.to_string(module_name) do
          "Elixir." <> _ ->
            {:__aliases__, _, name } = Utils.name_to_quoted(module_name)
            name
          _ ->
            module_name
        end
    end
  end



  end
