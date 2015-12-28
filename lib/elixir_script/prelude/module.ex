defmodule ElixirScript.Module do
  @moduledoc false

  defstruct name: nil,
  functions: Keyword.new, private_functions: Keyword.new,
  macros: Keyword.new, private_macros: Keyword.new,
  body: nil, js_imports: [], module_refs: [], type: :module,
  spec: nil, impls: HashDict.new

end
