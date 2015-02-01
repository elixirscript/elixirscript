defmodule ElixirScript.SpiderMonkey do
  alias ElixirScript.SpiderMonkey.Nodes
  
  def parse(nil) do
    Nodes.literal(nil)
  end

  def parse(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) do
    Nodes.literal(ast)
  end

  def parse(ast) when is_list(ast) do
    Nodes.array(ast)
  end

  def parse(ast) when is_atom(ast) do
    Nodes.symbol(ast)
  end

  def parse({param_name, _, Elixir}) do
    Nodes.indentifier(param_name)
  end

  def parse({:%{}, _, fields}) do
    Nodes.object(fields)
  end

  def parse({:=, _, [{ name, _, _ }, value ]}) do
    Nodes.variable(name, value)
  end

  def parse({ {:., [], [{:__aliases__, _, module_name}, function_name]}, [], params }) do
    Nodes.call(module_name, function_name, params)
  end

  def parse({operator, _, [left, right]}) when operator == :+ or operator == :- or operator == :/ or operator == :* do
    Nodes.binary(operator, left, right)
  end

  def parse({function, _, [{def_name, _, params}, [do: do_block]]}) when function == :def or function == :defp do
    Nodes.method(def_name, params, do_block)
  end

  def parse({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: do_block]]}) do
    Nodes.class(module_name_list, do_block) |> Nodes.export
  end

  def parse({:alias, _, [{:__aliases__, _, name}]}) do
    Nodes.import_declaration(name)
  end

  def parse({:fn, _, [{:->, _, [params, body]}]}) do
    Nodes.function(params, body)
  end

  def parse({ :__block__, _, expressions }) do
    Enum.map(expressions, &parse(&1))
  end

  def parse({function_name, _, params}) do
    Nodes.call(function_name, params)
  end

  def parse(ast) when is_tuple(ast) do
    Nodes.array(Tuple.to_list(ast))
  end
end