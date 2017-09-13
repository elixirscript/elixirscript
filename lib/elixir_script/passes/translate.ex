defmodule ElixirScript.Translate do
  @moduledoc false

  @doc """
  Takes a list of modules and translates their ast into
  JavaScript AST. The modules are the ones collected from
  the FindUsed pass.
  """
  @spec execute([atom], pid) :: nil
  def execute(modules, pid) do
    modules
    |> List.wrap()
    |> Task.async_stream(fn
      {module, info} ->
        ElixirScript.Translate.Module.compile(module, info, pid)
    end)
    |> Stream.run()
  end
end
