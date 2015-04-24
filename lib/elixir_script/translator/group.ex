defmodule ElixirScript.Translator.Group do
  @moduledoc """
  Holds statements that are meant to be added into the tree.
  """

  @type t :: %ElixirScript.Translator.Group{ 
    type: binary, 
    body: [ESTree.Statement.t] 
  }
  defstruct type: "Group", body: []
end 