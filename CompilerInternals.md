# Compiler Internals

This is a document describing how ElixirScript works. This is intended for those who would like to contribute to ElixirScript or those who are curious how it works.

## Input

[ElixrScript.Compiler](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/compiler.ex) is the entry point of the compiler. It takes in either a module or a list of modules. These are what are called the `entry modules` or the entry points into your application. These are the places ElixirScript will start it's compilation process. It will traverse what is used and only compile those things. This is the first step in the compilation process. Finding used modules to compile.

## Finding Used Modules

[ElixirScript.FindUsedModules](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/passes/find_used_modules.ex) looks at our entry modules and recursively crawls them to find all the modules used. It firsts exacts the Abstract Syntax Tree (AST) from the Beam file and then looks for references to modules that haven't been crawled yet. This information is stored in [ElixirScript.State](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/state.ex)

## AST Extraction from Beam Files

ElixirScript requires at Erlang 20+ and Elixir 1.6+. The reason why is that in Erlang 20 there is a new feature that allows for debug information to be stored in beam files. Any of the beam languages can use this. Elixir uses it by storing the AST for the module in there. This is a special version of the AST where all of the macros are expanded. This means ElixirScript does not have to worry about macro expansion itself. This AST is what ElixirScript works with.

The code for this is in the [ElixirScript.Beam](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/beam.ex) module.

`ElixirScript.debug_info/1` takes in a module name and returns the AST for that module. For a normal module, `{:ok, map}` are returned. If a protocol is given, `{:ok, atom, map, list}` is returned. The `atom` is the name of the protocol, The `map` is the protocol's AST and the `list` is the list of all of the implementation modules.

This module handles the `String` and `Agent` modules a little bit differenly. Because of how Elixir compiles the unicode library, ElixirScript has to be careful not to compile the entire unicode library in JavaScript. So here, `debug_info` will get the AST from `String`, but replace some functions with the AST from `ElixirScript.String`. This ensures ElixirScript uses versions of functions in the standard lib that won't bring in the unicode module. The ame thing happens for `Agent` for different reasons. `Agent` is the only OTP module ElixirScript supports. ElixirScript hacks together a version of `Agent` that stores state in a way that allows ElixirScript users to use `Agent` just like they would with Elixir.

## Finding Used Functions

[ElixirScript.FindUsedFunctions](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/passes/find_used_functions.ex) is our second process in shrinking our compilation suface. In this process, we crawl through the modules we have found for compilation and see which functions are actually being called. This information is also stored in [ElixirScript.State](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/state.ex) for each module.

**Note**: Because of the way protocols work, it is impossible to know what is used and what isn't. So for protocols and their implementations, we have to take in everything.

Now we have what we need to compile to the JavaScript AST.

## JavaScript AST (ESTree)

Before going further, here is a brief intro into the JavaScript AST we use. The [ESTree spec](https://github.com/estree/estree) is a specification based on SpiderMonkey's JavaScript AST. This is used by several tools in the JavaScript ecosystem. There are many other versions of JavaScript ASTs, but the reason ElixirScript uses this one is because there are popular tools in the JavaScript ecosystem that understand it. ElixirScript uses the [ESTree](https://github.com/elixirscript/elixir-estree) Hex package. This package has structs that represent ESTree Nodes. It can also turn those into JavaScript code.

## Translation

[ElixirScript.Translate](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/passes/translate.ex) starts off the translation process. All this module does though is call [ElixirScript.Translate.Module](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/passes/translate/module.ex) on each of our modules. Here is where we take in the module info for each module and start translating to JavaScript AST. We compile the function definitions into JavaScript. Here is where we process the information gained from `ElixirScript.FindUsedFunctions` to remove any unused functions. In Elixir, function names are made up of the name and the arity. In JavaScript, that is not the case. ElixirScript combines function arities here into one definition. From here, ElixirScript compiles each function and places the translated AST back into `ElixirScript.State`.

Functions comprise of clauses. Clauses have guards and blocks. Blocks being the blocks of code that make up the implementation.

[ElixirScript.Translate.Function](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/passes/translate/function.ex) handles function translation. `ElixirScript.Translate.Function.compile_block\2` handles compilation of blocks. for each item in the block, `ElixirScript.Translate.Form.compile\2` is called. This is what is responsible for a bulk of the translation.

Another aside to talk about function translation. Elixir supports tail call recursion. JavaScript does not. To allow our ElixirScript-translated functions to do so, we use a technique called `trampolining`. ElixirScript implementation still has some bugs, but it works for the most part.

## Pattern Matching Translation

Patterns are processed using [ElixirScript.Translate.Forms.Pattern](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/passes/translate/forms/pattern.ex). It takes all the forms of patterns and compiles them into JavaScript AST. The AST represents calls to the [Tailored](https://github.com/elixirscript/tailored) JavaScript library. This library is responsible for pattern matching at run time.

## Output

[ElixirScript.Output](https://github.com/elixirscript/elixirscript/blob/master/lib/elixir_script/passes/output.ex) is the last step in compilation. This modules is responsible for creating JavaScript modules and writing them to the file system. Each Elixir module is translated into a JavaScript module.
