defmodule ElixirScript.View do
  @moduledoc """
  Defines a module to handle view state. Handles the diffing and patching
  normally done manually using the `VDom` module.

      def render(id) do
        Html.div [id: "hello"] do
          Html.span do
            "Hello"
          end
        end
      end

      #Starts View state and renders initial view
      {:ok, view} = View.start(:document.body, &render/1, ["hello"])

      #Updates the view with the new args
      View.render(view, ["world"])
  """


  @doc """
  Starts the View state. This will render the initial view using the
  render_func and the args
  """
  defmacro start(dom_root, render_func, args, options \\ []) do
  end

  @doc """
  Stops the View state
  """
  defmacro stop(view) do
  end

  @doc """
  Updates the view by passing the args to the render_func
  """
  defmacro render(view, args) do
  end

end
