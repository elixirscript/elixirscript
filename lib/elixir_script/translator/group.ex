defmodule ElixirScript.Translator.Group do
  @moduledoc """
  Holds statements that are meant to be added into the tree.
  When a Group is encountered, the contents of the body
  are injected into the group's container. 
  """

  @type t :: %ElixirScript.Translator.Group{ 
    type: binary, 
    body: [ESTree.Statement.t] 
  }
  defstruct type: "Group", body: []
end 