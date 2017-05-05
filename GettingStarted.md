# Getting Started with ElixirScript

The intent of this guide is to get you started with ElixirScript. It will give you instructions on using ElixirScript. I will go over the two ways you can use Elixirscript:

*   As a CLI
*   As a mix dependency

### CLI

**macOS**: Elixirscript is available via homebrew `brew install elixirscript`. For everyone else, please read below

Step 1: Get CLI

You can download the elixirscript CLI from the [releases page on github](https://github.com/bryanjos/elixirscript/releases). It is a tar file named elixirscript.tar.gz.

Step 2: Untar

Next, untar elixirscript.tar.gz

    tar -xvzf elixirscript.tar.gz

You will want to put the bin folder from the uncompressed folder into your path. This should allow you to use the elixirscript CLI.

Step 3: Use

This is the help output of elixirscript

    usage: elixirscript <input> [options]
     <input> path to elixir files or
     the elixir code string if passed the -e flag
     options:
    --js-module [<identifer>:<path>] A js module used in your code. ex: React:react
                            Multiple can be defined
     -f --format [format]   module format of output. options: es (default), common, umd
     -o  --output [path]    places output at the given path.
                            Can be a directory or filename.
     -e --elixir read input as elixir code string
     --full-build informs the compiler to do a full build instead of an incremental one
     -v --version the current version number
     -h --help this message

the `<input>` is the elixir code string or file path you want to convert from elixir to javascript. Below is an example of using a code string and turning it into JavaScript

    $ elixirscript ":atom" -e

elixirscript also takes a path to your `.ex` files as well:

    $ elixirscript "src" -o "dist"

If you look in the dist folder you'll see a file called `Elixir.App.js`

To start your application import the bundle according to whichever module format was selected and
then call start giving it the module and the initial args.

Ex. If you have a module like so
```elixir
defmodule Example do
    start(type, args) do
        :console.log("Hello, world")
    end
end
```

You would start it like so

```javascript
//ES module example
import Elixir from './Elixir.App'
Elixir.start(Elixir.Example, [])
```

### Mix dependency

Adding Elixirscript to your mix project gives you the ability to add it to your list of mix compilers. This means when you `mix compile`, Elixirscript will compile your code as well.

Add dependency to your deps in mix.exs:

``` elixir
{:elixir_script, "~> 0.26"}
```

Elixirscript uses default input, output and module formats if options are not given. If you wish to change any or all options, add an `elixir_script` key to your project configuration.
    
``` elixir
    def project do
    [
     app: :my_app,
     version: "0.1.0",
     elixir: "~> 1.0",
     deps: deps,
     elixir_script: [
        input: "lib/elixirscript",
        output: "priv/elixirscript/Elixir.App.js",
        format: :es,
        js_modules: [
          {React, "react"},
          {ReactDOM, "react-dom"},
          {Phoenix, "phoenix", default: false}
        ]
     ],
     compilers: [:elixir_script] ++ Mix.compilers
    ]
    end
```

Available options are:

*   `input`: The folder to look for Elixirscript files in. (defaults to `lib/elixirscript`)

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

Elixirscript supports public macros. Private macros are currently unsupported.

### JavaScript Interop

Check out the [JavaScript Interoperability](JavaScriptInterop.html) documentation

#### Frontend Project Boilerplate

There is an [elixirscript frontend boilerplate project](https://github.com/elixirscript/elixirscript-project-boilerplate). This setup uses gulp and webpack to build and bundle assets.

#### elixirscript-brunch

There is an Brunch plugin, [elixirscript-brunch](https://www.npmjs.com/package/elixirscript-brunch).

#### elixirscript-loader

There is also a webpack loader, [elixirscript-loader](https://www.npmjs.com/package/elixirscript-loader).
