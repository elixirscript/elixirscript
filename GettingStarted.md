# Getting Started with ElixirScript


The intent of this guide is to get you started with ElixirScript. It will give you instructions on using ElixirScript. I will go over the three ways you can use ElixirScript:

* As an escript
* As a mix task
* As a library in your application

### Escript

* Step 1: Get escript

    You can download the elixirscript escript from the [releases page on github](https://github.com/bryanjos/elixirscript/releases). It is a tar file named elixirscript.tar.gz.

* Step 2: Untar

    Next, untar elixirscript.tar.gz

    ```bash
    tar -xvzf elixirscript.tar.gz
    ```

    You will want to put the bin folder from the uncompressed folder into your path. This should allow you to use the elixirscript escript.

* Step 3: Use

    This is the help output of elixirscript

    ```bash
    usage: elixirscript <input> [options]
    <input> path to elixir files or the elixir code string if the -ex flag is used

    options:
    -o  --output [path]   places output at the given path
    -ex --elixir          read input as elixir code string
    -r  --root [path]     root import path for all exported modules
    --std-lib [path]      outputs the elixirscript standard library JavaScript files to the specified path
    --full-build          informs the compiler to do a full build instead of an incremental one
    only used when output is specified
    --core-path    es6 import path to the elixirscript standard lib
    only used with the [output] option. When used, Elixir.js is not exported
    -v  --version         the current version number
    -h  --help            this message
    ```

    the `<input>` is the elixir code string or file path you want to convert from elixir to javascript. Below is an example of using a code string and turning it into JavaScript

    ```bash
    $ elixirscript ":atom" -ex
    Symbol.for('atom')
    ```

    The elixirscript escript changed the elixir code, `:atom` into the JavaScript code `Symbol.for('atom')`. The `-ex` parameter lets the script know that the input is an Elixir code string instead of a file.

    What if we wanted to give it a file? You would simply do the following:

    ```bash
    $ elixirscript "example.exjs"
    Symbol.for('atom')
    ```

    **NOTE**: ElixirScript files must have the extension, `.exjs`

    What you will have noticed by now is that it has output everything we've done so far to the terminal. What about if we want to place the output to a path? The next example takes a file as input and outputs the result in another directory.

    ```bash
    $ elixirscript "example.exjs" -o "dist"
    ```

    If you look in the dist folder, you should see example.js as well as elixir.js. elixir.js is the JavaScript file that contains the Elixir Standard library. In example.js, the first line should be an import statement importing elixir.js for use.

    wildcards are also accepted:

    ```bash
    $ elixirscript "src" -o "dist"
    ```

    The last option we will show is the root option. This option is for defining a root path for the import statements. By default your import statement will not have anything prepended to it. For example, the elixir import will look like this:

    ```javascript
    import * as Elixir from 'elixir';
    ```

    If we wanted to prepend "js" to the root, we can like this:

    ```
    $ elixirscript "example.exjs" -o "dist" -r "js"
    ```

    Now the import will look like this:

    ```javascript
    import * as Elixir from 'js/elixir';
    ```

    That concludes the walkthrough on options, as well as the walkthrough on using the elixirscript escript.

### mix elixirscript

* Step 1: Get dependency

    The first step is getting the dependency. In your mix.exs file for your elixir project, add elixir_script to your deps.

    ```elixir
    {:elixir_script, "~> 0.17"}
    ```

* Step 2: Now download the dep

    ```bash
    $ mix deps.get
    ```

    Now you should have the mix task, elixirscript.

* Step 3: Use
    ```bash
    $ mix elixirscript "example.exjs" -o "dist" -r "js"
    ```

    What you will notice is that the parameters are exactly the same as the escript.

### ElixirScript module
* Step 1: Get dependency

    The first step is getting the dependency. In your mix.exs file for your elixir project, add elixir_script to your deps.

    ```elixir
    {:elixir_script, "~> 0.17"}
    ```

* Step 2: Now download the dep

    ```bash
    $ mix deps.get
    ```

* Step 3: Use
    Now you will be able to use the ElixirScript module within your code.

    ```elixir
    ElixirScript.compile(":atom")
    ```

    The is also compile_path/2 and compile_quoted/2. Each of the functions take an options keyword list.


### Macros
Macros must be defined in either a `.ex` or `.exs` file. These will be loaded at compile time and
whenever an import or require expression is found, if the module specified is loaded, it will use it to expand macros within the lexical scope.


### Appendix

#### Using JavaScript Modules

You can use `alias`, `import`, and `require` as you would in Elixir.

For JavaScript modules, use `JS.import`

```elixir
JS.import A, "a" #translates to "import {default as A} from 'a'"

JS.import [A, B, C], "a" #translates to "import {A, B, C} from 'a'"
```


#### ElixirScript-Brunch

There is an Brunch plugin, [ElixirScript-Brunch](https://www.npmjs.com/package/elixirscript-brunch).
There are instructions there on how to use it with Phoenix.

#### Gulp

There is no gulp plugin just yet, but below is an example of how to make a gulp
task that will work with it.

```javascript
var gulp = require('gulp');
var exec = require('child_process').exec;
var babel = require('gulp-babel');

//Calls out to the elixirscript compiler and places the output in src/js
gulp.task('build-exjs', function(cb) {
  exec('elixirscript "' + exjsSrc + '" -o ' + "src/js", function (err, stdout, stderr) {
    cb(err);
  });
});

// A task to turn the es6 output from build-exjs to es5
gulp.task('build-js', ['build-exjs'], function() {
  return gulp.src(jsSrc)
      .pipe(babel())
      .pipe(gulp.dest(jsDest));
});
```
