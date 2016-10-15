defmodule ElixirScript.Passes.JavaScriptAST do
  @pass 7
  alias ElixirScript.Translator.Utils

  def execute(compiler_data, opts) do
    data = Enum.map(compiler_data.data, fn({module_name, module_data}) ->
      module_data = compile(module_data, opts)
      {module_name, module_data}
    end)

    %{ compiler_data | data: data }
  end


  defp compile(module_data, opts) do
    env = ElixirScript.Translator.LexicalScope.module_scope(module_data.module,  Utils.name_to_js_file_name(module_data.module) <> ".js", opts.env)

    module = case module_data.type do
               :module ->
                 ElixirScript.Translator.Defmodule.make_module(module_data.module, module_data.ast, env)
               :protocol ->
                 ElixirScript.Translator.Defprotocol.make(module_data.module, module_data.functions, env)
               :protocol_implementation ->
                 ElixirScript.Translator.Defimpl.make(module_data.module, module_data.for, module_data.ast, env)
             end

    Map.put(module_data, :javascript_ast, module.body)
  end
end
