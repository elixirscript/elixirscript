# Getting Started with ElixirScript


The intent of this guide is to get you started with ElixirScript. It will give you instructions on using ElixirScript. I will go over the three ways you can use ElixirScript:

* As an escript
* As a mix task
* As a library in your application

### Escript

* Step 1: Get escript
    
    You can download the elixirscript escript from the [releases page on github](https://github.com/bryanjos/elixirscript/releases). It is a tar file named ex2js.tar.gz.

* Step 2: Untar

    Next, untar ex2js.tar.gz
    
    ```bash
    tar -xvzf ex2js.tar.gz
    ```
    
    You will want to put the bin folder from the uncompressed folder into your path. This should allow you to use the ex2js escript.
    
* Step 3: Use

    This is the help output of ex2js
    
    ```bash
      usage: ex2js <input> [options]
    
      <input> path to elixir files or
              the elixir code string if the -ex flag is used
    
      options:
      -o  --output [path]   places output at the given path
      -ex --elixir          read input as elixir code string
      -r  --root [path]     root path for standard libs
      -h  --help            this message
    ```
    
    the `<input>` is the elixir code string or file path you want to convert from elixir to javascript. Below is an example of using a code string and turning it into JavaScript
    
    ```bash
    $ ex2js ":atom" -ex
    Kernel.SpecialForms.atom('atom')
    ```
    
    The ex2js escript changed the elixir code, `:atom` into the JavaScript code `Kernel.SpecialForms.atom('atom')`. The `-ex` parameter lets the script know that the input is an Elixir code string instead of a file.
    
    What if we wanted to give it a file? You would simply do the following:
    
    ```bash
    $ ex2js "example.exjs"
    Kernel.SpecialForms.atom('atom')
    ```
    
    What you will have noticed by now is that it has output everything we've done so far to the terminal. What about if we want to place the output to a path? The next example takes a file as input and outputs the result in another directory.
    
    ```bash
    $ ex2js "example.exjs" -o "dist"
    ```
    
    If you look in the dist folder, you should see example.js as well as elixir.js. elixir.js is the JavaScript file that contains the Elixir Standard library. In example.js, the first line should be an import statement importing elixir.js for use.
    
    wildcards are also accepted:
    
    ```bash
    $ ex2js "src/**/*.exjs" -o "dist"
    ```
    
    The last option we will show is the root option. This option is for defining a root path for the import statements. By default your import statement will not have anything prepended to it. For example, the elixir import will look like this:
    
    ```javascript
    import * as Elixir from 'elixir';
    ```
    
    If we wanted to prepend "js" to the root, we can like this:
    
    ```
    $ ex2js "example.ex" -o "dist" -r "js"
    ```
    
    Now the import will look like this:
    
    ```javascript
    import * as Elixir from 'js/elixir';
    ```
    
    That concludes the walkthrough on options, as well as the walkthrough on using the ex2js escript.
    
### mix ex2js

* Step 1: Get dependency
    
    The first step is getting the dependency. In your mix.exs file for your elixir project, add elixir_script to your deps.

    ```elixir
    {:elixir_script, "~> 0.12"}
    ```
    
* Step 2: Now download the dep
    
    ```bash
    $ mix deps.get
    ```
    
    Now you should have the mix task, ex2js.
   
* Step 3: Use
    ```bash
    $ mix ex2js "example.ex" -o "dist" -r "js"
    ```
    
    What you will notice is that the parameters are exactly the same as the escript.
    
### ElixirScript module
* Step 1: Get dependency
    
    The first step is getting the dependency. In your mix.exs file for your elixir project, add elixir_script to your deps.

    ```elixir
    {:elixir_script, "~> 0.12"}
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
    
     * `:root` - a binary path prepended to the path of the standard lib imports if needed
    * `:env` - a Macro.env struct to use. This is most useful when using macros. Make sure that the  given env has the macros required. Defaults to `__ENV__`.
    
    You may notice the mention of macros. Using the module in your code allows you to use macros. As long as you pass in an evironment with the macros loaded. By default, it uses the current environment.

    For example, if I have a module with a macro in it
    
    ```elixir
    defmodule ElixirScript.Math do
      defmacro squared(x) do
        quote do
          unquote(x) * unquote(x)
        end
      end
    end
    ```
    
    If I create a custom env I can pass it to the compile functions:
    
    ```elixir
      def make_custom_env do
        require Logger
        require ElixirScript.Math
    
        __ENV__
      end
      
    ElixirScript.compile("ElixirScript.Math.squared(2)", [env: make_custom_env])
    
    #Should return ["2 * 2"]
    ```
    
    

### Appendix

#### Using JavaScript Modules

You can use `alias`, `import`, and `require` as you would in Elixir (sans macros).

For JavaScript modules, use `JS.import`

```elixir
JS.import A, "a" #translates to "import {default as A} from 'a'"

JS.import [A, B, C], "a" #translates to "import {A, B, C} from 'a'"
```

#### Gulp

I am a gulp user and I use elixirscript with gulp. Here is a snippet of how I my gulpfile looks
    
        ```javascript
        var gulp = require('gulp');
        var exec = require('child_process').exec;
        var babel = require('gulp-babel');
        
        //Calls out to the escript and places the output in src/js
        gulp.task('build-exjs', function(cb) {
          exec('/usr/local/ex2js/bin/ex2js "' + exjsSrc + '" -o ' + "src/js", function (err, stdout, stderr) {
            cb(err);
          });
        });
        
        gulp.task('build-js', ['build-exjs'], function() {
          return gulp.src(jsSrc)
              .pipe(babel({modules: 'system'}))
              .pipe(gulp.dest(jsDest));
        });
        ```
        
This is also the setup I use when using ElixirScript with Phoenix. If you are a brunch user, there is n [ElixirScript runch plugin](https://www.npmjs.com/package/elixirscript-brunch)