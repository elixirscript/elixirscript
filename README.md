## ElixirScript [![Documentation](https://img.shields.io/badge/docs-hexpm-blue.svg)](http://hexdocs.pm/elixir_script/) [![Build](https://travis-ci.org/elixirscript/elixirscript.svg?branch=master)](https://travis-ci.org/elixirscript/elixirscript) [![Deps Status](https://beta.hexfaktor.org/badge/all/github/bryanjos/elixirscript.svg)](https://beta.hexfaktor.org/github/bryanjos/elixirscript) [![Join the chat at https://gitter.im/elixirscript/elixirscript](https://badges.gitter.im/elixirscript/elixirscript.svg)](https://gitter.im/elixirscript/elixirscript?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

The goal is to convert a subset (or full set) of Elixir code to JavaScript, providing the ability to write JavaScript in Elixir. This is done by taking the Elixir AST and converting it into JavaScript AST and then to JavaScript code. This is done using the [Elixir-ESTree](https://github.com/elixirscript/elixir-estree) library.

Requirements
===========
* Erlang 20 or greater
* Elixir 1.5 or greater (must be compiled with Erlang 20 or greater)
* Node 8.2.1 or greater (only for development)

Usage
========

Add dependency to your deps in mix.exs:

``` elixir
{:elixir_script, "~> x.x"}
```

Add `elixir_script` to list of mix compilers in mix.exs
Also add `elixir_script` configuration

```elixir
  def project do
  [
    app: :my_app,
    # ...
    # Add elixir_script as a compiler
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

Run `mix compile`


Examples
==========

### Application
[ElixirScript Todo Example](https://github.com/elixirscript/todo-elixirscript)

### Library
[ElixirScript React](https://github.com/elixirscript/elixirscript_react)

Development
===========

```bash
# Clone the repo
git clone git@github.com:bryanjos/elixirscript.git

#Get dependencies
make deps

# Compile
make

# Test
make test
```

Communication
========

[gitter room](https://gitter.im/elixirscript/elixirscript)

[#elixirscript](https://elixir-lang.slack.com/messages/elixirscript/) on the elixir-lang Slack

Contributing
========

Please check the [CONTRIBUTING.md](CONTRIBUTING.md)
