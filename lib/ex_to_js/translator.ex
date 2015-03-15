defmodule ExToJS.Translator do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator.Primative
  alias ExToJS.Translator.PatternMatching
  alias ExToJS.Translator.Data
  alias ExToJS.Translator.Function
  alias ExToJS.Translator.Expression
  alias ExToJS.Translator.Import
  alias ExToJS.Translator.Control
  alias ExToJS.Translator.Module

  @doc """
  Translates Elixir AST to JavaScript AST
  """
  def translate(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Primative.make_literal(ast)
  end

  def translate(ast) when is_atom(ast) do
    Primative.make_symbol(ast)
  end

  def translate(ast) when is_list(ast) do
    Primative.make_array(ast)
  end

  def translate({ one, two }) do
    Primative.make_tuple({one, two})
  end

  def translate({:%{}, _, properties}) do
    Data.make_object(properties)
  end

  def translate({{:., [], [module_name, function_name]}, [], params }) do
    Function.make_function_call(module_name, function_name, params)
  end

  def translate({:__aliases__, _, aliases}) do
    Primative.make_identifier(aliases)
  end

  def translate({:__block__, _, expressions }) do
    Control.make_block(expressions)
  end

  def translate({:import, _, [{:__aliases__, _, module_name_list}]}) do
    Import.make_import(module_name_list)
  end

  def translate({:import, _, [{:__aliases__, _, module_name_list}, [only: function_list] ]}) do
    Import.make_import(module_name_list, function_list)
  end

  def translate({:alias, _, alias_info}) do
    Import.make_alias_import(alias_info)
  end

  def translate({:case, _, [condition, [do: clauses]]}) do
    Control.make_case(condition, clauses)
  end

  def translate({:cond, _, [[do: clauses]]}) do
    Control.make_cond(clauses)
  end

  def translate({:for, _, generators}) do
    Control.make_for(generators)
  end

  def translate({:fn, _, [{:->, _, [params, body]}]}) do
    Function.make_anonymous_function(params, body)
  end

  def translate({:{}, _, elements}) do
    Primative.make_tuple(elements)
  end

  def translate({:-, _, [number]}) when is_number(number) do
    Expression.make_negative_number(number)
  end

  def translate({:=, _, [left, right]}) do
    PatternMatching.make_assignment(left, right)
  end

  def translate({:<>, _, [left, right]}) do
    Expression.make_binary_expression(:+, left, right)
  end

  def translate({operator, _, [left, right]}) when operator in [:+, :-, :/, :*, :==, :!=] do
    Expression.make_binary_expression(operator, left, right)
  end

  def translate({:def, _, [{name, _, params}, [do: body]]}) do
    Function.make_export_function(name, params, body)
  end

  def translate({:defp, _, [{name, _, params}, [do: body]]}) do
    Function.make_function(name, params, body)
  end

  def translate({:defstruct, _, attributes}) do
    Data.make_struct(attributes)
  end

  def translate({:if, _, [test, blocks]}) do
    Control.make_if(test, blocks)
  end

  def translate({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]}) do
    Module.make_module(module_name_list, body)
  end

  def translate({name, _, params}) when is_list(params) do
    Function.make_function_call(name, params)
  end

  def translate({name, _, _}) do
    Primative.make_identifier(name)
  end

end