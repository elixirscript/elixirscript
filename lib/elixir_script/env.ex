defmodule ElixirScript.Env do
  @moduledoc false

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
    caller: nil
  ]


  def module_env(module, filename) do
    %ElixirScript.Env{ module: module, file: filename }
  end

  def function_env(env, { _, _ } = func) do
    %{ env |  function: func, caller: env }
  end

  def function_env(env, nil) do
    %{ env |  function: nil, caller: env, vars: [] }
  end

  def add_var(env, variable_name) do
    %{ env |  vars: Keyword.update!(env.vars, variable_name, 0, &(&1 + 1)) }
  end

  def add_alias(env, module_name, alias_name) do
    %{ env |  aliases: env.aliases ++ [{alias_name, module_name}] }
  end

  def add_import(env, module_name, functions, macros) do
    %{ env |  functions: env.functions ++ [{module_name, functions}],
              macros: env.macros ++ [{module_name, macros}] }
  end

  def add_require(env, module_name) do
    %{ env |  requires: env.requires ++ [module_name] }
  end

end
