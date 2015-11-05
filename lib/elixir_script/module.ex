defmodule ElixirScript.Module do
  @moduledoc false

  defstruct name: nil, functions: [], macros: HashSet.new(), body: nil
end
