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
  def start(dom_root, render_func, args) do
    pid = Elixir.Core.global().processes.spawn()

    tree = render_func.apply(nil, args);
    rootNode = Elixir.VirtualDOM.create(tree);

    dom_root.appendChild(rootNode);

    Elixir.Core.global().processes.put(pid, "state", { rootNode, tree, render_func });
    { :ok, pid }
  end

  def start(dom_root, render_func, args, options) do
    pid = Elixir.Core.global().processes.spawn()

    if Elixir.Keyword.has_key?(options, :name) do
      pid = Elixir.Core.global().processes.register(Elixir.Keyword.get(options, :name), pid)
    end

    tree = render_func.apply(nil, args);
    rootNode = Elixir.VirtualDOM.create(tree);

    dom_root.appendChild(rootNode);

    Elixir.Core.global().processes.put(pid, "state", { rootNode, tree, render_func })
    { :ok, pid }
  end

  @doc """
  Stops the View state
  """
  def stop(view) do
    Elixir.Core.global().processes.exit(view)
    :ok
  end

  @doc """
  Updates the view by passing the args to the render_func
  """
  def render(view, args) do
    { rootNode, tree, render_func } = Elixir.Core.global().processes.get(view, "state")

    newTree = render_func.apply(nil, args);

    patches = Elixir.VirtualDOM.diff(tree, newTree)
    rootNode = Elixir.VirtualDOM.patch(rootNode, patches)

    Elixir.Core.global().processes.put(view, "state", { rootNode, newTree, render_func });

    :ok
  end

end
