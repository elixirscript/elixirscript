## ElixirScript [![Documentation](https://img.shields.io/badge/docs-hexpm-blue.svg)](http://hexdocs.pm/elixir_script/) [![Build](https://travis-ci.org/elixirscript/elixirscript.svg?branch=master)](https://travis-ci.org/elixirscript/elixirscript) [![Deps Status](https://beta.hexfaktor.org/badge/all/github/bryanjos/elixirscript.svg)](https://beta.hexfaktor.org/github/bryanjos/elixirscript) [![Join the chat at https://gitter.im/elixirscript/elixirscript](https://badges.gitter.im/elixirscript/elixirscript.svg)](https://gitter.im/elixirscript/elixirscript?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

The goal is to convert a subset (or full set) of Elixir code to JavaScript, providing the ability to write JavaScript in Elixir. This is done by taking the Elixir AST and converting it into JavaScript AST and then to JavaScript code. This is done using the [Elixir-ESTree](https://github.com/elixirscript/elixir-estree) library.

Requirements
===========
* Erlang 20 or greater
* Elixir 1.5 or greater (must be compiled with Erlang 20 or greater)
* Node 8.2.1 or greater (only for development)

Usage
========

Please check the [Getting Started Guide](GettingStarted.md) for usage

Examples
==========

[ElixirScript Todo Example](https://github.com/elixirscript/todo-elixirscript)


Development
===========

```bash
# Clone the repo
git clone git@github.com:bryanjos/elixirscript.git

#Get dependencies
mix deps.get
yarn

# Create ElixirScript.Core.js
yarn build

# Compile
mix compile

# Test
mix test
yarn test
```

Communication
========

[gitter room](https://gitter.im/elixirscript/elixirscript)

[#elixirscript](https://elixir-lang.slack.com/messages/elixirscript/) on the elixir-lang Slack

Contributing
========

Please check the [CONTRIBUTING.md](CONTRIBUTING.md)
