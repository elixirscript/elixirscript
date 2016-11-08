defmodule ElixirScript.Translator.LexicalScope do
  @moduledoc false

  @type t :: %ElixirScript.Translator.LexicalScope{
    module: atom,
    file: binary,
    line: non_neg_integer,
    function: { atom, non_neg_integer } | nil,
    context: :match | :guard | :generator | nil,
    aliases: [{atom, atom}],
    requires: [atom],
    functions: [{atom, [{ atom, non_neg_integer }]}],
    macros: [{atom, [{ atom, non_neg_integer }]}],
    macro_aliases: [{atom, {integer, atom}}],
    context_modules: [atom],
    vars: [{atom, atom | non_neg_integer}],
    export_vars: [{atom, atom | non_neg_integer}] | nil,
    lexical_tracker: nil,
    caller: t | nil,
    env: nil
  }

  defstruct [
    module: nil,
    file: nil,
    line: 0,
    function: nil,
    context: nil,
    aliases: [],
    requires: [],
    functions: [],
    macros: [],
    macro_aliases: [],
    context_modules: [],
    vars: [],
    export_vars: nil,
    lexical_tracker: nil,
    caller: nil,
    env: nil
  ]

  def env(scope) do
    %Macro.Env{
      module: scope.module,
      file: scope.file,
      line: scope.line,
      function: scope.function,
      context: scope.context,
      aliases: scope.aliases,
      requires: scope.requires,
      functions: scope.functions,
      macros: scope.macros,
      macro_aliases: scope.macro_aliases,
      context_modules: scope.context_modules,
      vars: Enum.map(scope.vars, fn({key, _}) -> {key, nil} end),
      export_vars: scope.export_vars,
      lexical_tracker: scope.lexical_tracker
    }
  end

  def caller(scope) do
    %Macro.Env{
      module: scope.caller.module,
      file: scope.caller.file,
      line: scope.caller.line,
      function: scope.caller.function,
      context: scope.caller.context,
      aliases: scope.caller.aliases,
      requires: scope.caller.requires,
      functions: scope.caller.functions,
      macros: scope.caller.macros,
      macro_aliases: scope.caller.macro_aliases,
      context_modules: scope.caller.context_modules,
      vars: Enum.map(scope.vars, fn({key, _}) -> {key, nil} end),
      export_vars: scope.caller.export_vars,
      lexical_tracker: scope.caller.lexical_tracker
    }
  end

  def module_scope(ElixirScript.Temp, filename, env) do

    env = %ElixirScript.Translator.LexicalScope {
      module: ElixirScript.Temp, file: filename, requires: [],
      functions: [],
      env: env
    }

    add_import(env, ElixirScript.Kernel)
  end

  def module_scope(module_name, filename, env) do
    module = ElixirScript.Translator.State.get_module(module_name)

    env = %ElixirScript.Translator.LexicalScope {
      module: module_name, file: filename, requires: [],
      functions: [{ module.name, module.functions}],
      env: env
    }

    env = add_import(env, ElixirScript.Kernel)

    cond do
      module_name == ElixirScript.JS ->
        env
      ElixirScript.Translator.State.is_module_loaded?(module_name) ->
        add_import(env, module_name, [only: :macros])
      true ->
        env
    end
  end

  def function_scope(env, { _, _ } = func) do
    %{ env |  function: func, caller: env, vars: [] }
  end

  def function_scope(env, nil) do
    %{ env |  function: nil, caller: env }
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
    module = get_module_name(env, module_name) |> ElixirScript.Translator.State.get_module

    unless module do
      module_name = case module_name do
        {:__aliases__, _, _} ->
                        ElixirScript.Translator.Utils.quoted_to_name(module_name)
                        |> Atom.to_string
                        |> String.split(".")
                        |> tl
                        |> Enum.join(".")
        _ ->
                        module_name
      end

      raise "Module #{inspect module_name} not found"
    end

    ElixirScript.Translator.State.add_module_reference(env.module, module.name)
    module
  end

  defp has_module?(env, module_name) do
    try do
      get_module(env, module_name)
      true
    rescue
      _ ->
        false
    end
  end

  def add_alias(env, module_name, alias_name) do
    module = get_module(env, module_name)
    %{ env | aliases: Enum.uniq(env.aliases ++ [{alias_name, module.name}]) }
  end

  def add_import(env, module_name) do
    check_for_module_existence(env, module_name)

    env = if ElixirScript.Translator.State.is_module_loaded?(module_name) do
      add_import_macro(env, module_name, [])
    else
      env
    end

    if has_module?(env, module_name) do
      module = get_module(env, module_name)
      %{ env | requires: Enum.uniq(env.requires ++ [module.name]),
         functions: env.functions ++ [{ module.name, module.functions }] }
    else
      env
    end
  end

  def add_import(env, module_name, [only: :functions]) do
      module = get_module(env, module_name)

      %{ env | functions: List.keydelete(env.functions, module_name, 0) ++ [{ module.name, module.functions }],
                       requires: Enum.uniq(env.requires ++ [module.name]) }
  end

  def add_import(env, module_name, [only: :macros]) do
    if !ElixirScript.Translator.State.is_module_loaded?(module_name) do
      raise "Module #{inspect module_name} not found"
    end

    add_import_macro(env, module_name, [only: :macros])
  end

  def add_import(env, module_name, [only: only]) do
    check_for_module_existence(env, module_name)

    env = if ElixirScript.Translator.State.is_module_loaded?(module_name) do
      list = module_name.__info__(:macros)
      list = Enum.filter(list, fn(mac) -> mac in only end)
      add_import_macro(env, module_name, [only: list])
    else
      env
    end

    if has_module?(env, module_name) do
      module = get_module(env, module_name)

      functions = Enum.filter(module.functions, fn(func) ->
        func in only
      end)

      %{ env | requires: Enum.uniq(env.requires ++ [module.name]),
         functions: List.keydelete(env.functions, module.name, 0) ++ [{ module.name, functions }] }
    else
      env
    end
  end

  def add_import(env, module_name, [except: except]) do
    check_for_module_existence(env, module_name)

    env = if ElixirScript.Translator.State.is_module_loaded?(module_name) do
      list = module_name.__info__(:macros)
      list = Enum.filter(list, fn(mac) -> mac in except end)
      add_import_macro(env, module_name, [except: list])
    else
      env
    end

    if has_module?(env, module_name) do
      module = get_module(env, module_name)
      {_, current_functions } = List.keyfind(env.functions, module.name, 0, { module.name, module.functions })

      functions = Enum.filter(current_functions, fn(func) -> not(func in except) end)

      %{ env | requires: env.requires ++ [module.name],
         functions: List.keydelete(env.functions, module.name, 0) ++ [{ module.name, functions }] }
    else
      env
    end
  end

  def add_require(env, module_name) do
    check_for_module_existence(env, module_name)

    env = if ElixirScript.Translator.State.is_module_loaded?(module_name) do
      add_require_macro(env, module_name, [])
    else
      env
    end

    if has_module?(env, module_name) do
      module = get_module(env, module_name)
      %{ env | requires: Enum.uniq(env.requires ++ [module.name]) }
    else
      env
    end
  end

  def add_require(env, module_name, alias_name) do
    check_for_module_existence(env, module_name)

    env = if ElixirScript.Translator.State.is_module_loaded?(module_name) do
      add_require_macro(env, module_name, [as: alias_name])
    else
      env
    end

    if has_module?(env, module_name) do
      module = get_module(env, module_name)
      %{ env | aliases: Enum.uniq(env.aliases ++ [{alias_name, module.name}]),
         requires: Enum.uniq(env.requires ++ [module.name]) }
    else
      env
    end
  end

  def get_module_name(env, module_name) do
    module_name = ElixirScript.Translator.State.get_module_name(module_name)

    if Keyword.has_key?(env.aliases, module_name) do
      Keyword.fetch!(env.aliases, module_name)
    else
      module_name
    end

  end

  defp check_for_module_existence(env, module_name) do
    if ElixirScript.Translator.State.is_module_loaded?(module_name) == false and has_module?(env, module_name) == false do
      raise "Module #{inspect module_name} not found"
    end
  end


  defp add_import_macro(elixirscript_env, module, opts) do
    eval = """
    import #{inspect module}, #{inspect opts}
    __ENV__
    """

    do_macro(eval, elixirscript_env)
  end

  defp add_require_macro(elixirscript_env, module, opts) do
    eval = """
    require #{inspect module}, #{inspect opts}
    __ENV__
    """

    do_macro(eval, elixirscript_env)
  end

  defp do_macro(eval, elixirscript_env) do
    {env, _} = Code.eval_string(eval, [], elixirscript_env.env)
    %{ elixirscript_env | env: env }
  end
end
