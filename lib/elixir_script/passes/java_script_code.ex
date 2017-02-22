defmodule ElixirScript.Passes.JavaScriptCode do
  @moduledoc false
  alias ESTree.Tools.{Builder, Generator}

  def execute(compiler_data, _) do
    parent = self

    js_code = compiler_data.compiled
    |> List.wrap
    |> Builder.program
    |> prepare_js_ast
    |> Generator.generate

    Map.put(compiler_data, :generated, js_code)
  end

  defp prepare_js_ast(js_ast) do
    case js_ast do
      modules when is_list(modules) ->
        modules
        |> Enum.reduce([], &(&2 ++ &1.body))
        |> Builder.program
      %ElixirScript.Translator.Group{body: body} ->
        Builder.program(body)
      %ElixirScript.Translator.Empty{} ->
        Builder.program([])
      _ ->
        js_ast
    end
  end
end
