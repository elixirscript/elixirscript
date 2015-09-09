# v0.11.0-dev
* Enhancement
  * Added `JS` module with `new` and `mutate` functions
  * All Standard libraries are rolled up into one elixir.js file and imported from that
  * Added `DOM` module for creating virtual DOM nodes, and diffing them and applying patches to real DOM 
  * Added `Fetch` module to wrap fetch API
  * Added `Keyword` module with functions, `has_key?` and `get`
  * Added `Agent` module with functions, `start`, `get`, `update`, and `get_and_update`

* Breaking
  * import - `only` option is the only one allowed
  * aliases are now longer automatically turned into ES6 import statements. You must alias all modules used within a module
  * `Mutable.update` has been replaced by `JS.mutate`

# v0.10.0
* Enhancements
  * Added `env` option for `ElixirScript.transpile` adding macros for compilation
  * Fixed `case` implementation to add `this` to call
  * Updated `Kernel` module to translate some functions to it's JavaScript equivalent
  * Added `Logger` that translates Logger functions to console

# v0.9.0
* Enhancements
  * an implementation for quote. Currently ignores `:location` and `:context` options
  * an implementation for unquote and unquote_splicing

# v0.8.0
* Enhancements
  * Can now support catch blocks in try expressions
  * Wrapped try's in function closure to make sure they return a value;
  * Added receive
  * Updated pattern matching implementation

# v0.7.0
* Enhancements
  * Can now support rescue and after blocks in try expressions

# v0.6.5
* Enhancements
  * Now using the JS code generator from elixir-estree for code generation, improving speed of transpilation
  * the parse functions in the ElixirScript module have been renamed to transpile

# v0.6.0
  * Enhancements
    * Made the Tuple, Range and BitString data structures more immutable
    * Now replacing characters that can't be used in variable and function names in JavaScript with
      something that it (i.e. `match?` -> `match__qmark__`)
    * Implemented Integer module
    * Atom now translates to an ES6 Symbol
    * List now translates to a frozen JS Array
    * Added iterators for Range and BitString
    * Updated the pattern match binding to use ES6 destructuring for lists and tuples
    * Inner modules are now split out into their own files
    * Standard lib is now exported with file output from cli
    * Standard lib modules are now automatically imported
    * No longer have to define modules via aliases ahead of time. They will be automatically be resolved
      and made into JavaScript import statements

# v0.5.0
  * Enhancements
    * For statements now work with pattern matching tuples
    * Improved function chaining
    * added `from` clause to `import`, `alias`, and `require` so that the import path can be overridden
    * `alias` now acts like `require` in that it is translated into an import default statement
    * modules now export a default object with def functions added as properties on it. 
    * for function closures, now calling by using `.call(this)` so that `this` is available inside of it

# v0.4.0
  * Enhancements
    * bitstrings
    * Better Pattern Matching (Does not support bitstrings yet)
    * Capture Operator
    * Fixed multi arity implementation
    * Updated variable implementation to match Elixir's (i.e. Reusing the same variable name creates a new one in the background)
    * Throwing ParseError for SpecialForms currently not supported
    * Added more functions from the list standard library

# v0.3.0
  * Enhancements
    * function and case guards
    * function and case pattern matching
    * Can now use ^ on a variable during assignment

# v0.2.1
  * Enhancements
    * Renamed project to ElixirScript
    * Reduced escript file size

# v0.2.0
  * Enhancements
    * Pipe operator
    * String interpolation
    * Adding more functions to the Kernel module
    * Now checking to see if a function is a Kernel function and prepending Kernel to it
    * Now turning Atoms into an Atom javascript object instead of a Symbol
    * Now turning tuples into a Tuple javascript object
    * Fully implemented Tuple module
    * Fully implemented Atom module
    * Fully implemented Range module
    * Can now call properties and zero parameter functions correctly
    * case, cond, and if are now turned into if statements wrapped in function closures
    * Anonymous functions are now turned into anonymous functions in javascript insteed of arrow functions

# v0.1.0

* Enhancements
  * From standard library implemented:
      * Enum.map
      * Kernel.tl
      * Kernel.hd
      * Logger

  * Implemented language features:
      * All primatives except bitstrings
      * defmodule
      * import, alias, and require
      * case, cond, if
      * def, defp
      * defstruct, defexception
      * raise
      * multiple arity functions
      * basic binary operations
      * for without into

  * Missing features:
      * bitstrings
      * pattern matching
      * macros
      * actors
      * try
      * regular expressions
      * string interpolation
      * Most of standard library
