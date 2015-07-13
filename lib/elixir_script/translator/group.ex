defmodule ElixirScript.Translator.Group do
  @moduledoc false

  @type t :: %ElixirScript.Translator.Group{ 
    type: binary, 
    body: [ESTree.Statement.t] 
  }
  defstruct type: "Group", body: []
end 