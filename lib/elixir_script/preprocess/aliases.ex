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
  def process(ast, env) do
    
    #These will always be added
    stdlib = HashSet.new 
    |> HashSet.put(:Erlang)
    |> HashSet.put(:Kernel)
    |> HashSet.put(:fun)
    |> HashSet.put(:Tuple)
    |> HashSet.put(:Enum)

    state = %{ add: HashSet.new, defined: HashSet.new, stdlib: stdlib }

    {new_ast, state } = Macro.prewalk(ast, state, fn(x, acc) ->
      process_aliases(x, acc, env)
    end)

    { new_ast, state.add, state.stdlib }
  end

  def process_aliases({:alias, _, [{:__aliases__, _, _name}, [as: {:__aliases__, _, alias_name}]]} = ast, state, _) do
    { ast, %{state | defined: HashSet.put(state.defined, List.last(alias_name)) } } 
  end

  def process_aliases({:alias, _, [{:__aliases__, _, name}]} = ast, state, _) do
    { ast, %{state | defined: HashSet.put(state.defined, List.last(name)) } }
  end


  def process_aliases({{:., _, [{:__aliases__, _, aliases}, _]}, _, _} = ast, state, env) when aliases in @standard_libs do
    expanded_ast = Macro.expand(ast, env)
    if expanded_ast == ast do
      {ast, %{ state | stdlib: HashSet.put(state.stdlib, List.last(aliases))  }}
    else
      process_aliases(expanded_ast, state, env)
    end
  end

  def process_aliases({{:., meta1, [{:__aliases__, meta2, aliases}, function]}, meta3, params} = ast, state, env) do
    expanded_ast = Macro.expand(ast, env)

    if expanded_ast == ast do
      new_ast = {{:., meta1, [{:__aliases__, meta2, List.last(aliases) |> List.wrap }, function]}, meta3, params}

      new_state = if HashSet.member?(state.defined, List.last(aliases)) do
        state
      else
        %{ state | add: HashSet.put(state.add, aliases) }
      end

      { new_ast, new_state }
    else
      process_aliases(expanded_ast, state, env)
    end
  end

  def process_aliases(ast, state, env) do
    {ast, state}
  end
end