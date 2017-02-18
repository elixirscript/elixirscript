# FAQ

# Q. How do I get started?

### A. Check out the [Getting Started](GettingStarted.md) Guide for more info.

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
    * `quote` - ignores `context` options
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

### A. Yes, but realize this is not at 1.0 yet.

You **can** use ElixirScript on your front ends and have it work and interoperate with JavaScript modules. The problem is since most of the standard library is incomplete.

## Q. Can I use pattern matching?

### A. Yes

## Q. Can I use processes?

### A. ElixirScript does not support processes

## Q. What about OTP?

### A. ElixirScript does not support OTP
