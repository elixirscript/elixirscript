# FAQ

# Q. How much is implemented?

### A. Most of Kernel.SpecialForms as well as some modules in the Standard Library

The compiler to this point has been focused on translating Kernel.SpecialForms and Kernel. Below is a list of what is complete, incomplete, as well as missing

#### Kernel.SpecialForms

* Complete
    * `__DIR__`
    * `__MODULE__`
    * `^var`
    * `&expr`
    * `for`
    * `%{}`
    * `{args}`
    * `<<args>>`
    * `fn [clauses] end`
    * `cond(clauses)`
    * `__block__`
    * `__aliases__`
    * `unquote`
    * `unquote_splicing`
    * `%`
    * `left.right`
    * `quote`
    * `import`
    * `case`
    * `left = right`
    * `require`
    * `left :: right`
    * `alias`
    * `__CALLER__`
    * `__ENV__`

* Missing
    * `super(args)`
    * `receive`

* Caveats
    * `quote` - ignores `location` and `context` options
    * `left = right` does not support full unification yet.
        ```elixir
        a = 1 # works as expected

        1 = a # may not work currently, but in some cases it will
        ```


#### Completed Modules

    * Tuple
    * List
    * Atom
    * Range
    * Logger
    * Map
    * MapSet

#### Incomplete Modules

    * Kernel
    * Enum
    * Agent
    * Integer
    * Keyword
    * Base
    * String
    * Bitwise
    * Set

#### Missing Modules
    * Everything else


## Q. Can I use it today?

### A. Yes, but don't expect it to be pretty or idiomatic. Also it is not production ready.

You **can** use ElixirScript on your front ends and have it work and interoperate with JavaScript modules. The problem is since most of the standard library is incomplete, it will not feel the same. It will feel like some weird hybrid of Elixir and JavaScript. That is not the goal of the project. The end goal is to have it look and feel like Elixir code with the added availability of JavaScript modules.

## Q. Can I use pattern matching?

### A. Yes, but not for bitstrings (yet)

## Q. Can I use processes?

### A. No, but follow [this issue](https://github.com/bryanjos/elixirscript/issues/99). Any ideas or contributions are appreciated.


## Q. Will it be able to do the things that Elm can?

### A. Maybe, but in an idiomatic fashion.

One of my demos is an example of using a design similar to redux to accomplish the things that redux does only using the Elixir standard library. Redux is influenced by Elm. The goal is to eventually allow for designs that can be Elm influenced if that is the desire. Similar to the same way the José saya to bring the spirit of projects from other languages to Elixir and not always just a straight port. If processes are added, I believe it will be easier to do those things in an idiomatic Elixir way.

## Q. What about OTP?

### A. Maybe.

Once processes are added, then we can see about adding OTP similar or specific things to ElixirScript.
