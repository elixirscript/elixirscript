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
     the elixir code string if passed the -ex flag
     options:
     -f --format [format] module format of output. options: es (default), common, umd
     -o --output [path] places output at the given path
     -ex --elixir read input as elixir code string
     --full-build informs the compiler to do a full build instead of an incremental one
     --core-path import path to the elixirscript standard lib
     only used with the [output] option. When used, Elixir.js is not exported
     -v --version the current version number
     -h --help this message

the `<input>` is the elixir code string or file path you want to convert from elixir to javascript. Below is an example of using a code string and turning it into JavaScript

    $ elixirscript ":atom" -ex
     Symbol.for('atom')

It changed the elixir code, `:atom` into the JavaScript code `Symbol.for('atom')`. The `-ex` parameter lets the script know that the input is an Elixir code string instead of a file.

elixirscript also takes a path to your `.ex` files as well:

    $ elixirscript "src" -o "dist"

If you look in the dist folder, you should see 2 folders. `app` contains your code and `elixir` contains the elixirscript standard library files.

### Mix dependency

Adding Elixirscript to your mix project gives you the ability to add it to your list of mix compilers. This means when you `mix compile`, Elixirscript will compile your code as well.

Add dependency to your deps in mix.exs:

    ```elixir
    {:elixir_script, "~> 0.25"}
    ```

    Elixirscript uses default input, output and module formats if options are not given. If you wish to change any or all options, add an `elixir_script` key to your project configuration.

    def project do
    [
     app: :my_app,
     version: "0.1.0",
     elixir: "~> 1.0",
     deps: deps,
     elixir_script: [ input: "lib/elixirscript", output: "priv/elixirscript", format: :es],
     compilers: [:elixir_script] ++ Mix.compilers
    ]
    end

Available options are:

*   `input`: The folder to look for Elixirscript files in. (defaults to `lib/elixirscript`)

*   `output`: The folder to place generated JavaScript code in. (defaults to `priv/elixirscript`)

*   `format`: The module format of generated JavaScript code. (defaults to `:es`). Choices are:    

    *   `:es` - ES Modules

    *   `:common` - CommonJS

    *   `:umd` - UMD

### Macros

Elixirscript supports public macros. Private macros are currently unsupported.

### JavaScript Interop

Elixirscript has a couple of ways of interacting with JavaScript.

#### Globally scoped functions

Use the erlang module syntax, to call JavaScript functions in the global scope.

    # Calling alert
    :window.alert("hi")

    # console
    :console.log("hello")

    # document
    :document.getElementById("main")

#### Globally scoped modules

You can call globally scoped modules you would an Elixir module

    Date.now()

Only works if module begins with a captial letter

#### Importing Modules

To import modules, first you must `require` the `JS` module. Then import the module using `JS.import`

    defmodule MyModule do
     require JS
     JS.import React, "react"

     def func() do
       React.render(my_component)
     end
    end

#### The JS module

The JS module has many other functions and macros. For more information, check out the docs.

#### Frontend Project Boilerplate

There is an [elixirscript frontend boilerplate project](https://github.com/bryanjos/elixirscript-project-boilerplate). This setup uses gulp and webpack to build and bundle assets.

#### ElixirScript-Brunch

There is an Brunch plugin, [ElixirScript-Brunch](https://www.npmjs.com/package/elixirscript-brunch). There are instructions there on how to use it with Phoenix.