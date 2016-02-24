## ElixirScript [![Documentation](https://img.shields.io/badge/docs-hexpm-blue.svg)](http://hexdocs.pm/elixir_script/) [![Build](https://travis-ci.org/bryanjos/elixirscript.svg?branch=master)](https://travis-ci.org/bryanjos/elixirscript)

The goal is to convert a subset (or full set) of Elixir code to JavaScript, providing the ability to write JavaScript in Elixir. This is done by taking the Elixir AST and converting it into JavaScript AST and then to JavaScript code. This is done using the [Elixir-ESTree](https://github.com/bryanjos/elixir-estree) library.

Requirements
===========
* Elixir
* Node (only for development)

Usage
========

Please check the [Getting Started Guide](GettingStarted.md) for usage


FAQ, Limitations
========

Please check the [FAQ](FAQ.md)


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
    npm test


Contributing
========

Please check the [CONTRIBUTING.md](CONTRIBUTING.md)


### Example projects
* [todo-elixirscript](https://github.com/bryanjos/todo-elixirscript) A Todo App built with Elixirscript and Phoenix
* [phoenix_chat_example](https://github.com/bryanjos/phoenix_chat_example) The Phoenix Chat App using ElixirScript.
* [MobileElixir](https://github.com/bryanjos/MobileElixir) Using ElixirScript with React Native
* [color_bar_spike](https://github.com/bryanjos/color_bar_spike) A canvas drawing example using ElixirScript, React and a Redux-like design

#### Using with Brunch
There is a plugin for using ElixirScript in your Brunch project
[here](https://www.npmjs.com/package/elixirscript-brunch)
