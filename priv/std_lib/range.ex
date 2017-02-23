defmodule ElixirScript.Range do
  @moduledoc false  
  defstruct first: nil, last: nil

  def new(first, last) do
    %ElixirScript.Range{first: first, last: last}
  end

  def range?(%ElixirScript.Range{}), do: true
  def range?(_), do: false

end
