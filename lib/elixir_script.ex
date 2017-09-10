defmodule ElixirScript do
  @moduledoc """

  ElixirScript acts as a mix compiler. This means that when you execute `mix compile`,
  ElixirScript's compiler will run as well. Make sure to add ElixirScript to your
  list of compilers in mix.exs.

  ElixirScript must be told which modules to use as the entry to your ElixirScript application.
  This is done by adding an `elixir_script` key to your project configuration whose value is a keyword list of options.
  Add an `input` key and make the value either the name of a module or a list of modules
  that are the entry modules you wish to compile to JavaScript. ElixirScript will use
  those modules to find what other modules and functions it needs to convert to JavaScript.
  ElixirScript by default places output in `priv/elixir_script/build`. If you wish to change this,
  add an `output` key to your ElixirScript configuration.

  An example configuration for a project is shown below

  ``` elixir
      def project do
      [
      app: :my_app,
      version: "0.1.0",
      elixir: "~> 1.0",
      deps: deps,
      # Add elixir_script as a compilter
      compilers: Mix.compilers ++ [:elixir_script],
      # Our elixir_script configuration
      elixir_script: [
          # Entry module. Can also be a list of modules
          input: MyEntryModule,
          # Output path. Either a path to a js file or a directory
          output: "priv/elixir_script/build/elixirscript.build.js"
      ]
      ]
      end
  ```

  Available options are:

  * `input` (required): The entry module(s) for your application or library

  * `output`: The path of the generated JavaScript file. (defaults to `priv/elixir_script/build`)

      If path ends in `.js` then that will be the name of the file. If a directory is given,
      file will be named `elixirscript.build.js`

  * `root`: Optional root for imports of FFI JavaScript modules. Defaults to `.`. If using output directly in a browser, you may want to make it something like `/js` or some uri.

  Now run `mix compile` and you should see a JavaScript file named `elixirscript.build.js` in the `priv/elixir_script/build/` directory. ElixirScript outputs JavaScript in the ES Module format. If your browser supports it, you can include the output in a script tag with the type "module"

  ```html
  <script type="module">
    import Elixir from '/js/elixirscript.build.js'
    const myInitialArgs = []

    Elixir.start(Elixir.MyEntryModule, myInitialArgs)
  </script>
  ```

  If your browser does not yet support ES modules directly, use a tool such as [webpack](https://webpack.js.org/) or [brunch](http://brunch.io/) to convert it into something that can be used in the browser

  ### JavaScript Interop

  Check out the [JavaScript Interoperability](JavascriptInterop.html) documentation

  ### Dependencies

  ElixirScript can use many of the same Hex packages and dependencies that currently exist.
  It is also possible to make packages that are specific to ElixirScript. If you decide to
  make such a package, please prepend `elixir_script` to the app name. For instance is making
  a package for ElixirScript with FFI modules for interacting with React, the name would be
  `elixir_script_react`. This is to make sure that other developers know that a package in Hex
  is specifically for use with ElixirScript.

  ### Limitations

  ElixirScript does not support `receive` or any of OTP at this time.
  """
end
