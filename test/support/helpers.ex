defmodule Helpers do
  @moduledoc false

  def call_compiled_function(module, func, args \\ []) when is_list(args) do
    File.mkdir "tmp"
    ElixirScript.Compiler.compile(module, [output: "tmp"])

    args_to_js = args
    |> Enum.map(&ElixirScript.TermConverter.encode/1)
    |> Enum.join(",")

    main = """
    import ElixirScript from './ElixirScript.Core.js';
    import mod from './Elixir.#{inspect module}.js';
    const ret = mod.#{func}(#{args_to_js})

    const jsonRet = JSON.stringify(ret, (name, value) => {
      if(typeof value === 'symbol') {
         value = `@@@${Symbol.keyFor(value)}`
      }

      if(value instanceof Map) {
        value = {__type__: "map", values: Array.from(value.entries())}
      }

      return value
    })

    process.stdout.write(jsonRet)
    """

    main_path = Path.join("tmp", "Elixir.#{inspect module}.main.mjs")
    File.write!(main_path, main)

    {out, _a} = System.cmd "node", ["-r", "@std/esm", main_path]

    out
    |> Poison.decode!
    |> ElixirScript.TermConverter.decode
  end
end
