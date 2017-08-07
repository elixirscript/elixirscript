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

  For our example, a JavaScript file must be placed in the `priv/elixir_script` folder.
  In our example, it could either be `priv/elixir_script/my_app/json.js` or
  `priv/elixir_script/my_app.json.js`. ElixirScript will look for either path

  It looks like this
  ```javascript
  export default {
    stringify: JSON.stringify,
    parse: JSON.parse
  }
  ```

  `ElixirScript.FFI` takes the following options
  * `global`: If the module is defined in the global state or not. If this is set to `true`,
  nothing is imported and instead ElixirScript will use the name of the module to call a module and
  function in the global scope.
  * `name`: Only applicable with `global` is set to `true`. This will use the name defined here
  instead of the module name for calling modules and functions in the global scope

  An example using the global option to reference the JSON module in browsers

  ```elixir
  defmodule JSON do
    use ElixirScript.FFI, global: true

    defexternal stringify(map)
    defexternal parse(string)
  end
  ```

  The calls above are translated to calls to the `JSON` module in the global scope

  An example using global and name options

  ```elixir
  defmodule Console do
    use ElixirScript.FFI, global: true, name: :console

    defexternal log(term)
  end
  ```

  With the above, calls in ElixirScript to `Console.log` will translate to `console.log` in JavaScript
  """

  defmacro __using__(opts) do
    quote do
      import ElixirScript.FFI
      Module.register_attribute __MODULE__, :__foreign_info__, persist: true
      @__foreign_info__ %{
        path: Macro.underscore(__MODULE__),
        name: unquote(Keyword.get(opts, :name, nil)),
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
      {:\\, meta0, [{name, meta, atom}, value]} ->
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
