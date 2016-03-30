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

    mix do std_lib, clean, compile

Test

    mix test
    npm test


Build
=============
    MIX_ENV=prod mix do clean, compile, std_lib, dist

This will build a tarball in the dist folder.
By default the escript built will look into the folder above it for the
core JavaScript files needed for ElixirScript. To change the location,
update the `lib_path` config variable in the `:elixir_script` config block
to the path to look in and then do a clean build.

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
