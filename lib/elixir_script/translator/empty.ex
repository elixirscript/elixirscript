defmodule ElixirScript.Translator.Empty do
  @moduledoc false

  # Represents no translation to JS AST

  @type t :: %ElixirScript.Translator.Empty{}
  defstruct type: "Empty"
end
