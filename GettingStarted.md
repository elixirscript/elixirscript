# Getting Started with ElixirScript

The intent of this guide is to get you started with ElixirScript. It will give you instructions on using ElixirScript.

Adding Elixirscript to your mix project gives you the ability to add it to your list of mix compilers. This means when you `mix compile`, Elixirscript will compile your code as well.

Add dependency to your deps in mix.exs:

``` elixir
{:elixir_script, "~> 0.29"}
```

Elixirscript uses default output and module formats if options are not given. If you wish to change any or all options, add an `elixir_script` key to your project configuration.
    
``` elixir
    def project do
    [
     app: :my_app,
     version: "0.1.0",
     elixir: "~> 1.0",
     deps: deps,
     elixir_script: [
        input: MyEntryModule,
        output: "priv/elixirscript/Elixir.App.js",
        format: :es,
        js_modules: [
          {React, "react"},
          {ReactDOM, "react-dom"},
          {Phoenix, "phoenix", default: false}
        ]
     ],
     compilers: Mix.compilers ++ [:elixir_script]
    ]
    end
```

Available options are:

* `input`: The entry module(s) for your application or library

* `output`: The path of the generated JavaScript file. (defaults to `priv/elixirscript`)

    If path ends in `.js` then that will be the name of the file. If a directory is given,
    file will be named `Elixir.App.js`

*   `format`: The module format of generated JavaScript code. (defaults to `:es`). Choices are:    

    *   `:es` - ES Modules

    *   `:common` - CommonJS

    *   `:umd` - UMD

* `js_modules`: A list of JavaScript imports to add. Each item must be 2-tuple or a 3-tuple. The third element is an optional keyword list of options:

    * `default` - Defaults to true. Set to false if the imported module has no default export.

### Macros

Elixirscript supports all macros

### JavaScript Interop

Check out the [JavaScript Interoperability](JavascriptInterop.html) documentation
