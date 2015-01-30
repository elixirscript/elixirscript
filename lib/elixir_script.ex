defmodule ElixirScript do

  def parse(nil) do
    "null"
  end

  def parse(ast) when is_number(ast) do
    "#{ast}"
  end

  def parse(ast) when is_binary(ast) do
    "\"#{ast}\""
  end

  def parse(ast) when is_atom(ast) do
    atom_string = Atom.to_string(ast)
    "Symbol(\"#{atom_string}\")"
  end

  def parse(ast) when is_list(ast) do
    array_items = Enum.map(ast, fn(x) -> parse(x) end)
    |> Enum.join(",")

    "[#{array_items}]"
  end

  def parse({:%{}, [], fields}) do
    field_items = Enum.map(fields, fn({x, y}) ->  "#{x}:#{parse(y)}" end)
    |> Enum.join(",")

    "{#{field_items}}"
  end

  def parse({param_name, [], Elixir}) do
    "#{param_name}"
  end

  def parse({:=, [], [{variable_name, [], Elixir}, value]}) do
    "var #{variable_name} = #{parse(value)};"
  end

  def parse({:def, _, [{def_name, _, params}, [do: do_block]]}) do
    js_params = Enum.map(params, fn(x) -> parse(x) end)

    block = if do_block == nil do
      ""
    else
      parse(do_block)
    end

    "function #{def_name}(#{Enum.join(js_params, ",")}){#{block}}"
  end

  def parse(ast) when is_tuple(ast) do
    Tuple.to_list(ast) |> parse
  end
end
