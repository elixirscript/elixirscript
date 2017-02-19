## ElixirScript [![Documentation](https://img.shields.io/badge/docs-hexpm-blue.svg)](http://hexdocs.pm/elixir_script/) [![Build](https://travis-ci.org/bryanjos/elixirscript.svg?branch=master)](https://travis-ci.org/bryanjos/elixirscript) [![Deps Status](https://beta.hexfaktor.org/badge/all/github/bryanjos/elixirscript.svg)](https://beta.hexfaktor.org/github/bryanjos/elixirscript) [![Join the chat at https://gitter.im/elixirscript/elixirscript](https://badges.gitter.im/elixirscript/elixirscript.svg)](https://gitter.im/elixirscript/elixirscript?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

Communication
========

[gitter room](https://gitter.im/elixirscript/elixirscript)
[#elixirscript](https://elixir-lang.slack.com/messages/elixirscript/) on the elixir-lang Slack

Contributing
========

Please check the [CONTRIBUTING.md](CONTRIBUTING.md)


### Example projects
* [hello](https://github.com/bryanjos/hello) Shows using Phoenix + Elixirscript with file watching
* [Elixirscript frontend boilerplate](https://github.com/bryanjos/elixirscript-project-boilerplate) A boilerplate project for elixirscript frontends
* [Elixirscript React example](https://github.com/bryanjos/elixirscript_react) An example of using with React
* [Elixirscript AWS Lambda example](https://github.com/bryanjos/elixirscript_lambda)

#### Using with Brunch
There is a plugin for using ElixirScript in your Brunch project
[here](https://www.npmjs.com/package/elixirscript-brunch)

#### 1.0 Roadmap
There is a [1.0.0 Milestone](https://github.com/bryanjos/elixirscript/milestones/1.0.0) defined which includes issues that are needed to be cleared before 1.0 can be reached.
