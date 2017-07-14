defmodule ElixirScript.FFI do
  @moduledoc """
  The foreign function interface for interoperability with JavaScript.
  """

  defmacro __using__(opts) do
    quote do
      import ElixirScript.FFI
      Module.register_attribute __MODULE__, :__foreign_info__, persist: true
      @__foreign_info__ %{
        path: Macro.underscore(__MODULE__),
        name: Enum.join(Module.split(__MODULE__), "_"),
        global: unquote(Keyword.get(opts, :global, false))
      }
    end
  end

  defmacro foreign({name, _, args}) do
    quote do
      def unquote(name)(unquote_splicing(args)), do: nil
    end
  end
end