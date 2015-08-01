## ElixirScript [![Documentation](https://img.shields.io/badge/docs-hexpm-blue.svg)](http://hexdocs.pm/elixir_script/)

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
    {:elixir_script, "~> 0.6"}
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

To build distributable tarball

    mix ex2js.dist

    `ex2js.tar.gz` will be in the `dist` folder

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

#Limitations

#### Not all of the Kernel.SpecialForms module is defined

The following aren't defined (yet):
    
* `__CALLER__`
* `__ENV__`
* quote
* unquote
* unquote_slicing
* receive
* super

#### Most of the Standard Library isn't defined yet
A lot of functions in the Kernel module are implemented. The Enum, Atom, List, Tuple, Logger, and Range modules are either fully defined are not complete. The rest still need to be implemented. Some modules like System or File may not be useful or function in the browser and may end up being only useful when using ElixirScript outside of the browser.

#### No Macro support
Not sure how this would be implemented right now, but looking for ideas.

#### Only rescue and after are currently supported on try expressions
Just because the translation of `catch` and `else` haven't been figured out just yet

#### Pattern matching works but is still limited
Pattern matching does work quite well now, but the implementation still needs to be thoroughly tested in a number of situations. 

Currently pattern matching on bitstrings isn't supported, but for every other case that one would use pattern matching, it should work.

There are probably more that I'm forgetting. Check the issues for what's implemented and what still is needed.

### Example projects

* [todo-elixirscript](https://github.com/bryanjos/example) The TodoMVC app using ElixirScript and Phoenix.
    
* [color_bar_spike](https://github.com/bryanjos/color_bar_spike) A canvas drawing example using ElixirScript, React and Delorean
