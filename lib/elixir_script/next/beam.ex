defmodule ElixirScript.Beam do

  @spec debug_info(atom) :: {:ok | :error, map | binary}
  def debug_info(module) when is_atom(module) do
    with  {_, beam, _} <- :code.get_object_code(module),
          {:ok, {^module, [debug_info: {:debug_info_v1, backend, data}]}} <- :beam_lib.chunks(beam, [:debug_info]) do
          backend.debug_info(:elixir_v1, module, data, [])
    else
      :error ->
        {:error, "Unknown module"}
      {:error,:beam_lib,{:unknown_chunk,"non_existing.beam",:debug_info}} ->
        {:error, "Unsupported version of Erlang"}
      {:error,:beam_lib,{:file_error,"non_existing.beam",:enoent}} ->
        {:error, "Debug info not available"}
    end

  end

end