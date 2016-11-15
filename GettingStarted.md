# Getting Started with ElixirScript


The intent of this guide is to get you started with ElixirScript. It will give you instructions on using ElixirScript. I will go over the three ways you can use ElixirScript:

* As an escript
* As a mix task
* As a library in your application

### Escript

**macOS**: Elixirscript can be installed via homebrew `brew install elixirscript`. For everyone else, plase read below

* Step 1: Get escript

    You can download the elixirscript escript from the [releases page on github](https://github.com/bryanjos/elixirscript/releases). It is a tar file named elixirscript.tar.gz.

* Step 2: Untar

    Next, untar elixirscript.tar.gz

    ```bash
    tar -xvzf elixirscript.tar.gz
    ```

    You will want to put the bin folder from the uncompressed folder into your path. This should allow you to use the elixirscript escript.

* Step 3: Use

    This is the help output of elixirscript

    ```bash
    usage: elixirscript <input> [options]
    <input> path to elixir files or the elixir code string if the -ex flag is used

    options:
    -o  --output [path]   places output at the given path
    -ex --elixir          read input as elixir code string
    --std-lib [path]      outputs the elixirscript standard library JavaScript files to the specified path
    --full-build          informs the compiler to do a full build instead of an incremental one
    only used when output is specified
    --core-path    es6 import path to the elixirscript standard lib
    only used with the [output] option. When used, Elixir.js is not exported
    -v  --version         the current version number
    -h  --help            this message
    ```

    the `<input>` is the elixir code string or file path you want to convert from elixir to javascript. Below is an example of using a code string and turning it into JavaScript

    ```bash
    $ elixirscript ":atom" -ex
    Symbol.for('atom')
    ```

    The elixirscript escript changed the elixir code, `:atom` into the JavaScript code `Symbol.for('atom')`. The `-ex` parameter lets the script know that the input is an Elixir code string instead of a file.

    elixirscript also takes a path to your `.ex` and `.exjs` files as well:

    ```bash
    $ elixirscript "src" -o "dist"
    ```

    If you look in the dist folder, you should see 2 folders. One, `app`, contains your code and the other, `elixir` contains the elixirscript standard library files.

### mix elixirscript

* Step 1: Get dependency

    The first step is getting the dependency. In your mix.exs file for your elixir project, add elixir_script to your deps.

    ```elixir
    {:elixir_script, "~> 0.23"}
    ```

* Step 2: Now download the dep

    ```bash
    $ mix deps.get
    ```

    Now you should have the mix task, elixirscript.

* Step 3: Use
    ```bash
    $ mix elixirscript "src" -o "dist"
    ```

    What you will notice is that the parameters are exactly the same as the escript.

### ElixirScript module
* Step 1: Get dependency

    The first step is getting the dependency. In your mix.exs file for your elixir project, add elixir_script to your deps.

    ```elixir
    {:elixir_script, "~> 0.23"}
    ```

* Step 2: Now download the dep

    ```bash
    $ mix deps.get
    ```

* Step 3: Use
    Now you will be able to use the ElixirScript module within your code.

    ```elixir
    ElixirScript.compile(":atom")
    ```

    The is also compile_path/2 and compile_quoted/2. Each of the functions take an options keyword list.


### Macros
Macros can be used in Elixirscript just like in Elixir. The only exception is that `defmacrop` is unsupported


#### JavaScript Interop

Elixirscript has a couple of ways of interacting with JavaScript.

#### Globally scoped functions

To call functions in JavaScript in the global scope, such as those defined on `window`, use the erlang module syntax

```elixir
# Calling alert
:window.alert("hi")

# console
:console.log("hello")

# document
:document.getElementById("main")
```

#### Globally scoped modules

To call globally scoped modules defined in JavaScript, you can call them just like you would an Elixir module

```elixir
Date.now()
```

Only works if module begins with a captial letter

#### Importing ES Modules

To import ES modules, first you must require the `JS` module. Then import the module using `JS.import`

```elixir
defmodule MyModule do
    require JS
    JS.import React, "react"

    def func() do
        React.render(my_component)
    end
end

```

#### The JS module

The JS module has a number of other functions and macros. For more information, check out the docs.

#### Frontend Project Boilerplate

There is an [elixirscript frontend boilerplate project](https://github.com/bryanjos/elixirscript-project-boilerplate). This setup uses gulp and webpack to build and bundle assets.


#### ElixirScript-Brunch

There is an Brunch plugin, [ElixirScript-Brunch](https://www.npmjs.com/package/elixirscript-brunch).
There are instructions there on how to use it with Phoenix.
