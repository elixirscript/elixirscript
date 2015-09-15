defmodule ElixirScript.Env do
  defstruct env: __ENV__, modules: HashSet.new 
end