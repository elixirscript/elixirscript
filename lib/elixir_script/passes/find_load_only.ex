defmodule ElixirScript.Passes.FindLoadOnly do
  @moduledoc false

  def execute(compiler_data, opts) do
    data = compiler_data.data
    |> Enum.map(fn({module_name, module_data}) ->

      {_, load_only} = Macro.prewalk(module_data.ast, false, fn
      ({:@, _, [{:load_only, _, [true]}]} = ast, state) ->
        {ast, true}

      ({:@, _, [{:load_only, _, [false]}]} = ast, state) ->
        {ast, false}

      ({:@, _, [{:load_only, _, []}]} = ast, state) ->
        {ast, true}

      (ast, state) ->
        {ast, state}
    end)

      { module_name, Map.put(module_data, :load_only, load_only) }

      end)



    %{ compiler_data | data: data }
  end



end
