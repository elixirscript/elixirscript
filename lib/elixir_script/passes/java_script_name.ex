defmodule ElixirScript.Passes.JavaScriptName do
  @pass 8
  alias ElixirScript.Translator.Utils

  def execute(compiler_data, _) do
    data = Enum.map(compiler_data.data, fn({module_name, module_data}) ->
      module_data = make_name(module_data)
      {module_name, module_data}
    end)

    %{ compiler_data | data: data }
  end


  defp make_name(%{ module: module, type: :module  } = module_data) do
    js_name = Utils.name_to_js_file_name(module) <> ".js"
    Map.put(module_data, :javascript_name, js_name)
  end

  defp make_name(%{ module: module, type: :protocol  } = module_data) do
    js_name = Utils.name_to_js_file_name(module) <> ".js"
    Map.put(module_data, :javascript_name, js_name)
  end

  defp make_name(%{ module: module, type: :impl, for: type  } = module_data) do
    type_name = Atom.to_string(Utils.quoted_to_name(type))

    js_name = Utils.name_to_js_file_name(module) <> ".DefImpl." <> type_name <> ".js"
    Map.put(module_data, :javascript_name, js_name)
  end
end
