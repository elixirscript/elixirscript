defmodule Helpers do
  @moduledoc false

  def call_compiled_func(module, func, args \\ []) do
    bootstrap = ElixirScript.Compiler.compile(module, [format: :common])
    args_to_js = args
    |> Enum.map(&Poison.encode!(&1))
    |> Enum.join(",")
    code = """
      #{bootstrap};
      const mod = Elixir.#{inspect module}.__load(Elixir)
      const ret = mod.#{func}(#{args_to_js})
      process.stdout.write(JSON.stringify(ret))
    """
    bootstrap = ElixirScript.Compiler.compile(module, [format: :umd])
    html = """
      <html>
        <head>
          <script>#{bootstrap}</script>
          <script></script>
        </head>
      </html>
    """
    filename = Macro.underscore(inspect(module) <> "_" <> to_string func)
    File.mkdir "./tmp"
    File.write "./tmp/#{filename}.html", html
    {out, a} = System.cmd "node", ["-e", code]
    Poison.decode! out
  end
end