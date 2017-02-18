defmodule ElixirScript.Module do
  @moduledoc false

  defstruct name: nil,
  functions: Keyword.new, private_functions: Keyword.new,
  body: nil, js_imports: [], module_refs: [], type: :module,
  impls: Map.new, impl_type: nil, app_name: nil

end
