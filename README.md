## ElixirScript [![Documentation](https://img.shields.io/badge/docs-hexpm-blue.svg)](http://hexdocs.pm/elixir_script/) [![Build](https://travis-ci.org/bryanjos/elixirscript.svg?branch=master)](https://travis-ci.org/bryanjos/elixirscript)

The goal is to convert a subset (or full set) of Elixir code to JavaScript, providing the ability to write JavaScript in Elixir. This is done by taking the Elixir AST and converting it into JavaScript AST and then to JavaScript code. This is done using the [Elixir-ESTree](https://github.com/bryanjos/elixir-estree) library.

Requirements
===========
* Elixir
* Node or io.js (only for development)

Usage
========

ElixirScript can be used in the following ways:


* If using as part of a project, you can add the following to your deps

  ```elixir
    {:elixir_script, "~> 0.11"}
  ```

  From there you can either use the ElixirScript module directly or the mix command, `mix ex2js`

* CLI Client

    You can download the latest release from the [releases](https://github.com/bryanjos/elixirscript/releases) page and use the included `ex2js` escript.



Development
===========

Clone the repo

    git clone git@github.com:bryanjos/elixirscript.git

Get dependencies

    mix deps.get
    npm install

Compile

    mix compile

Test

    mix test


Usage
===

```
  usage: ex2js <input> [options]

  <input> path to elixir files or
          the elixir code string if the -ex flag is used

  options:
  -o  --output [path]   places output at the given path
  -ex --elixir          read input as elixir code string
  -r  --root [path]     root path for standard libs
  -h  --help            this message
```

A note on `-r`. The standard lib modules are included in the output as `elixir.js`. They are by default included by importing them like so

```javascript
import {...} from 'elixir'
```

Depending on your setup that may not work. With `-r` you can specify the root path that will be prepended to the default path.

Ex.
```bash
mix ex2js "my/elixir/dir/**/*.ex" -r "js" -o my/js/dir
```

Will make the standard lib imports look like so
```javascript
import {...} from 'js/elixir'
```


## Examples

 * Using the included mix command, converting a folder of elixir files to JavaScript
    ```bash
    mix ex2js "my/elixir/dir/**/*.ex" -o my/js/dir
    ```

 * Using the included mix command, if you want to give it some elixir code and output JavaScript in the terminal
    ```bash
    mix ex2js -ex "[1, 2, 3, 4]"
    ```

 * Using the included the ElixirScript module to turn Elixir code into JavaScript
    ```elixir
    iex(1)> ElixirScript.compile("[1, 2, 3, 4]")
    ["Erlang.list(1,2,3,4)"]
    ```

# Macros

Macros can only be used when using ElixirScript as a library if the Macros are loaded into the current environment or if you give it a custom environment with the `env` option

```elixir
#module with macro defined
defmodule Math do
  defmacro squared(x) do
    quote do
      unquote(x) * unquote(x)
    end
  end
end

#create an env with the module required if not already in the current enviroment
def make_custom_env do
  require Logger
  require Math
  __ENV__
end


#Now pass it to `ElixirScript.tranpile`
ElixirScript.compile("""
  Math.squared(1)
""", env: make_custom_env)

# returns ["1 * 1"]
```

You should be able to use `use` in modules now as well, but modules that have `__using__` macros must also be require'd so that they can be expanded.


# Using JavaScript libraries

You can use `alias`, `import`, and `require` as you would in Elixir (sans macros).

For JavaScript modules, use `JS.import`

```elixir
JS.import A, "a" #translates to "import {default as A} from 'a'"

JS.import [A, B, C], "a" #translates to "import {A, B, C} from 'a'"
```

# Limitations

#### Not all of the Kernel.SpecialForms module is defined

The following aren't defined (yet):

* `__CALLER__`
* `__ENV__`
* super

The following are defined but incomplete:

* quote - Currently ignores `:location` and `:context` options
* try - Missing an implementation for the `else` block
* for - `into` not implementated yet
* bitstring - Implemented, but no pattern matching support yet

#### Most of the Standard Library isn't defined yet
A lot of functions in the Kernel module are implemented. The Enum, Atom, List, Tuple, Logger, and Range modules are either fully defined are not complete. The rest still need to be implemented. Some modules like System or File may not be useful or function in the browser and may end up being only useful when using ElixirScript outside of the browser.


### Example projects
* [todo-elixirscript](https://github.com/bryanjos/example) The TodoMVC app using ElixirScript and Phoenix.

* [color_bar_spike](https://github.com/bryanjos/color_bar_spike) A canvas drawing example using ElixirScript, React and Delorean

#### Using with Brunch
There is a plugin for using ElixirScript in your Brunch project
[here](https://www.npmjs.com/package/elixirscript-brunch)

