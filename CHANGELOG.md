# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [unreleased]
### Added
- Reimplement `String.split_at/2` to make sure Unicode library isn't compiled
- Added `ElixirScript.JS.map_to_object/2` with options [keys: :string, symbols: false]

### Fixed
- Make sure not to add underscores to erlang functions
- Make sure any variable names that are javascript keywords are handled properly

## [0.30.0] - 2017-08-15

### Added
- ElixirScript now has a Foreign Function Interface (FFI) for interoperability with JavaScript. For more details, see documentation at `ElixirScript.FFI`
- `ElixirScript.JS.mutate/3`
- `ElixirScript.JS.map_to_object/1`
- `root` option for specifying the root import path for FFI JavaScript modules. Defaults to `"."`

### Changed
- Compiler has been completely rewritten. ElixirScript now requires Erlang 20+ and Elixir 1.5+
- `JS` module renamed to `ElixirScript.JS`
- Default output path is now `priv/elixir_script/build`

### Removed
- Support for CommonJS and UMD output formats has been removed. Output will be in ES module format
- The `js_modules` option has been removed in favor of the new FFI
- ElixirScript.Watcher has been removed

## [0.28.0] - 2017-06-11

### Added
- `remove-unused` option that will remove all unused modules from output
- reimplemented structs to avoid creating JavaScript classes

## [0.27.0] - 2017-03-17

### Added
- `super`
- `defoverridable`
- `IO.inspect\1`, `IO.puts\1`, `IO.puts\2`, `IO.warn\1`
- `Elixir.load` for loading generated JavaScript modules in bundled output.
Unlike `Elixir.start`, this will only call `__load` on the module and return the functions on it

```javascript
const exports = Elixir.load(Elixir.MyApp);
exports.hello();
```

### Changed
- `-ex` alias is now `-e`
- A filename can be specified for output
- To access global JavaScript functions, modules, and properties, use the `JS` module
```elixir
JS.length # translates to 'length'
JS.alert() # translates to 'alert()'
JS.String.raw("hi") # translate to String.raw('hi')
JS.console.log("hi") # translates to console.log('hi')
```

### Fixed
- Make sure mix compiler works in umbrella apps

## [0.26.1] - 2017-02-27

### Fixed
- Fixed `for` translation
- Updated documentation

## [0.26.0] - 2017-02-27

### Added
- Multiple `when` clauses in guards
- Kernel.defdelegate/2
- `js_modules` configuration option has been added. This is a list of JavaScript modules that will be used.
  ```
        js_modules: [
          {React, "react"},
          {ReactDOM, "react-dom"}
        ]
  ```

- `js-module` flag has been added to the CLI in order to pass js modules.
```
elixirscript "app/elixirscript" -o dist --js-module React:react --js-module ReactDOM:react-dom
```

### Removed
- `@on_js_load` has been removed in favor of having a `start/2` function defined. More info below
- `JS.import` has been removed in favor of defining JavaScript modules used in configuration

