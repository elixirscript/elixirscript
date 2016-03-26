defmodule ElixirScript.Translator.Group do
  @moduledoc false

  # Represents a collection of JavaScript AST.
  # Contents in body are expanded within outer AST before JS code generation

  @type t :: %ElixirScript.Translator.Group{
    type: binary,
    body: [ESTree.Statement.t]
  }
  defstruct type: "Group", body: []
end
