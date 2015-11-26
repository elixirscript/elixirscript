defmodule ElixirScript.Html do

  @external_resource tags_path = Path.join([__DIR__, "tags.txt"])
  @tags (for line <- File.stream!(tags_path, [], :line) do
    line |> String.strip |> String.to_atom
  end)

  for tag <- @tags do
    defmacro unquote(tag)(config \\ [], block \\ [do: nil]) do
      tag = Atom.to_string(unquote(tag))

      inner = case Keyword.get(block, :do) do
        {:__block__, [], params} ->
          params
        nil ->
          []
        x ->
          [x]
      end

      config = config_to_map(config)

      quote do
         Elixir.VirtualDOM.h(unquote(tag), unquote(config), unquote_splicing(inner))
      end
    end
  end

  defp config_to_map(config) do
    config = Enum.map(config, fn({key, value}) ->
    if is_atom(key) do
      {Atom.to_string(key), value}
    else
      {key, value}
    end
    end)

    {:%{}, [], config}
  end

  defmacro create(element) do
    quote do
       Elixir.VirtualDOM.create(unquote(element))
    end
  end

  defmacro diff(tree, newTree) do
    quote do
       Elixir.VirtualDOM.diff(unquote(tree), unquote(newTree))
    end
  end

  defmacro patch(root, patches) do
    quote do
       Elixir.VirtualDOM.patch(unquote(root), unquote(patches))
    end
  end

end
