defmodule ElixirScript.FFI do
  @moduledoc """
  The foreign function interface for interacting with JavaScript

  To define a foreign module, make a new module and add `use ElixirScript.FFI`. to it
  To define external functions, use the `defexternal` macro.

  Here is an example of a foreign module for a JSON module

  ```elixir
  defmodule MyApp.JSON do
    use ElixirScript.FFI

    defexternal stringify(map)
    defexternal parse(string)
  end
  ```

  Foreign modules map to JavaScript files that export functions defined with the `defexternal` macro.
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

  To define an external function, pass the name and arguments to `defexternal`

  ```elixir
  defexternal my_js_function(arg1, arg2, arg3)
  ```
  """
  defmacro defexternal({name, _, args}) do
    args = Enum.map(args, fn
      {:\\, meta0, [{name, meta, atom}, value]}->
        name = String.to_atom("_" <> Atom.to_string(name))
        {:\\, meta0, [{name, meta, atom}, value]}

      {name, meta, atom} ->
        name = String.to_atom("_" <> Atom.to_string(name))
        {name, meta, atom}

      other ->
        other
    end)

    quote do
      def unquote(name)(unquote_splicing(args)), do: nil
    end
  end
end
