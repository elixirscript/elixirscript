defmodule Helpers do
  @moduledoc false

  def call_compiled_function(module, func, args \\ []) when is_list(args) do
    File.mkdir "tmp"
    filename = Macro.underscore(inspect(module) <> "_" <> to_string(func))
    path = Path.join("tmp", filename <> ".mjs")

    ElixirScript.Compiler.compile(module, [output: path])

    args_to_js = args
    |> Enum.map(&ElixirScript.TermConverter.encode/1)
    |> Enum.join(",")

    main = """
    import ElixirScript from './ElixirScript.Core.js';
    import Elixir from './#{filename}.mjs';

    const mod = Elixir.#{inspect module}.__load(Elixir)
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

    main_path = Path.join("tmp", filename <> ".main.mjs")
    File.write!(main_path, main)

    {out, _a} = System.cmd "node", ["-r", "@std/esm", main_path]

    out
    |> Poison.decode!
    |> ElixirScript.TermConverter.decode
  end
end
