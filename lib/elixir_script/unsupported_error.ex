defmodule ElixirScript.UnsupportedError do
  defexception [:message]

  def exception(value) do
    msg = "Currently unsupported #{inspect value}"
    %ElixirScript.UnsupportedError{message: msg}
  end
end