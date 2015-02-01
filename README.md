ExToJS
============

** EXPERIMENTAL: This is still very early **

The goal is to convert a subset (or full set) of Elixir code to ES6 JavaScript. Allowing the ability to write JavaScript in Elixir. This is done by taking the Elixir AST, converting it into [Spider Monkey AST](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API). From there it uses [escodegen](https://github.com/estools/escodegen) to convert the Spider Monkey AST to JavaScript.

This is still very early and is no where near complete. But it does convert some Elixir code to JavaScript already.

It also includes an escript cli named ex2js which takes files or Elixir code strings as input and outputs Spider Monkey AST or JavaScript code to output or files depending on the options
