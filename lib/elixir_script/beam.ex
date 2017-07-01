defmodule ElixirScript.Beam do
  @moduledoc false

  @doc """
  Takes a module and finds the expanded AST
  from the debug info inside the beam file.
  For protocols, this will return a list of
  all the protocol implementations
  """
  @spec debug_info(atom) :: {:ok | :error, map | binary}
  def debug_info(module)

  #Replacing String module with our ElixirScript's version
  def debug_info(String) do
    case debug_info(ElixirScript.String) do
      {:ok, info} ->
        {:ok, Map.put(info, :module, String)}
      e ->
        e
    end
  end

  def debug_info(module) when is_atom(module) do
    #TODO: Get modified date from _beam_path to check for cached version?
    with  {_, beam, _beam_path} <- :code.get_object_code(module),
          {:ok, {^module, [debug_info: {:debug_info_v1, backend, data}]}} <- :beam_lib.chunks(beam, [:debug_info]),
          {:ok, {^module, attribute_info}} = :beam_lib.chunks(beam, [:attributes]) do

          if Keyword.get(attribute_info[:attributes], :protocol) do
            get_protocol_implementations(module)
          else
            backend.debug_info(:elixir_v1, module, data, [])
          end
    else
      :error ->
        {:error, "Unknown module"}
      {:error,:beam_lib,{:unknown_chunk,"non_existing.beam",:debug_info}} ->
        {:error, "Unsupported version of Erlang"}
      {:error,:beam_lib,{:missing_chunk, _ , _}} ->
        {:error, "Debug info not available"}
      {:error,:beam_lib,{:file_error,"non_existing.beam",:enoent}} ->
        {:error, "Debug info not available"}
    end
  end

  defp get_protocol_implementations(module) do
    implementations = module
    |> Protocol.extract_impls(:code.get_path())
    |> Enum.map(fn(x) -> Module.concat([module, x]) end)
    |> Enum.map(fn(x) ->
      case debug_info(x) do
        {:ok, info} ->
          {x, info}
        _ ->
          raise "Unable to compile protocol implementation #{inspect x}"
      end
    end)

    {:ok, module, implementations}
  end

end