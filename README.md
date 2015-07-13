ElixirScript
============

[Documentation](http://hexdocs.pm/elixir_script/)

The goal is to convert a subset (or full set) of Elixir code to JavaScript, providing the ability to write JavaScript in Elixir. This is done by taking the Elixir AST and converting it into JavaScript AST and then to JavaScript code. This is done using the [Elixir-ESTree](https://github.com/bryanjos/elixir-estree) library.

It also includes an escript CLI utility named ex2js. This takes files or Elixir code strings as input and emits Spider Monkey AST or JavaScript code. The results may be sent to standard output or files, based on the options selected.

ElixirScript is now in hex. There are transpile functions in th ElixirScript module. There is also a mix task, `mix ex2js` that works exactly like the cli client.

Requirements
===========
* Elixir
* Node or io.js (only for development)


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

To build distributable tarball

    mix ex2js.dist

    `ex2js-version-tar.gz` will be in the `dist` folder

Installation of the CLI client
==============

* uncompress `ex2js.tar.gz`.
* use `ex2js` executable found in the ex2js/bin folder


Usage
===

```
$ ex2js -h
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

#### ~~Must define each module you are going to use upfront~~

Should now be able to use modules without having to alias them upfront. If you reference a module using it's full name, an alias will automatically be created for it. If an alias already exists, then it will use that one instead. It's still early so there may be some bugs.

Ex.

```elixir
defmodule Hello do
    Lions.Tigers.Bears.oh_my(true)
end
```

will turn into this in JavaScript

```JavaScript
import Bears from 'lions/tigers/bears';
Bears.oh_my(true);
```


#### Not all of the Kernel.SpecialForms module is defined

The following aren't defined (yet):
    
* try
* `__CALLER__`
* `__DIR__`
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

#### Pattern matching works but is still limited
Pattern matching does work quite well now, but the implementation still needs to be thoroughly tested in a number of situations. 

Currently pattern matching on bitstrings isn't supported, but for every other case that one would use pattern matching, it should work.

There are probably more that I'm forgetting. Check the issues for what's implemented and what still is needed.

### Example projects

* [todo-elixirscript](https://github.com/bryanjos/example) The TodoMVC app using ElixirScript and Phoenix.
    
* [color_bar_spike](https://github.com/bryanjos/color_bar_spike) A canvas drawing example using ElixirScript, React and Delorean
