defmodule ElixirScript.Passes.JavaScriptName do
  alias ElixirScript.Translator.Utils

  def execute(compiler_data, _) do
    data = Enum.map(compiler_data.data, fn({module_name, module_data}) ->
      js_name = Utils.name_to_js_file_name(module_name) <> ".js"
      module_data = Map.put(module_data, :javascript_name, js_name)
      {module_name, module_data}
    end)

    %{ compiler_data | data: data }
  end
end
