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

  # We get debug info from String and then replace
  # functions in it with equivalents in ElixirScript.String.
  # This is so that we don't include the unicode database
  # in our output
  def debug_info(String) do
    {:ok, info} = do_debug_info(String)
    {:ok, ex_string_info} = do_debug_info(ElixirScript.String)

    definitions = replace_definitions(info.definitions, ex_string_info.definitions)

    info = %{info | definitions: definitions}

    {:ok, info}
  end

  # Replace some modules with ElixirScript versions
  def debug_info(module) when module in [Agent] do
    case do_debug_info(Module.concat(ElixirScript, module)) do
      {:ok, info} ->
        {:ok, Map.put(info, :module, module)}
      e ->
        e
    end
  end

  def debug_info(module) when is_atom(module) do
    do_debug_info(module)
  end

  defp do_debug_info(module) when is_atom(module) do
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

  defp replace_definitions(original_definitions, replacement_definitions) do
    Enum.map(original_definitions, fn
      {{function, arity}, type, _, _} = ast ->
        ex_ast = Enum.find(replacement_definitions, fn
          {{ex_function, ex_arity}, ex_type, _, _}  ->
            ex_function == function and ex_arity == arity and ex_type == type
        end)

        case ex_ast do
          nil ->
            ast
          _ ->
            ex_ast
        end
    end)
  end

end
