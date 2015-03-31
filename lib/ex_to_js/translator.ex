defmodule ExToJS.Translator do
  require Logger
  alias ExToJS.Translator.Primative
  alias ExToJS.Translator.PatternMatching
  alias ExToJS.Translator.Data
  alias ExToJS.Translator.Function
  alias ExToJS.Translator.Expression
  alias ExToJS.Translator.Import
  alias ExToJS.Translator.Control
  alias ExToJS.Translator.Module
  alias ExToJS.Translator.Kernel, as: ExKernel

  @doc """
  Translates Elixir AST to JavaScript AST
  """
  def translate(ast) do
    js_ast = do_translate(ast)
    #Logger.debug "Elixir AST: #{inspect ast}, JavaScript AST: #{inspect js_ast}"
    js_ast
  end

  def do_translate(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Primative.make_literal(ast)
  end

  def do_translate(ast) when is_atom(ast) do
    Primative.make_symbol(ast)
  end

  def do_translate(ast) when is_list(ast) do
    Primative.make_array(ast)
  end

  def do_translate({ one, two }) do
    Primative.make_tuple({one, two})
  end

  def do_translate({:%, _, [alias_info, data]}) do
    {_, _, name} = alias_info
    {_, _, data} = data
    Data.make_struct(name, data)
  end

  def do_translate({:%{}, _, properties}) do
    Data.make_object(properties)
  end

  def do_translate({:<<>>, _, elements} = bitstring) do
    Primative.make_array(elements)
  end

  def do_translate({:in, _, [left, right]}) do
    ExKernel.make_in(left, right)
  end

  def do_translate({{:., _, [module_name, function_name]}, _, params }) do
    Function.make_function_call(module_name, function_name, params)
  end

  def do_translate({:__aliases__, _, aliases}) do
    Primative.make_identifier(aliases)
  end

  def do_translate({:__block__, _, expressions }) do
    Control.make_block(expressions)
  end

  def do_translate({:import, _, [{:__aliases__, _, module_name_list}]}) do
    Import.make_import(module_name_list)
  end

  def do_translate({:import, _, [{:__aliases__, _, module_name_list}, [only: function_list] ]}) do
    Import.make_import(module_name_list, function_list)
  end

  def do_translate({:alias, _, alias_info}) do
    Import.make_alias_import(alias_info)
  end

  def do_translate({:require, _, [{:__aliases__, _, module_name_list}]}) do
    Import.make_default_import(module_name_list)
  end

  def do_translate({:case, _, [condition, [do: clauses]]}) do
    Control.make_case(condition, clauses)
  end

  def do_translate({:cond, _, [[do: clauses]]}) do
    Control.make_cond(clauses)
  end

  def do_translate({:for, _, generators}) do
    Control.make_for(generators)
  end

  def do_translate({:fn, _, [{:->, _, [params, body]}]}) do
    Function.make_anonymous_function(params, body)
  end

  def do_translate({:{}, _, elements}) do
    Primative.make_tuple(elements)
  end

  def do_translate({:-, _, [number]}) when is_number(number) do
    Expression.make_negative_number(number)
  end

  def do_translate({:=, _, [left, right]}) do
    PatternMatching.bind(left, right)
  end

  def do_translate({:<>, _, [left, right]}) do
    Expression.make_binary_expression(:+, left, right)
  end

  def do_translate({operator, _, [left, right]}) when operator in [:+, :-, :/, :*, :==, :!=] do
    Expression.make_binary_expression(operator, left, right)
  end

  def do_translate({:def, _, [{name, _, params}, [do: body]]}) do
    Function.make_export_function(name, params, body)
  end

  def do_translate({:defp, _, [{name, _, params}, [do: body]]}) do
    Function.make_function(name, params, body)
  end

  def do_translate({:defstruct, _, attributes}) do
    Data.make_defstruct(attributes)
  end

  def do_translate({:if, _, [test, blocks]} = ast) do
    Control.make_if(test, blocks)
  end

  def do_translate({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]}) do
    Module.make_module(module_name_list, body)
  end

  def do_translate({name, _, params}) when is_list(params) do
    Function.make_function_call(name, params)
  end

  def do_translate({name, _, _}) do
    Primative.make_identifier(name)
  end

end