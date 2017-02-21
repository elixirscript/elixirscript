defmodule ElixirScript.Passes.JavaScriptCode do
  @moduledoc false
  alias ESTree.Tools.{ Builder, Generator }

  def execute(compiler_data, _) do
    parent = self

    data = Enum.map(compiler_data.data, fn({module_name, module_data}) -> 
        module_data = compile(module_data)
        {module_name, module_data}
    end)

    %{ compiler_data | data: data }
  end

  defp compile(%{load_only: true} = module_data) do
    module_data
  end

  defp compile(module_data) do
    js_ast = Builder.program(List.wrap(module_data.javascript_ast))

    js_code = js_ast
    |> prepare_js_ast
    |> Generator.generate

    Map.put(module_data, :javascript_code, js_code)
  end

  defp prepare_js_ast(js_ast) do
    case js_ast do
      modules when is_list(modules) ->
        modules
        |> Enum.reduce([], &(&2 ++ &1.body))
        |> Builder.program
      %ElixirScript.Translator.Group{ body: body } ->
        Builder.program(body)
      %ElixirScript.Translator.Empty{ } ->
        Builder.program([])
      _ ->
        js_ast
    end
  end
end
