defmodule ElixirScript.Experimental.Forms.Call do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.State, as: ModuleState

  def compile({{:., _, [module, function]}, _, params}, state) do
    function_name = cond do
      ElixirScript.Experimental.Module.is_js_module(module, state) ->
        ElixirScript.Translator.Identifier.make_extern_function_name(function)
      ElixirScript.Experimental.Module.is_elixir_module(module) ->
        if ModuleState.get_module(state.pid, module) == nil do
          ElixirScript.Experimental.Module.compile(module, state.pid)
        end
        ElixirScript.Translator.Identifier.make_function_name(function, length(params))
      true ->
        ElixirScript.Translator.Identifier.make_function_name(function, length(params))            
    end

    J.call_expression(
      J.member_expression(
        process_module_name(module, state),
        function_name
      ),
      Enum.map(params, &Form.compile(&1, state))
    )
  end

  defp process_module_name(module, state) when is_atom(module) do
    cond do
      ElixirScript.Experimental.Module.is_js_module(module, state) ->
        members = tl(Module.split(module))
        Identifier.make_namespace_members(members)      
      ElixirScript.Experimental.Module.is_elixir_module(module) ->
        members = ["Elixir"] ++ Module.split(module)
        J.identifier(Enum.join(members, "_"))
      true ->
        ElixirScript.Translator.Identifier.make_identifier(module)
    end
  end

  defp process_module_name(module, state) do
    Form.compile(module, state)
  end
end
