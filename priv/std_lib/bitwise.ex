defmodule ElixirScript.Bitwise do
  @moduledoc false
  defmacro bnot(expr) do
    quote do
      Bootstrap.Core.bnot(unquote(expr))
    end
  end

  defmacro ~~~(expr) do
    quote do
      Bootstrap.Core.bnot(unquote(expr))
    end
  end

  defmacro band(left, right) do
    quote do
      Bootstrap.Core.band(unquote(left), unquote(right))
    end
  end

  defmacro left &&& right do
    quote do
      Bootstrap.Core.band(unquote(left), unquote(right))
    end
  end

  defmacro bor(left, right) do
    quote do
      Bootstrap.Core.bor(unquote(left), unquote(right))
    end
  end

  defmacro left ||| right do
    quote do
      Bootstrap.Core.bor(unquote(left), unquote(right))
    end
  end

  defmacro bxor(left, right) do
    quote do
      Bootstrap.Core.bxor(unquote(left), unquote(right))
    end
  end

  defmacro left ^^^ right do
    quote do
      Bootstrap.Core.bxor(unquote(left), unquote(right))
    end
  end

  defmacro bsl(left, right) do
    quote do
      Bootstrap.Core.bsl(unquote(left), unquote(right))
    end
  end

  defmacro left <<< right do
    quote do
      Bootstrap.Core.bsl(unquote(left), unquote(right))
    end
  end

  defmacro bsr(left, right) do
    quote do
      Bootstrap.Core.bsr(unquote(left), unquote(right))
    end
  end

  defmacro left >>> right do
    quote do
      Bootstrap.Core.bsr(unquote(left), unquote(right))
    end
  end
end
