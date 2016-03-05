defmodule ElixirScript.ModuleSystems do

  defp module_system() do
    ElixirScript.ModuleSystems.ES6
  end

  def import_module(module_names, from, env) when is_list(module_names) do
    module_system.import_module(module_names, from, env)
  end

  def import_module(module_name, from, env) do
    module_system.import_module(module_name, from, env)
  end

  def import_module(module_name, %ElixirScript.Macro.Env{} = env) do
    module_system.import_module(module_name, env)
  end

  def import_module(import_name, from) do
    module_system.import_module(import_name, from)
  end

  def export_module(exported_object) do
    module_system.export_module(exported_object)
  end

end
