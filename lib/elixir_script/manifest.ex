defmodule ElixirScript.Manifest do
  @moduledoc false

  @spec read_manifest(binary) :: nil
  def read_manifest(_manifest) do

  end

  @spec write_manifest(binary, map) :: :ok
  def write_manifest(manifest_path, modules) do
    data = Enum.reduce(modules, %{}, fn {module, info}, current_data ->
      Map.put(current_data, module, Map.drop(info, [:js_code]))
    end)

    data = :erlang.term_to_binary(data, [:compressed])
    File.mkdir_p!(Path.dirname(manifest_path))
    File.write!(manifest_path, data)

    :ok
  end
end
