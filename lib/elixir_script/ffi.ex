defmodule ElixirScript.FFI do
  @moduledoc """
  The foreign function interface for interoperability with JavaScript.

  Define foreign modules with `use ElixirScript.FFI`.
  Next to define functions for the foreign module, use the `foreign` macro.

  Here is an example of a foreign module for a JSON module

  ```elixir
  defmodule MyApp.JSON do
    use ElixirScript.FFI

    foreign stringify(map)
    foreign parse(string)
  end
  ```

  Foreign modules must have an equivalent JavaScript module.
  ElixirScript expects JavaScript modules to be in the `priv/elixir_script` directory.
  These modules will be copied to the output directory upon compilation.

  In the example, a JavaScript file must be at `priv/elixir_script/my_app/json.js`.
  It looks like this
  ```javascript
  export default {
    stringify: JSON.stringify,
    parse: JSON.parse
  }
  ```

  The JavaScript module must export a default object with the foreign functions defined in the Elixir module
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