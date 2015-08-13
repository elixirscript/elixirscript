defmodule ElixirScript.Preprocess.Aliases do
  @moduledoc false

  @standard_libs [
    [:Erlang],
    [:Atom],
    [:BitString],
    [:Enum],
    [:Integer],
    [:Kernel],
    [:Kernel, :SpecialForms],
    [:Kernel, :JS],
    [:List],
    [:Logger],
    [:Mutable],
    [:Range],
    [:Tuple]
  ]

  @doc """
    Takes the ast, records any uses of outer modules, and updates the calls
    to make them look like as if using an alias

    ex.
      Hello.World.hi()

      #would turn into
      World.hi()

      #the "Hello.World" would be placed in a set and later used for building an alias
  """
  def process(ast) do
    
    #These will always be added
    stdlib = HashSet.new 
    |> HashSet.put(:Erlang)
    |> HashSet.put(:Kernel)
    |> HashSet.put(:fun)
    |> HashSet.put(:Tuple)

    state = %{ add: HashSet.new, defined: HashSet.new, stdlib: stdlib }

    {new_ast, state } = Macro.prewalk(ast, state, fn(x, acc) ->
      process_aliases(x, acc)
    end)

    { new_ast, state.add, state.stdlib }
  end

  def process_aliases({:alias, _, [{:__aliases__, _, _name}, [as: {:__aliases__, _, alias_name}]]} = ast, state) do
    { ast, %{state | defined: HashSet.put(state.defined, List.last(alias_name)) } } 
  end

  def process_aliases({:alias, _, [{:__aliases__, _, name}]} = ast, state) do
    { ast, %{state | defined: HashSet.put(state.defined, List.last(name)) } }
  end

  def process_aliases({{:., _, [{:__aliases__, _, aliases}, _]}, _, _} = ast, state) when aliases in @standard_libs do
    {ast, %{ state | stdlib: HashSet.put(state.stdlib, List.last(aliases))  }}
  end

  def process_aliases({{:., meta1, [{:__aliases__, meta2, aliases}, function]}, meta3, params}, state) do
    if HashSet.member?(state.defined, List.last(aliases)) do
      { {{:., meta1, [{:__aliases__, meta2, List.last(aliases) |> List.wrap  }, function]}, meta3, params}, state }
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