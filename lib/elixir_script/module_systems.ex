defmodule ElixirScript.ModuleSystems do

  defp module_system() do
    ElixirScript.ModuleSystems.ES6
  end

  def import_namespace_module(module_name, from, env) do
    module_system.import_namespace_module(module_name, from, env)
  end

  def import_module(module_name, from, env) do
    module_system.import_module(module_name, from, env)
  end

  def import_module(import_name, from) do
    module_system.import_module(import_name, from)
  end

  def export_module(exported_object) do
    module_system.export_module(exported_object)
  end

end
