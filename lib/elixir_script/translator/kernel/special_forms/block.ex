defmodule ElixirScript.Translator.Block do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  def make_block(expressions, env) do
    { list, env } = Enum.map_reduce(expressions, env, fn(x, updated_env) ->
      {item, updated_env } = Translator.translate(x, updated_env)
      {process_call(item), updated_env}
    end)

    { JS.block_statement(list), env }
  end

  defp process_call(item) do
   case item do
     %ESTree.CallExpression{ callee: %ESTree.MemberExpression{ object: %ESTree.Identifier{ name: :Object }, property: %ESTree.Identifier{ name: :freeze }} } ->
       item
     %ESTree.CallExpression{ callee: %ESTree.MemberExpression{ object: %ESTree.Identifier{ name: "Symbol" }, property: %ESTree.Identifier{ name: "for" }} } ->
       item
     %ESTree.CallExpression{}->
       JS.yield_expression(item, true)
     %ESTree.BinaryExpression{ left: %ESTree.CallExpression{} }->
       JS.yield_expression(item, true)
     %ESTree.BinaryExpression{ right: %ESTree.CallExpression{} }->
       JS.yield_expression(item, true)
     _ ->
       item
   end
  end

end
