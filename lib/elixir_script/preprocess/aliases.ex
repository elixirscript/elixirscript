defmodule ElixirScript.Preprocess.Aliases do
  @moduledoc false

  @doc """
    Takes the ast, records any uses of outer modules, and updates the calls
    to make them look like as if using an alias

    ex.
      Hello.World.hi()

      #would turn into
      World.hi()

      #the "Hello.World" would be placed in a set and later used for building an alias
  """
  def process(ast, env) do

    state = %{ add: HashSet.new, defined: HashSet.new }

    {new_ast, state } = Macro.prewalk(ast, state, fn(x, acc) ->
      process_aliases(x, acc, env)
    end)

    { new_ast, state.add }
  end

  def process_aliases({:alias, _, [{:__aliases__, _, _name}, [as: {:__aliases__, _, alias_name}]]} = ast, state, _) do
    { ast, %{state | defined: HashSet.put(state.defined, List.last(alias_name)) } } 
  end

  def process_aliases({:alias, _, [{:__aliases__, _, name}]} = ast, state, _) do
    { ast, %{state | defined: HashSet.put(state.defined, List.last(name)) } }
  end

  def process_aliases({{:., meta1, [{:__aliases__, meta2, aliases}, function]}, meta3, params} = ast, state, env) do
    if ElixirScript.State.module_listed?(aliases) do
      new_ast = {{:., meta1, [{:__aliases__, meta2, List.last(aliases) |> List.wrap }, function]}, meta3, params}

      new_state = if !HashSet.member?(state.defined, List.last(aliases)) do
        %{ state | add: HashSet.put(state.add, aliases) }
      else
        state
      end

      { new_ast, new_state }
    else
      { ast, state }
    end
  end

  def process_aliases(ast, state, _) do
    {ast, state}
  end
end