### Changed
- Now bundles all output, including the boostrap code.
  The exported object has Elixir modules in JavaScript namespaces that are lazily loaded when called.

  To start your application import the bundle according to whichever module format was selected and
  then call start giving it the module and the initial args

  ```javascript
  //ES module example
  import Elixir from './Elixir.App'
  Elixir.start(Elixir.App, [])
  ```

  The `start` function will look for a `start/2` function there.
  This is analogous to a [Application module callback](https://hexdocs.pm/elixir/Application.html#module-application-module-callback)




## [0.25.0] - 2017-02-19

### Added
- Updated elixir_script mix compiler to support compiling elixir_script paths in dependencies if dependency has mix compiler defined as well
- Add `Collectable` protocol implementations
- Updated `for` implementation to use `Collectable`
- `format` option. Can now specify the module format of output.
    Choices are:
        * `:es` (default) for ES Modules
        * `:umd` for UMD
        * `:common` for CommonJS

- Default input, output and format for elixirscript mix compiler. In a mix project by default the elixirscript compiler will look in `lib/elixirscript` and input and place output in `priv/elixirscript`. The default format is `:es`

### Removed
- `receive`
- `Process` module

### Fixed
- JS module functions not translated properly when imported
- Update fs dependency to 2.12
- Incorrect handling of function heads with guards

## [0.24.0] - 2017-01-15

### Added
- Support for `sigil_r`
- `Regex` module
- Better JavaScript formatting

### Fixed
- CLI now allows a comma-separated or space-separated list of paths
- Struct not properly referenced
- Tail call optimization

## [0.23.3] - 2016-11-18

### Added
- `@load_only`: lets the compiler know to load in the module, but not to compile it


## [0.23.2] - 2016-11-17

### Fixed
- Agent not functioning properly. Now uses internal store instead of making a process and using that to put data in store
- Protocol incorrectly handling strings
- `defgen` and `defgenp` functions not being recognized by Elixir compiler.


## [0.23.1] - 2016-11-16

### Fixed
- Incorrectly sending standard lib when using compile or compile_path by default

## [0.23.0] - 2016-11-15

### Added
- [`with` now supports `else`](https://github.com/bryanjos/elixirscript/pull/207)
- [Implement `context` option on `quote`](https://github.com/bryanjos/elixirscript/pull/208)
- New compiler pipeline
- `@on_js_load`. Expects a 0 arity function. This function will be called when the compiled module is loaded in JavaScript
- `JS.import\3`. Just like `JS.import\2` but expects options to decide if the import should be a default one or a namespace on. Only option allowed is `default`. Set to `true` by default
  ```elixir
  # translates to "import A from 'a'"
  JS.import A, "a"

  #translates to "import * as A from 'a'"
  JS.import A, "a", default: false
  ```

### Removed
- The form of `JS.import` that accepted a list of atoms as the first arg. Used `JS.import\3` with `default: false` instead to create a namespace import
- `env` and `root` are no longer options for `ElixirScript`'s compile functions and cli
- Syntax once supported by Elixirscript `JQuery.("#element")`, is no longer supported

### Changed
- [Changed CHANGELOG.md to adhere the format from Keep a Changelog](https://github.com/bryanjos/elixirscript/pull/205)
- `defmacro` now supported. No longer have to separate macros from functions in separate files. `defmacrop` still unsupported
- To use anything in the `JS` module, you must `require` the `JS` module first
- Elixirscript files must now contain valid Elixir syntax.
- Now compiles `exjs` and `ex` files within the path can be compiled all the same. Dependencies from hex are still unsupported so these files must not rely on any code outside of the path. What this does mean is that it is now possible to share code between Elixir and Elixirscript as long as the Elixir files functionality fall within what Elixirscript currently supports.
- `defgen`, `defgenp`, `yield`, `yield_to`, and `object` are now in the `JS` module
- To access functions in the global JavaScript scope, either use `JS.global\0` or use the erlang module call syntax
    ```elixir
    #calling alert
    JS.global().alert("hi")

    #calling alert
    :window.alert("hi")
    ```
    Calling JavaScript modules in the global scope works without using the above methods
    ```elixir
    #calls window.Date.now()
    Date.now()
    ```

## [0.22.0] - 2016-10-16
### Added
- `defgen` and `defgenp` for defining public and private generators
- `yield/0`, `yield/1`, and `yield_to\1` to `Kernel`

### Changed
- Updated output folder structure. stdlib code will now go in an `elxiir` folder under the output paths while generated app code will go into an `app` folder under the output path
- All process macros and functions now expect to receive and/or work using generators as entry points. Using functions defined with `def` or `defp` will not work correctly with them

### Fixed
- Correctly returning list if list is only item in body

## [0.21.0] - 2016-06-28
### Added
- This is the first release with early support for processes in elixirscript. Creating a process only works currently using `spawn/1`, `spawn_link/1`, and `spawn_monitor/1`. Inside of a process, you can use functions such as `send` and `receive`, along with some defined in the `Process` module. From outside of a process, you can send messages to a process, but you cannot receive a message from a process. Eventually all code will run inside processes and this restriction will naturally lift.
- The `Process` module has been implemented with the following functions:
    * `alive?/1`
    * `delete/1`
    * `demonitor/1`
    * `exit/2`
    * `flag/2`
    * `flag/3`
    * `get/0`
    * `get_keys/0`
    * `get_keys/1`
    * `link/1`
    * `list/0`
    * `monitor/1`
    * `put/2`
    * `register/2`
    * `registered/0`
    * `send/3`
    * `sleep/1`
    * `unlink/1`
    * `unregister/1`
    * `whereis/1`
- The `receive` special form has been implemented with the above caveat
- The following have been implemented on `Kernel`:
    * `spawn/1`
    * `spawn_link/1`
    * `spawn_monitor/1`
    * `send/2`
    * `make_ref/0`

## Fixed
- Scoping on `fn` and `def`

## [0.20.0] - 2016-05-14
### Added
- `ElixirScript.Watcher` module and `elixirscript.watch` mix task
- logging MatchError exceptions to better show terms that don't match

## [0.19.0] - 2016-04-30
### Added
- elixir_script mix compiler

### Removed
- `Html`, `View`, and `VDom` modules have been removed

## [0.18.0] - 2016-04-08
### Changed
- Better support for macros. Macros should be defined in .ex or .exs files. ElixirScript code should be in .exjs files

**NOTE**: The above functionality will cause either compiler errors or no output. Please change extensions of ElixirScript code to .exjs

### Deprecated
- `Html`, `View`, and `VDom` modules will be removed in the next version as they can now be replicated using macros

## [0.17.0] - 2016-03-31
### Added
- `output` as an option for compiler functions. This controls whether output is returned as a list of tuples, send to stdout, or saved to a file path
- `:full_build` as an option for compiler functions and `--full-build` option to CLI. These force the compiler to perform a full build
- `--version` option to CLI. Outputs current version of elixirscript
- `--std-lib` option to CLI. Takes a path and adds the stdlib to that path

### Changed
- Renamed `copy_core_to_destination` to `copy_stdlib_to_destination`
- Incremental Compilation: ElixirScript will now only build files and modules that have changed since the last build

### Removed
- `--core` option from CLI and `:core` compiler option.

## [0.16.0] 2016-02-27
### Added
- Bitstring pattern matching
- Bitstrings in for comprehensions
- Functions with catch, after, else clauses
- `with` special form
- Pin operator in map keys and function clauses
- Added `Kernel.object/1` function to make it more natural to create a JavaScript object with string keys. Elixirscript, by default turns the following, `%{a:"b"}` into `{[Symbol.for("a")]: "b"}` in JavaScript. In order to get string keys, one would have to do `%{"a" => "b"}` which turns into `{a: "b"}` in JavaScript. With `Kernel.object`, you can create string keyed maps conveniently, `object(a: "b")` which turns into `{a: "b"}`.

 **NOTE**: when updating the created by, you still have to use the string form `%{ my_map | "a" => "c" }`

### Removed
- `JS.update(object, property, value)` has been removed and replaced with `JS.update(object, map)`. This allows you to update multiple values on a javascript object at once.

### Fixed
- Optional parameters should now work as expected

## [0.15.2] - 2016-02-21
### Addded
- Support for variables as map keys

### Fixed
- Protocol implementations for Integer and Float which where not recognized
- Calling properties on non-objects

## [0.15.1] - 2016-02-19
### Removed
- Removed `catch` as a javascript keyword to filter

### Fixed
- Fixed View module so that an element can have multiple elements within
- struct implementation so that lists of atoms for fields are compiled correctly
- head-tail pattern match to allow for more complicated scenarios
- ModuleCollector to properly alias inner modules
- Raise translation to properly translate when string messages are given

## [0.15.0] - 2016-01-26
### Added
- `__ENV__` and `__CALLER__` are now supported
- `JS.import/1`, `JS.typeof/1`,`JS.instanceof/1`, and `JS.global/1`
- Support for multi alias/require/imports statements

### Changed
- `alias`, `require`, and `import` now work inside lexical scopes
- Some of the standard library originally written in JavaScript has been rewritten in Elixir.
- Generated JavaScript export statements are now default exports
- When output is sent to standard out, there are now markers to specify where each module begins as well as what the file name would be. For the end of a file, `//:ENDFILE` is used. For the file name, `//<file>:ENDFILENAME` is used where `<file>` is the name of the file
- `compile`, `compile_path`, and `compile_quoted` opts parameter now expects a map
- The `stdlib` compiler option is now `core`. The `stdlib_path` compiler options is now `core_path`

## [0.14.1] - 2015-12-07
### Removed
- .DS_Store and LICENSE from output

## [0.14.0] - 2015-12-06
### Added
- Can now implement protocols using JavaScript types
  ```elixir
    defimpl MyProtocol, for: HTMLElement
  ```
- virtual-dom JavaScript library
- ElixirScript.Html module for defining a virtual-dom tree
- ElixirScript.VDom module for manipulating the virtual-dom tree created using the ElixirScript.Html module
- Added ElixirScript.View module for handling view state and rendering virtual-dom
- Added `stdlib_path` compiler option to specify the es6 path to the standard library. If used, elixir.js will not be exported with the compiled modules

### Changed
- Renamed `ex2js` to `elixirscript`. This effects the escript as well as the
  mix task
- Structs are now translated into classes
- Structs and Tuples now match on their types
- Can now match on JavaScript classes. Works just like matching on structs:
  ```elixir
    def my_func(%HTMLElement{id: "myId"})
  ```
- Moved non-elixir JavaScript code into `core` es6 module. This will hopefully
  make it so ElixirScript Standard Library modules can be defined in Elixir soon.

## [0.13.0] - 2015-10-26
### Added
- `Base` module with function: encode64, decode64, and decode64!
- `String` module
- `Bitwise` module
- `Map` module
- `MapSet` module
- `Set` module
- Protocol support
- Added `Collectable`, `Enumerable`, `Inspect`, `List.Chars`, and `String.Chars` protocols. The only one currently being used in the Standard Library, however, is String.Chars

## [0.12.0] - 2015-09-23
### Added
- Added PostOffice. Only thing that current uses it is Agent

### Changed
- Updated tuple implementation. It's now a class.
- Replaced pattern matching library with custom one
- Moved data types to Kernel.SpecialForms
- `else` now works for try expressions
- for now works with `into` for lists

### Removed
- Removed erlang.js.

## [0.11.0] - 2015-09-17
### Added
- Added `JS` module with `new`, `mutate`, `import` macros
- Added `Keyword` module with functions, `has_key?` and `get`
- Added `Agent` module with functions, `start`, `get`, `update`, and `get_and_update`

### Changed
- Map keys are now correctly turned into their atom counterparts if atom keys are used
- `import` works with all options
- `Mutable.update` has been replaced by `JS.update`
- `transpile`, `transpile_quoted`, and `transpile_path` are now `compile`, `compile_quoted`, and `compile_path`
- All Standard libraries are rolled up into one elixir.js file and imported from that
- Modules no longer export a default object
- `alias` now translates to a namespace import unless `default` option is given

## [0.10.0] - 2015-09-02
### Added
- Added `env` option for `ElixirScript.transpile` adding macros for compilation
- Added `Logger` that translates Logger functions to console

### Changed
- Updated `Kernel` module to translate some functions to it's JavaScript equivalent

### Fixed
- Fixed `case` implementation to add `this` to call

## [0.9.0] - 2015-08-30
### Added
- an implementation for quote. Currently ignores `:location` and `:context` options
- an implementation for unquote and unquote_splicing

## [0.8.0] - 2015-08-15
### Added
- Can now support catch blocks in try expressions
- Added receive

### Changed
- Updated pattern matching implementation
- Wrapped try's in function closure to make sure they return a value;

## [0.7.0] - 2015-08-01
### Added
- Can now support rescue and after blocks in try expressions

## [0.6.5] - 2015-07-13
### Changed
- Now using the JS code generator from elixir-estree for code generation, improving speed of transpilation
- the parse functions in the ElixirScript module have been renamed to transpile

## [0.6.0] - 2015-07-02
### Added
- Added iterators for Range and BitString
- Now replacing characters that can't be used in variable and function names in JavaScript with something that it (i.e. `match?` -> `match__qmark__`)
- Implemented Integer module

### Changed
- Made the Tuple, Range and BitString data structures more immutable
- Atom now translates to an ES6 Symbol
- List now translates to a frozen JS Array
- Updated the pattern match binding to use ES6 destructuring for lists and tuples
- Inner modules are now split out into their own files
    * Standard lib is now exported with file output from cli
    * Standard lib modules are now automatically imported
    * No longer have to define modules via aliases ahead of time. They will be automatically be resolved
      and made into JavaScript import statements

## [0.5.0] - 2015-05-31
### Added
- added `from` clause to `import`, `alias`, and `require` so that the import path can be overridden

### Changed
- For statements now work with pattern matching tuples
- Improved function chaining
- `alias` now acts like `require` in that it is translated into an import default statement
- modules now export a default object with def functions added as properties on it.
- for function closures, now calling by using `.call(this)` so that `this` is available inside of it

## [0.4.0] - 2015-05-05
### Added
- bitstrings
- Better Pattern Matching (Does not support bitstrings yet)
- Capture Operator
- Added more functions from the list standard library

### Changed
- Updated variable implementation to match Elixir's (i.e. Reusing the same variable name creates a new one in the background)

### Fixed
- Fixed multi arity implementation

## [0.3.0] - 2015-04-23
### Added
- function and case guards
- function and case pattern matching

### Changed
- Can now use ^ on a variable during assignment

## [0.2.1] - 2015-04-14
### Changed
- Renamed project to ElixirScript
- Reduced escript file size

## [0.2.0] - 2015-04-12
### Added
- Pipe operator
- String interpolation
- Adding more functions to the Kernel module
- Fully implemented Tuple module
- Fully implemented Atom module
- Fully implemented Range module

### Changed
- Now checking to see if a function is a Kernel function and prepending Kernel to it
- Now turning Atoms into an Atom javascript object instead of a Symbol
- Now turning tuples into a Tuple javascript object
- Can now call properties and zero parameter functions correctly
- case, cond, and if are now turned into if statements wrapped in function closures
- Anonymous functions are now turned into anonymous functions in javascript insteed of arrow functions

## [0.1.0] - 2015-04-04
### Added
- From standard library implemented:
 * Enum.map
 * Kernel.tl
 * Kernel.hd
 * Logger
- Implemented language features:
 * All primitives except bitstrings
 * defmodule
 * import, alias, and require
 * case, cond, if
 * def, defp
 * defstruct, defexception
 * raise
 * multiple arity functions
 * basic binary operations
 * for without into
