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
    local: nil,
    caller: nil
  ]


  def module_env(module, filename) do
    %ElixirScript.Env{ module: module, file: filename }
  end

  def function_env({ _, _ } = func, env) do
    %{ env | function: func, caller: env }
  end

  def function_env(nil, env) do
    %{ env | function: nil, caller: env }
  end

end
