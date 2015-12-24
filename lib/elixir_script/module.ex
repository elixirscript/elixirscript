defmodule ElixirScript.Module do
  @moduledoc false

  defstruct name: nil,
  functions: Keyword.new, private_functions: Keyword.new,
  macros: Keyword.new, private_macros: Keyword.new,
  body: nil, js_imports: [], module_refs: [], type: :module,
  spec: nil, impls: HashDict.new


  def quoted_to_name(the_alias) do
    {name, _} = Code.eval_quoted(the_alias)
    name
  end

  def name_to_quoted(name) do
    name = name
    |> Atom.to_string
    |> String.split(".")
    |> tl
    |> Enum.map(fn x -> String.to_atom(x) end)

    { :__aliases__, [], name }
  end

  def name_to_js_name(name) do
    { :__aliases__, _, name } = name_to_quoted(name)
    Enum.join([:Elixir] ++ name, "$")
  end

  def name_to_js_file_name(name) do
    { :__aliases__, _, name } = name_to_quoted(name)
    Enum.join([:Elixir] ++ name, ".")
  end

  def has_function?(module_name, name_arity) do
    module = ElixirScript.State.get_module(module_name)
    name_arity in module.functions or name_arity in module.private_functions
  end

  def build_standard_lib_map() do
    Map.new
    |> Map.put(Kernel, ElixirScript.Kernel)
    |> Map.put(Tuple, ElixirScript.Tuple)
    |> Map.put(Atom, ElixirScript.Atom)
    |> Map.put(Collectable, ElixirScript.Collectable)
    |> Map.put(String.Chars, ElixirScript.String.Chars)
    |> Map.put(Enumerable, ElixirScript.Enumerable)
    |> Map.put(Integer, ElixirScript.Integer)
    |> Map.put(Macro.Env, ElixirScript.Macro.Env)
    |> Map.put(View, ElixirScript.View)
  end

  def get_module_name(module_name) do
    case Map.get(build_standard_lib_map, module_name) do
      nil ->
        module_name
      actual_module_name ->
        actual_module_name
    end
  end

end
