defmodule ElixirScript.Passes.CreateJSModules do
  @moduledoc false  
  alias ElixirScript.Translator.Utils

  def execute(compiler_data, opts) do
    parent = self

    data = Enum.map(compiler_data.data, fn({module_name, module_data}) ->

      spawn_link fn ->
        module_data = compile(module_data, opts, compiler_data.state)
        result = {module_name, module_data}
        send parent, {self, result }
      end

    end)
    |> Enum.map(fn pid ->
      receive do
        {^pid, result} ->
          result
      end
    end)

    %{ compiler_data | data: data }
  end

  defp compile(%{load_only: true} = module_data, opts, state) do
    module_data
  end

  defp compile(%{type: :consolidated} = module_data, opts, state) do
    js_module = module_data
    env = ElixirScript.Translator.LexicalScope.module_scope(module_data.name,  Utils.name_to_js_file_name(module_data.name) <> ".js", opts.env, state, opts)
    
    ast = opts.module_formatter.build(
      js_module.std_lib, 
      js_module.imports, 
      js_module.js_imports,
      js_module.body,
      js_module.exports,
      env
    )

    Map.put(module_data, :javascript_ast, ast)
  end    

  defp compile(module_data, opts, state) do
    js_module = module_data.javascript_module
    env = js_module.env
    
    ast = opts.module_formatter.build(
      js_module.std_lib, 
      js_module.imports, 
      js_module.js_imports,
      js_module.body,
      js_module.exports,
      env
    )

    Map.put(module_data, :javascript_ast, ast)
  end  

end
