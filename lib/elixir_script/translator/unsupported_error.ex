defmodule ElixirScript.Translator.UnsupportedError do
  defexception [:message]

  def exception(value) do
    msg = "Currently unsupported #{inspect value}"
    %ElixirScript.Translator.UnsupportedError{message: msg}
  end
end
