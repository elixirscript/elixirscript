defmodule ElixirScript.FFI do
  defmacro __using__(_) do
    js_path = Path.join([".", Macro.underscore(__MODULE__)])

    js_name = __MODULE__
    |> Module.split()
    |> Enum.join("_")

    quote do
      import ElixirScript.FFI
      Module.register_attribute __MODULE__, :__foreign_info__, persist: true
      @__foreign_info__ %{path: unquote(js_path), name: unquote(js_name)}
    end
  end

  defmacro foreign({name, _, args}) do
    quote do
      def unquote(name)(unquote_splicing(args)), do: nil
    end
  end
end