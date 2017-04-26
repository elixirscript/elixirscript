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

# Creating a new JavaScript Map
map = JS.new(JS.Map, [])
```

### Accessing Global Objects, Functions, and Properties

In order to interact with JavaScript things in the global scope, append "JS" to them. The global scope corresponds to whatever the global object is in the JavaScript environment you are in. For example, in a browser this would be `window` or `self`:

```elixir
# Calling alert
JS.alert("hello")

# Calling a method on Object
JS.Object.keys(my_object)

# Creating a new JavaScript Date
JS.new(JS.Date, [])

# Getting the outer width
JS.outerWidth
```

### JavaScript modules

ElixirScript can use JavaScript modules from the supported modules systems. 
In order to do so, you must tell ElixirScript about them upfront.

If using ElixirScript in a mix project, you can do so inside of the ElixirScript configuration keyword list

```elixir
  def project do
    [
      app: :my_project,
      elixir_script: [
        format: :es,
        js_modules: [
          {React, "react"},
          {ReactDOM, "react-dom"}
        ]
      ]
    ]
  end
```

Or if using the CLI, you can do so by passing each module via the `js-module` flag

```
elixirscript "app/elixirscript" -o dist --js-module React:react --js-module ReactDOM:react-dom
```

Interacting with these modules works the same as interacting with an ElixirScript module

```elixir
React.createElement(...)
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