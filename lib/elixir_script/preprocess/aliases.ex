defmodule ElixirScript.Preprocess.Aliases do
  @moduledoc """
    Takes the ast, records any uses of outer modules, and updates the calls
    to make them look like as if using an alias

    ex.
      Hello.World.hi()

      #would turn into
      World.hi()

      #the "Hello.World" would be placed in a set and later used for building an alias
  """

  def process(ast) do
    state = %{ add: HashSet.new, defined: HashSet.new }

    {new_ast, state } = Macro.prewalk(ast, state, fn(x, acc) ->
      process_aliases(x, acc)
    end)

    { new_ast, state.add }
  end

  def process_aliases({:alias, _, [{:__aliases__, _, name}]} = ast, state) do
    { ast, %{state | defined: HashSet.put(state.defined, List.last(name)) } }
  end

  def process_aliases({{:., meta1, [{:__aliases__, meta2, aliases}, function]}, meta3, params}, state) do
    if HashSet.member?(state.defined, List.last(aliases)) do
      { {{:., meta1, [{:__aliases__, meta2, List.last(aliases)}, function]}, meta3, params}, state }
    else
      {
        {{:., meta1, [{:__aliases__, meta2, List.last(aliases) |> List.wrap }, function]}, meta3, params},
        %{ state | add: HashSet.put(state.add, aliases) }
      }
    end
  end

  def process_aliases(ast, state) do
    {ast, state}
  end
end