defmodule ElixirScript.Output.JSModule do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J

  def compile(body, opts, js_modules) do
    imports = opts.module_formatter.build_imports(js_modules)
    exports = opts.module_formatter.build_export(J.identifier("Elixir"))

    [imports] ++ body ++ [exports]
  end

end
