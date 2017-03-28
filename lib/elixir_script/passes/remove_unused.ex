defmodule ElixirScript.Passes.RemoveUnused do
  @moduledoc false
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.State

  def execute(compiler_data, %{remove_unused: false}) do
    compiler_data
  end

  def execute(compiler_data, opts) do
    module_refs = State.list_module_references(compiler_data.state)

   data = Enum.reject(compiler_data.data, fn
     {_, %{type: :impl} = module_data} ->
       length(Keyword.get(module_refs, module_data.implements, [])) == 0
     {_, %{type: :consolidated} = module_data} ->
       length(Keyword.get(module_refs, module_data.protocol, [])) == 0
     {module, module_data} ->
        cond do
          Enum.member?(module_data.functions, {:start, 2}) ->
            false
          length(Keyword.get(module_refs, module, [])) > 0 ->
            false
          true ->
            true
        end
    end)

    %{ compiler_data | data: data }
  end
end