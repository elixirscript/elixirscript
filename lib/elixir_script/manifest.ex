defmodule ElixirScript.Manifest do
  @moduledoc false

  @spec read_manifest(binary) :: nil
  def read_manifest(_manifest) do

  end

  @spec write_manifest(binary, [{atom, map}], map) :: :ok
  def write_manifest(manifest_path, modules, opts) do
    output_path = if opts.output == nil or opts.output == :stdout do
     ""
    else
      Path.dirname(opts.output)
    end

    data = Enum.reduce(modules, %{}, fn {module, info}, current_data ->
      info = %{
        references: info.used_modules,
        last_modified: info.last_modified,
        beam_path: Map.get(info, :beam_path),
        source: Map.get(info, :file),
        js_path: Path.join(output_path, "#{module}.js")
      }

      Map.put(current_data, module, info)
    end)

    data = :erlang.term_to_binary(data, [:compressed])
    File.mkdir_p!(Path.dirname(manifest_path))
    File.write!(manifest_path, data)

    :ok
  end
end
