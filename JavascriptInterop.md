# JavaScript Interoperability

## ElixirScript Calling JavaScript

### JS module

The `JS` module has functions and macros that help with interacting with JavaScript.
These mostly correspond to JavaScript keywords that may be useful.

```elixir
# Calling the JavaScript Debugger
JS.debugger()

# Getting the type of a value
JS.typeof(my_value)
```

### Foreign Function Interface

ElixirScript calls JavaScript modules through a Foreign Function Interface (FFI). A foreign module is defined by creating a new module and adding `use ElixirScript.FFI` to it.

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

## JavaScript Calling ElixirScript

  In order to start an ElixirScript application, you must first import it using whichever JavaScript module system you are using and then call `Elixir.start`

  ```Elixir
  # Our ElixirScript module

  defmodule Main do
    def start(:normal, args) do
      JS.console.log(args)
    end
  end

  ```

  ```javascript
  //ES module example
  import Elixir from './Elixir.App'
  Elixir.start(Elixir.Main, [1, 2, 3])
  ```

  In the above example, we have an ElixirScript module, `Main` with a `start/2` function. This function is the entry point into your ElixirScript application. when we call `Elixir.start`, we give it this module's name (All modules when compiled begin with `Elixir.`) and a list of the initial args.


  If you want to use an ElixirScript module inside of your JavaScript code, you can do so using `Elixir.load`.

  ```Elixir
  # Our ElixirScript module

  defmodule MyModule do
    def hi() do
      JS.alert("hello")
    end
  end
  ```


  ```javascript
  const MyModule = Elixir.load(Elixir.MyModule);
  MyModule.hi()
  ```