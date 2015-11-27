defmodule ElixirScript.VDom do
  @moduledoc """
    This defines macros for updating a virual dom tree based on patches.
    This module is used in tandem with the Html module

      tree = Html.div [id: "hello"] do
              Html.span do
                "Hello"
              end
            end

      rootNode = VDom.create(tree)
      :document.getElementById("main").appendChild(rootNode)

      newTree = Html.div [id: "world"]


      patches = VDom.diff(tree, newTree)
      rootNode = VDom.patch(rootNode, patches)

  """


  @doc """
  Creates a node from the virtual dom tree passed in.
  This node is used to append to a real DOM element

      tree = Html.div [id: "hello"] do
              Html.span do
                "Hello"
              end
            end

      rootNode = VDom.create(tree)
      :document.getElementById("main").appendChild(rootNode)
  """
  defmacro create(element) do
    quote do
       Elixir.VirtualDOM.create(unquote(element))
    end
  end


  @doc """
  Takes two nodes and returns a list of differences between the two
  This node is used to append to a real DOM element

      tree = Html.div [id: "hello"]

      newTree = Html.div [id: "world"]

      patches = VDom.diff(tree, newTree)
  """
  defmacro diff(tree, newTree) do
    quote do
       Elixir.VirtualDOM.diff(unquote(tree), unquote(newTree))
    end
  end


  @doc """
  Returns a new node based on the node passed in with the passed in patches applied

      tree = Html.div [id: "hello"]

      rootNode = VDom.create(tree)
      :document.getElementById("main").appendChild(rootNode)

      newTree = Html.div [id: "world"]


      patches = VDom.diff(tree, newTree)
      rootNode = VDom.patch(rootNode, patches)
  """
  defmacro patch(root, patches) do
    quote do
       Elixir.VirtualDOM.patch(unquote(root), unquote(patches))
    end
  end
end
