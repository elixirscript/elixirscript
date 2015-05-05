defmodule ElixirScript.ParseError do
  defexception [:message]

  def exception(value) do
    msg = "Currently unsupported #{inspect value}"
    %ElixirScript.ParseError{message: msg}
  end
end