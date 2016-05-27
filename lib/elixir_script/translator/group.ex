defmodule ElixirScript.Translator.Group do
  @moduledoc false

  # Represents a collection of JavaScript AST.
  # Contents in body are expanded within outer AST before JS code generation

  @type t :: %ElixirScript.Translator.Group{
    type: binary,
    body: [ESTree.Statement.t]
  }
  defstruct type: "Group", body: []

  def inflate_groups(body) do
    Enum.map(body, fn(x) ->
      case x do
        %ElixirScript.Translator.Empty{} ->
          []
        %ElixirScript.Translator.Group{body: group_body} ->
          group_body
        %ESTree.BlockStatement{} ->
          %ESTree.BlockStatement{ body: inflate_groups(x.body) }
        %ESTree.IfStatement{} ->
          %{x | consequent: inflate_groups(x.consequent), alternate: inflate_groups(x.alternate) }
        _ ->
          x
      end
    end)
    |> List.flatten
  end
end
