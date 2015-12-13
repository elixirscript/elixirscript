defmodule ElixirScript.Env do
  @moduledoc false

  defstruct env: __ENV__, modules: Map.new, root: ""

end
