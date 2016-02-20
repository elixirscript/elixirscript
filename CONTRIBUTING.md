# Contributing to ElixirScript

This contributing guide is based on the contributing for Elixir with changes suitable for this project.

## Using the issue tracker

Use the issues tracker for:

* [bug reports](#bug-reports)
* [submitting pull requests](#pull-requests)
* [feature requests](#feature-requests)

## Bug reports

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; [check if the issue has already been
   reported](https://github.com/bryanjos/elixirscript/search?type=Issues).

2. **Check if the issue has been fixed** &mdash; try to reproduce it using the
   `master` branch in the repository.

3. **Isolate and report the problem** &mdash; ideally create a reduced test
   case.

Please try to be as detailed as possible in your report. Please provide steps to
reproduce the issue as well as the outcome you were expecting! All these details
will help developers to fix any potential bugs.

Example:

> Short and descriptive example bug report title
>
> A summary of the issue and the environment in which it occurs. If suitable,
> include the steps required to reproduce the bug.
>
> 1. This is the first step
> 2. This is the second step
> 3. Further steps, etc.
>
> `<url>` - a link to the reduced test case (e.g. a GitHub Gist)
>
> Any other information you want to share that is relevant to the issue being
> reported. This might include the lines of code that you have identified as
> causing the bug, and potential solutions (and your opinions on their
> merits).

## Feature requests

Feature requests are welcome. But take a moment to find
out whether your idea fits with the scope and aims of the project. It's up to *you*
to make a strong case to convince the community of the merits of this feature.
Please provide as much detail and context as possible.

## Contributing

Contributions to ElixirScript are welcomed! These contributions can be
in the form or code changes, documentation, or ideas of how to implement features
found in Elixir in ElixirScript.

ElixirScript is broken up into the following parts:

* The compiler, written in Elixir
* The standard library modules, mostly written in Elixir
* The javascript core

The ElixirScript compiler is in the `lib` folder of the project. 
Here is where Elixir code is converted into JavaScript.

The standard library modules are in the `lib/elixir_script/prelude` folder.

The JavaScript code is in the `src/javascript`. 
This is where features such as pattern matching and the standard library are implemented.

Please look at [this issue](https://github.com/bryanjos/elixirscript/issues/143) for information on how to add modules to the standard library.

The ElixirScript tests can be run using `mix test`

The JavaScript tests can be run using `npm test`

Please make sure all tests pass after making changes. Also make sure to include tests for
the changes you made.

Contributing to the JavaScript code may be the easiest and most rewarding changes.
Don't see a feature, module or function from Elixir in ElixirScript yet? You can implement it
in the JavaScript code.

## Pull requests

Good pull requests - patches, improvements, new features - are a fantastic
help. They should remain focused in scope and avoid containing unrelated
commits.

**NOTE**: Do not send code style changes as pull requests like changing
the indentation of some particular code snippet or how a function is called.
Those will not be accepted as they pollute the repository history with non
functional changes and are often based on personal preferences.

**IMPORTANT**: By submitting a patch, you agree that your work will be
licensed under the license used by the project.

If you have any large pull request in mind (e.g. implementing features,
refactoring code, etc), **please ask first** otherwise you risk spending
a lot of time working on something that the project's developers might
not want to merge into the project.

Please adhere to the coding conventions in the project (indentation,
accurate comments, etc.) and don't forget to add your own tests and
documentation. When working with Git, we recommend the following process
in order to craft an excellent pull request:

1. [Fork](https://help.github.com/fork-a-repo/) the project, clone your fork,
  and configure the remotes:

  ```sh
  # Clone your fork of the repo into the current directory
  git clone https://github.com/<your-username>/elixirscript
  # Navigate to the newly cloned directory
  cd elixirscript
  # Assign the original repo to a remote called "upstream"
  git remote add upstream https://github.com/bryanjos/elixirscript
  ```

2. If you cloned a while ago, get the latest changes from upstream:

  ```sh
  git checkout master
  git pull upstream master
  ```

3. Create a new topic branch (off of `master`) to contain your feature, change,
  or fix.

  **IMPORTANT**: Making changes in `master` is discouraged. You should always
  keep your local `master` in sync with upstream `master` and make your
  changes in topic branches.

  ```sh
  git checkout -b <topic-branch-name>
  ```

4. Commit your changes in logical chunks. Keep your commit messages organized,
  with a short description in the first line and more detailed information on
  the following lines. Feel free to use Git's
  [interactive rebase](https://help.github.com/articles/interactive-rebase)
  feature to tidy up your commits before making them public.

5. Make sure all the tests are still passing.

  ```sh
  mix test
  gulp test
  ```

  This is needed to ensure your changes can
  pass all the tests.

6. Push your topic branch up to your fork:

  ```sh
  git push origin <topic-branch-name>
  ```

7. [Open a Pull Request](https://help.github.com/articles/using-pull-requests/)
  with a clear title and description.

8. If you haven't updated your pull request for a while, you should consider
  rebasing on master and resolving any conflicts.

  **IMPORTANT**: _Never ever_ merge upstream `master` into your branches. You
  should always `git rebase` on `master` to bring your changes up to date when
  necessary.

  ```sh
  git checkout master
  git pull upstream master
  git checkout <your-topic-branch>
  git rebase master
  ```

Thank you for your contributions!
