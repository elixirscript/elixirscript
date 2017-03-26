defmodule ElixirScript.Bitwise do
  @moduledoc false
  defmacro bnot(expr) do
    quote do
      JS.__bnot__(unquote(expr))
    end
  end

  defmacro ~~~(expr) do
    quote do
      JS.__bnot__(unquote(expr))
    end
  end

  defmacro band(left, right) do
    quote do
      JS.__band__(unquote(left), unquote(right))
    end
  end

  defmacro left &&& right do
    quote do
      JS.__band__(unquote(left), unquote(right))
    end
  end

  defmacro bor(left, right) do
    quote do
      JS.__bor__(unquote(left), unquote(right))
    end
  end

  defmacro left ||| right do
    quote do
      JS.__bor__(unquote(left), unquote(right))
    end
  end

  defmacro bxor(left, right) do
    quote do
      JS.__bxor__(unquote(left), unquote(right))
    end
  end

  defmacro left ^^^ right do
    quote do
      JS.__bxor__(unquote(left), unquote(right))
    end
  end

  defmacro bsl(left, right) do
    quote do
      JS.__bsl__(unquote(left), unquote(right))
    end
  end

  defmacro left <<< right do
    quote do
      JS.__bsl__(unquote(left), unquote(right))
    end
  end

  defmacro bsr(left, right) do
    quote do
      JS.__bsr__(unquote(left), unquote(right))
    end
  end

  defmacro left >>> right do
    quote do
      JS.__bsr__(unquote(left), unquote(right))
    end
  end
end
