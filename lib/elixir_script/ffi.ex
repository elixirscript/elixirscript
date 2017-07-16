defmodule ElixirScript.FFI do
  @moduledoc """
  The foreign function interface for interacting with JavaScript

  To define a foreign module, make a new module and add `use ElixirScript.FFI`. to it
  To define foreign functions, use the `foreign` macro.

  Here is an example of a foreign module for a JSON module

  ```elixir
  defmodule MyApp.JSON do
    use ElixirScript.FFI

    foreign stringify(map)
    foreign parse(string)
  end
  ```

  Foreign modules map to JavaScript files that export functions defined with the `foreign` macro.
  ElixirScript expects JavaScript modules to be in the `priv/elixir_script` directory.
  These modules are copied to the output directory upon compilation.

  For our example, a JavaScript file must be placed at `priv/elixir_script/my_app/json.js`.

  It looks like this
  ```javascript
  export default {
    stringify: JSON.stringify,
    parse: JSON.parse
  }
  ```
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

  @doc """
  Defines a JavaScript function to be called from Elixir modules

  To define a foreign function, pass the name and arguments to `foreign`

  ```elixir
  foreign my_js_function(arg1, arg2, arg3)
  ```
  """
  defmacro foreign({name, _, args}) do
    quote do
      def unquote(name)(unquote_splicing(args)), do: nil
    end
  end
end