defmodule ElixirScript.Passes.JavaScriptAST do
  @pass 7
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do
    State.set_module_data(compiler_data.data)

    parent = self

    data = compiler_data.data
    |> Enum.map(fn({module_name, module_data}) ->

      spawn_link fn ->
        module_data = compile(module_data, opts)
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


  defp compile(module_data, opts) do
    loaded_modules = case Map.get(module_data, :path) do
                       nil ->
                         []
                       files ->
                         Kernel.ParallelRequire.files(List.wrap(files))
                     end

    State.add_loaded_modules(loaded_modules)


    env = ElixirScript.Translator.LexicalScope.module_scope(module_data.name,  Utils.name_to_js_file_name(module_data.name) <> ".js", opts.env)

    module = case module_data.type do
               :module ->
                 ElixirScript.Translator.Defmodule.make_module(module_data.name, module_data.ast, env)
               :protocol ->
                 ElixirScript.Translator.Defprotocol.make(module_data.name, module_data.functions, env)
               :impl ->
                 ElixirScript.Translator.Defimpl.make(module_data.name, module_data.for, module_data.ast, env)
             end

    Map.put(module_data, :javascript_ast, module.body)
  end
end
