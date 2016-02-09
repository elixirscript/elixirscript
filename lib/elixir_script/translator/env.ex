defmodule ElixirScript.Translator.Env do
  @moduledoc false

  def module_env(ElixirScript.Temp, filename) do

    env = %ElixirScript.Macro.Env {
      module: ElixirScript.Temp, file: filename, requires: [],
      functions: [],
      macros: []
    }

    add_import(env, ElixirScript.Kernel)
  end

  def module_env(module_name, filename) do
    module = ElixirScript.Translator.State.get_module(module_name)

    env = %ElixirScript.Macro.Env {
      module: module_name, file: filename, requires: [],
      functions: [{ module.name, module.functions}],
      macros: [{ module.name, module.macros}]
    }

    add_import(env, ElixirScript.Kernel)
  end

  def function_env(env, { _, _ } = func) do
    %{ env |  function: func, caller: env }
  end

  def function_env(env, nil) do
    %{ env |  function: nil, caller: env, vars: [] }
  end

  def find_module(env, name_arity) do
    result = Enum.find(env.functions ++ env.macros, fn({_, functions}) ->
      name_arity in functions
    end)

    if result == nil do
      nil
    else
      elem(result, 0)
    end

  end

  def add_var(env, variable_name) when is_binary(variable_name) do
    add_var(env, String.to_atom(variable_name))
  end

  def add_var(env, variable_name) do
    %{ env |  vars: Keyword.update(env.vars, variable_name, 0, &(&1 + 1)) }
  end

  def get_var(env, variable_name) when is_binary(variable_name) do
    get_var(env, String.to_atom(variable_name))
  end

  def get_var(env, variable_name) do
    count = Keyword.get(env.vars, variable_name, nil)

    case count do
      nil ->
        nil
      0 ->
        String.to_atom(Atom.to_string(variable_name))
      _ ->
        String.to_atom(Atom.to_string(variable_name) <> to_string(count))
    end
  end

  def has_var?(env, variable_name) when is_binary(variable_name) do
    has_var?(env, String.to_atom(variable_name))
  end

  def has_var?(env, variable_name) do
    Keyword.get(env.vars, variable_name, nil) != nil
  end

  defp get_module(env, Kernel) do
    get_module(env, ElixirScript.Kernel)
  end

  defp get_module(env, module_name) do
    module = get_module_name(env, module_name) |>
      ElixirScript.Translator.State.get_module

    unless module do
      raise "Module #{module_name} not found"
    end

    ElixirScript.Translator.State.add_module_reference(env.module, module.name)
    module
  end

  def add_import(env, module_name) do
    module = get_module(env, module_name)


    %{ env | requires: Enum.uniq(env.requires ++ [module.name]),
    functions: env.functions ++ [{ module.name, module.functions }],
    macros: env.macros ++ [{ module.name, module.macros }] }
  end

  def add_import(env, module_name, [only: :functions]) do
    module = get_module(env, module_name)

    %{ env | functions: List.keydelete(env.functions, module_name, 0) ++ [{ module.name, module.functions }],
    macros: List.keydelete(env.macros, module_name, 0),
    requires: Enum.uniq(env.requires ++ [module.name]) }
  end

  def add_import(env, module_name, [only: :macros]) do
    module = get_module(env, module_name)

    %{ env | macros: List.keydelete(env.macros, module_name, 0) ++ [{ module.name, module.macros }],
    functions: List.keydelete(env.functions, module_name, 0),
    requires: Enum.uniq(env.requires ++ [module.name]) }
  end

  def add_import(env, module_name, [only: only]) do
    module = get_module(env, module_name)

    macros = Enum.filter(module.macros, fn(mac) ->
      mac in only
    end)
    functions = Enum.filter(module.functions, fn(func) ->
      func in only
    end)

    %{ env | requires: Enum.uniq(env.requires ++ [module.name]),
    functions: List.keydelete(env.functions, module_name, 0) ++ [{ module.name, functions }],
    macros: List.keydelete(env.macros, module_name, 0) ++ [{ module.name, macros }] }
  end

  def add_import(env, module_name, [except: except]) do
    module = get_module(env, module_name)

    {_, current_functions } = List.keyfind(env.functions, module_name, 0, { module_name, module.functions })
    {_, current_macros } = List.keyfind(env.macros, module_name, 0, { module_name, module.macros })

    macros = Enum.filter(current_macros, fn(mac) -> not(mac in except) end)
    functions = Enum.filter(current_functions, fn(func) -> not(func in except) end)

    %{ env | requires: env.requires ++ [module.name],
    functions: List.keydelete(env.functions, module_name, 0) ++ [{ module.name, functions }],
    macros: List.keydelete(env.macros, module_name, 0) ++ [{ module.name, macros }] }
  end

  def add_alias(env, module_name, alias_name) do
    module = get_module(env, module_name)

    %{ env | aliases: Enum.uniq(env.aliases ++ [{alias_name, module.name}]) }
  end

  def add_require(env, module_name) do
    module = get_module(env, module_name)

    %{ env | requires: Enum.uniq(env.requires ++ [module.name]) }
  end

  def add_require(env, module_name, alias_name) do
    module = get_module(env, module_name)

    %{ env | aliases: Enum.uniq(env.aliases ++ [{alias_name, module.name}]),
    requires: Enum.uniq(env.requires ++ [module.name]) }
  end

  def get_module_name(env, module_name) do
    module_name = ElixirScript.Translator.State.get_module_name(module_name)

    if Keyword.has_key?(env.aliases, module_name) do
      Keyword.fetch!(env.aliases, module_name)
    else
      module_name
    end

  end

end
