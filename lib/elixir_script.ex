defmodule ElixirScript do
  require Logger

  @moduledoc """
  Translates Elixir into JavaScript.

  All compile functions return a list of
  transpiled javascript code or a tuple consisting of
  the file name for the code and the transpiled javascript code.

  All compile functions also take an optional opts parameter
  that controls transpiler output.

  Available options are:
  * `:include_path` - a boolean controlling whether to return just the JavaScript code
  or a tuple of the file name and the JavaScript code
  * `:core_path` - The es6 import path used to import the elixirscript core.
  When using this option, the Elixir.js file is not exported
  * `:full_build` - For compile_path, tells the compiler to perform a full build instead of incremental one
  * `:output` - option to tell compiler how to output data
      * `nil`: Return as list
      * `:stdout`: Write to standard out
      * `path (string)`: Write to specified path
  """

  defmacro __using__(_) do
    quote do
      import Kernel, except: [
        if: 2, unless: 2, abs: 1, apply: 2, apply: 3, binary_part: 3, hd: 1,
        tl: 1, is_atom: 1, is_binary: 1, is_bitstring: 1, is_boolean: 1, is_float: 1,
        is_function: 1, is_function: 2, is_integer: 1, is_list: 1, is_number: 1,
        is_pid: 1, is_tuple: 1, is_map: 1, is_port: 1, is_reference: 1, length: 1,
        map_size: 1, max: 2, min: 2, round: 1, trunc: 1, tuple_size: 1, elem: 2, is_nil: 1,
        make_ref: 1, spawn: 1, spawn: 3, spawn_link: 1, spawn_link: 3, spawn_monitor: 1,
        spawn_monitor: 3, send: 2, self: 0, match?: 2, to_string: 1, "|>": 2, in: 2, "..": 2,
        sigil_r: 2
      ]
      import ElixirScript.Kernel
      require JS
    end
  end

  # This is the serialized state of the ElixirScript.State module containing references to the standard library
  @lib_path Application.get_env(:elixir_script, :lib_path)
  @version  Mix.Project.config[:version]

  @doc """
  Compiles the given Elixir code string
  """
  @spec compile(binary, Map.t) :: [binary | {binary, binary} | :ok]
  def compile(elixir_code, opts \\ %{}) do
    elixir_code
    |> List.wrap
    |> Enum.map(fn(x) ->
      x
      |> Code.string_to_quoted!
      |> compile_quoted(opts)
    end)
    |> List.flatten
  end

  @doc """
  Compiles the given Elixir code in quoted form
  """
  @spec compile_quoted(Macro.t, Map.t) :: [binary | {binary, binary} | :ok]
  def compile_quoted(quoted, opts \\ %{}) do

    opts = build_compiler_options(Map.merge(opts, %{import_standard_libs: false}))

    data = quoted
    |> get_modules_from_quoted
    |> Enum.map(fn(x) -> %{ast: x, app: :app} end)

    std_lib_quoted = get_quoted_std_lib()

    %{data: std_lib_quoted ++ data}
    |> ElixirScript.Passes.Init.execute(opts)
    |> ElixirScript.Passes.FindModules.execute(opts)
    |> ElixirScript.Passes.FindLoadOnly.execute(opts)
    |> ElixirScript.Passes.FindFunctions.execute(opts)
    |> ElixirScript.Passes.JavaScriptAST.execute(opts)
    |> ElixirScript.Passes.ConsolidateProtocols.execute(opts)
    |> ElixirScript.Passes.CreateJSModules.execute(opts)
    |> ElixirScript.Passes.JavaScriptCode.execute(opts)
    |> ElixirScript.Passes.HandleOutput.execute(opts)
  end

  defp get_quoted_std_lib() do
    files = [get_std_lib_path(), "**", "*.ex"]
    |> Path.join
    |> Path.wildcard

    files
    |> Enum.map(fn path -> File.read!(path) end)
    |> Enum.map(&Code.string_to_quoted!(&1))
    |> Enum.flat_map(&get_modules_from_quoted(&1))
    |> Enum.map(fn(x) -> %{ast: x, app: :elixir} end)
  end

  defp get_modules_from_quoted(quoted) do
    results = case quoted do
                {:__block__, _, list} ->
                  {modules, not_modules} = Enum.partition(list,
                                                fn
                                                  {type, _, _ } when type in [:defprotocol, :defimpl, :defmodule] ->
                                                    true
                                                  _ ->
                                                    false
                                                end)

                  temp_module = case not_modules do
                                  [] ->
                                    []
                                  _ ->
                                    [{:defmodule, [], [{:__aliases__, [], [:ElixirScript, :Temp]}, [do: { :__block__, [], not_modules }]]}]
                                end

                  modules ++ temp_module

                {type, _, _ } = x when type in [:defprotocol, :defimpl, :defmodule] ->
                  x
                x ->
                  {:defmodule, [], [{:__aliases__, [], [:ElixirScript, :Temp]}, [do: { :__block__, [], [x] }]]}
              end

    List.wrap(results)
  end

  @doc """
  Compiles the elixir files found at the given path
  """
  @spec compile_path(binary | [binary] | map, Map.t) :: [binary | {binary, binary} | :ok]
  def compile_path(path, opts \\ %{})

  def compile_path(path, opts) when is_binary(path) do
    compile_path([path], opts)
  end

  def compile_path(path, opts) when is_list(path) do
    built_opts = build_compiler_options(opts)

    app_name = cond do
      !is_nil(built_opts[:app]) ->
        built_opts[:app]
      Code.ensure_loaded?(Mix) ->
        Mix.Project.config()[:app]
      true ->
        :app
    end

    compile_path(Map.put(%{}, app_name, path), opts)
  end

  def compile_path(path, opts) do
    opts = build_compiler_options(opts)

    deps = path
    |> Map.to_list
    |> Enum.map(fn {app, path} -> {app, List.wrap(path)} end)

    deps = [{:elixir, List.wrap(get_std_lib_path())}] ++ deps

    result = %{data: deps}
    |> ElixirScript.Passes.Init.execute(opts)
    |> ElixirScript.Passes.ASTFromFile.execute(opts)
    |> ElixirScript.Passes.LoadModules.execute(opts)
    |> ElixirScript.Passes.FindModules.execute(opts)
    |> ElixirScript.Passes.FindLoadOnly.execute(opts)
    |> ElixirScript.Passes.FindFunctions.execute(opts)
    |> ElixirScript.Passes.JavaScriptAST.execute(opts)
    |> ElixirScript.Passes.ConsolidateProtocols.execute(opts)
    |> ElixirScript.Passes.CreateJSModules.execute(opts)
    |> ElixirScript.Passes.JavaScriptCode.execute(opts)
    |> ElixirScript.Passes.HandleOutput.execute(opts)

    result
  end

  defp build_compiler_options(opts) do
    default_options = Map.new
    |> Map.put(:include_path, false)
    |> Map.put(:root, nil)
    |> Map.put(:env, __ENV__)
    |> Map.put(:import_standard_libs, true)
    |> Map.put(:core_path, "Elixir.Bootstrap")
    |> Map.put(:full_build, false)
    |> Map.put(:output, nil)
    |> Map.put(:app, :app)
    |> Map.put(:format, :es)
    |> Map.put(:js_modules, [])

    options = Map.merge(default_options, opts)
    Map.put(options, :module_formatter, get_module_formatter(options[:format]))
  end

  defp get_module_formatter(:umd) do
    ElixirScript.ModuleSystems.UMD
  end

  defp get_module_formatter(:common) do
    ElixirScript.ModuleSystems.Common
  end

  defp get_module_formatter(_) do
    ElixirScript.ModuleSystems.ES
  end

  @doc """
  Copies the javascript that makes up the ElixirScript bootstrap
  to the specified location
  """
  def copy_bootstrap_to_destination(module_format, destination) do
    path = Path.join([operating_path, to_string(module_format), "elixir", "Elixir.Bootstrap.js"])
    base = Path.basename(path)
    File.mkdir_p!(destination)
    File.cp!(path, Path.join([destination, base]))
  end

  #Gets path to js files whether the mix project is available
  #or when used as an escript
  defp operating_path() do
    case @lib_path do
      nil ->
        if Code.ensure_loaded?(Mix.Project) do
          Path.join([Mix.Project.build_path, "lib", "elixir_script", "priv"])
        else
          split_path = Path.split(Application.app_dir(:elixirscript))
          replaced_path = List.delete_at(split_path, length(split_path) - 1)
          replaced_path = List.delete_at(replaced_path, length(replaced_path) - 1)
          Path.join(replaced_path)
        end
      lib_path ->
        lib_path
    end
  end

  defp get_std_lib_path() do
    Path.join([operating_path(), "std_lib"])
  end

end
