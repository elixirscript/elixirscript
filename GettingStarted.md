# Getting Started with ElixirScript

The intent of this guide is to get you started with ElixirScript. It will give you instructions on using ElixirScript.

Adding Elixirscript to your mix project gives you the ability to add it to your list of mix compilers. This means when you `mix compile`, Elixirscript will compile your code as well.

Add dependency to your deps in mix.exs:

``` elixir
{:elixir_script, "~> 0.30"}
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
        output: "priv/elixir_script/build/Elixir.App.js"
     ],
     compilers: Mix.compilers ++ [:elixir_script]
    ]
    end
```

Available options are:

* `input`: The entry module(s) for your application or library

* `output`: The path of the generated JavaScript file. (defaults to `priv/elixir_script/build`)

    If path ends in `.js` then that will be the name of the file. If a directory is given,
    file will be named `Elixir.App.js`


Now run `mix compile` and you should see a JavaScript file named `Elixir.App.js` in the `priv/elixir_script/build/` directory. ElixirScript outputs JavaScript in the ES Module format. If your browser supports it, you can include the output in a script tag with the type "module"

```html
<script type="module">
  import Elixir from './Elixir.App.js'
  const myInitialArgs = []

  Elixir.start(Elixir.MyEntryModule, myInitialArgs)
</script>
```

If your browser does not yet support ES modules directly, use a tool such as [webpack](https://webpack.js.org/) or [brunch](http://brunch.io/) to convert it into something that can be used in the browser

### Macros

Elixirscript supports all macros

### JavaScript Interop

Check out the [JavaScript Interoperability](JavascriptInterop.html) documentation
