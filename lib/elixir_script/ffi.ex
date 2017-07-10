defmodule ElixirScript.FFI do
  defmacro __using__(opts) do
    quote do
      import ElixirScript.FFI
      Module.register_attribute __MODULE__, :__foreign_info__, persist: true
      @__foreign_info__ %{path: unquote(Keyword.get(opts, :path, nil))}
    end
  end

  defmacro foreign({name, _, args}) do
    quote do
      def unquote(name)(unquote_splicing(args)), do: nil
    end
  end
end