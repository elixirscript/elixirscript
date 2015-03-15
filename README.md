ExToJS
============

** EXPERIMENTAL: This is still very early **

The goal is to convert a subset (or full set) of Elixir code to ES6 JavaScript. Allowing the ability to write JavaScript in Elixir. This is done by taking the Elixir AST, converting it into [Spider Monkey AST](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API). From there it uses [escodegen](https://github.com/estools/escodegen) to convert the Spider Monkey AST to JavaScript.

This is still very early and is no where near complete. But it does convert some Elixir code to JavaScript already.

It also includes an escript cli named ex2js which takes files or Elixir code strings as input and outputs Spider Monkey AST or JavaScript code to output or files depending on the options

Development
===========

Clone the repo
  
    git clone git@github.com:bryanjos/ex_to_js.git

Get dependencies

    mix deps.get
    npm install

Compile

    mix compile

Test

    mix test
    
To build the escript

    mix escript.build


Usage
===

Add the following to your dependencies:

    { :ex_to_js, github: "bryanjos/ex_to_js"}
    
You can use the included mix task to convert Elixir to JavaScript

```
$ mix ex2js -h
  usage: ex2js <input> [options]

  <input> path to elixir files or 
          the elixir code string if the -ex flag is used

  options:

  -o  --output [path]   places output at the given path
  -t  --ast             shows only produced spider monkey ast
  -ex --elixir          read input as elixir code string
  -h  --help            this message
```

Alternatively, you can clone the repo, do `mix escript.build` and use the created `ex2js` escript without mix


TODO (high level list of todos)
======
* [ ] better todo list
* [x] case (currently works sans pattern matching support)
* [x] cond (currently works sans pattern matching support)
* [x] for (currently does not support keyword list matching or into yet)
* [ ] try
* [ ] bitstring
* [ ] string interpolation
* [x] return from a function
* [ ] pattern matching
* [ ] defexception
* [ ] types and specs
* [ ] pipe operator
* [ ] data structures
* [ ] figure out how using external js modules will work
* [ ] spawn
* [ ] actors
* [ ] optimize converted javascript
* [ ] regular expression
* [x] multiple arity functions
* [ ] make example project