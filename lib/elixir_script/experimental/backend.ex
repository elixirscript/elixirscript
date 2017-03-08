defmodule ElixirScript.Experimental.Backend do
  alias ElixirScript.Experimental.Module
  alias ESTree.Tools.Generator

  def compile(line, file, module, attrs, defs, unreachable, opts) do

    # Print all arguments
    IO.inspect binding()

    # Compile module to JavaScript AST
    js_ast = Module.compile(line, file, module, attrs, defs, unreachable, opts)

    # Generate JavaScript code string
    js_code = Generator.generate(js_ast)

    IO.puts js_code

    write_js(module, js_code)

    # Invoke the default backend - it returns the compiled beam binary
    :elixir_erl.compile(line, file, module, attrs, defs, unreachable, opts)
  end

  defp write_js(module, js_code) do
    output_dir = Path.join([Mix.Project.build_path(), "_javascript"])

    if !File.exists?(output_dir) do
      File.mkdir_p!(output_dir)
    end

    output_path = Path.join([output_dir, "#{module}.js"])
    File.write!(output_path, js_code)
  end
end
