defmodule ElixirScript.Experimental.Forms.Call do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Experimental.ModuleState

  def compile({{:., _, [module, function]}, _, params}, state) do
    function_name = if ElixirScript.Experimental.Module.is_js_module(module) do
      ElixirScript.Translator.Identifier.make_extern_function_name(function)
    else
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
      ElixirScript.Experimental.Module.is_js_module(module) ->
        members = tl(Module.split(module))
        Identifier.make_namespace_members(members)      
      ElixirScript.Experimental.Module.is_elixir_module(module) ->
        ModuleState.put_module_ref(state.pid, module)
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
