defmodule ElixirScript.Bitwise do

  defmacro bnot(expr) do
    quote do
      Elixir.Core.bnot(unquote(expr))
    end
  end

  defmacro ~~~(expr) do
    quote do
      Elixir.Core.bnot(unquote(expr))
    end
  end

  defmacro band(left, right) do
    quote do
      Elixir.Core.band(unquote(left), unquote(right))
    end
  end

  defmacro left &&& right do
    quote do
      Elixir.Core.band(unquote(left), unquote(right))
    end
  end

  defmacro bor(left, right) do
    quote do
      Elixir.Core.bor(unquote(left), unquote(right))
    end
  end

  defmacro left ||| right do
    quote do
      Elixir.Core.bor(unquote(left), unquote(right))
    end
  end

  defmacro bxor(left, right) do
    quote do
      Elixir.Core.bxor(unquote(left), unquote(right))
    end
  end

  defmacro left ^^^ right do
    quote do
      Elixir.Core.bxor(unquote(left), unquote(right))
    end
  end

  defmacro bsl(left, right) do
    quote do
      Elixir.Core.bsl(unquote(left), unquote(right))
    end
  end

  defmacro left <<< right do
    quote do
      Elixir.Core.bsl(unquote(left), unquote(right))
    end
  end

  defmacro bsr(left, right) do
    quote do
      Elixir.Core.bsr(unquote(left), unquote(right))
    end
  end

  defmacro left >>> right do
    quote do
      Elixir.Core.bsr(unquote(left), unquote(right))
    end
  end
end
