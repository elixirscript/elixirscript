defmodule ElixirScript.Translator.Call do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Identifier

  def make_module_name(module_name, env) do
    members = ["Elixir"] ++ Module.split(module_name)
    { Identifier.make_namespace_members(members), env }
  end

  def make_extern_module_name(module_name, env) do
    members = Module.split(module_name)
    { Identifier.make_namespace_members(members), env }
  end

  def make_local_function_call({fun, _, nil}, params, env) do
    ast = JS.call_expression(
      Identifier.make_identifier(fun),
      Enum.map(params, &Translator.translate!(&1, env))
     )

    {ast, env}
  end  

  def make_local_function_call(function_name, params, env) do
    ast = JS.call_expression(
      Identifier.make_identifier(function_name),
      Enum.map(params, &Translator.translate!(&1, env))
     )

    {ast, env}
  end

  def make_module_function_call(module_name, function_name, params, env) do
    members = ["Elixir"] ++ Module.split(module_name) ++ ["__load"]

    ast = JS.call_expression(
      JS.member_expression(
        JS.call_expression(
          Identifier.make_namespace_members(members),
          [JS.identifier("Elixir")]
        ),
        Identifier.make_identifier(function_name)        
      ),
      Enum.map(params, &Translator.translate!(&1, env))
     )

    {ast, env}
  end

  def make_module_function_call(module_name, function_name, env) do
    make_module_function_call(module_name, function_name, [], env)
  end 

  def make_extern_function_or_property_call(module_name, function_name, env) do
    members = Module.split(module_name)
    Identifier.make_namespace_members(members)

    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Identifier.make_namespace_members(members),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    {js_ast, env}
  end

  def make_extern_function_call(module_name, function_name, params, env) do
    members = Module.split(module_name) ++ [to_string(function_name)]

    ast = JS.call_expression(
      Identifier.make_namespace_members(members),
      Enum.map(params, &Translator.translate!(&1, env))
     )

    {ast, env}
  end 

  def make_function_or_property_call(module_name, function_name, env) do
    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Translator.translate!(module_name),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    { js_ast, env }
  end


  def get_module_name_for_function(module_name, env) do
    case module_name do
      {:__aliases__, _, name} ->
        module_name = Utils.quoted_to_name(name)
        get_js_name(module_name, env)
      {name, _, _} when is_atom(name) ->
        get_js_name(name, env)
      {{:., _, [_, _]}, _, _ } = ast ->
        ast
      {{:., _, [{:__aliases__, _, _}]}, _, _} = ast ->
        ast
      ast when is_list(ast) ->
        ast
      name ->
        get_js_name(name, env)
    end
  end

  def make_function_call(module_name, function_name, [], env) when is_atom(module_name) and is_atom(function_name) do
    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Identifier.make_identifier(module_name),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    {js_ast, env}  
  end

  def make_function_call(module_name, function_name, params, env) when is_atom(module_name) and is_atom(function_name) do
    js_ast = JS.call_expression(
       JS.member_expression(
        Identifier.make_identifier(module_name),
        Identifier.make_identifier(function_name)    
       ),
       Enum.map(params, &Translator.translate!(&1, env))
    )

    {js_ast, env}  
  end

  def make_function_call({{:., _, _}, _, _} = module_name, function_name, [], env) do
    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Translator.translate!(module_name, env),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    {js_ast, env}  
  end

  def make_function_call({{:., _, _}, _, _} = module_name, function_name, params, env) do
     js_ast = JS.call_expression(
       JS.member_expression(
        Translator.translate!(module_name, env),
        Identifier.make_identifier(function_name)    
       ),
       Enum.map(params, &Translator.translate!(&1, env))
    )

    {js_ast, env}   
  end

  def make_function_call(module_name, function_name, [], env) do
    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        Translator.translate!(module_name, env),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    {js_ast, env}
  end  

  def make_function_call(module_name, function_name, params, env) do
    call = JS.call_expression(
      JS.member_expression(
        Translator.translate!(module_name, env),
        Identifier.make_identifier(function_name)
      ),
      Enum.map(params, &Translator.translate!(&1, env))
    )

    { call, env }
  end

  def get_js_name([Elixir | _] = list, _) do
    list
  end

  def get_js_name({:__aliases__, _, _} = name, env) do
    Utils.quoted_to_name(name)
    |> get_js_name(env)
  end

  def get_js_name(module_name, env) when is_list(module_name) do
    Utils.quoted_to_name({:__aliases__, [], module_name})
    |> get_js_name(env)
  end

  def get_js_name(module_name, env) do

    cond do
      module_name in env.requires ->
        Utils.name_to_js_name(module_name)

      module_name in ElixirScript.Translator.State.list_module_names(env.state) ->
        ElixirScript.Translator.State.add_module_reference(env.state, env.module, module_name)
        Utils.name_to_js_name(module_name)

      true ->
        case Atom.to_string(module_name) do
          "Elixir." <> _ ->
            {:__aliases__, _, name } = Utils.name_to_quoted(module_name)
            name
          _ ->
            module_name
        end
    end
  end

  defp make_member_expression(module_name, function_name, env, computed \\ false) do
    case module_name do
      modules when is_list(modules) and length(modules) > 1 ->
        ast = make_module_expression_tree(modules, computed, env)
        JS.member_expression(
          ast,
          Identifier.make_identifier(function_name),
          computed
        )
      modules when is_list(modules) and length(modules) == 1 ->
        JS.member_expression(
          Identifier.make_identifier(hd(modules)),
          Identifier.make_identifier(function_name),
          computed
        )
      {{:., _, [_module_name, _function_name]}, _, _params } = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          Identifier.make_identifier(function_name),
          computed
        )
      {{:., _, [{:__aliases__, _, _}]}, _, _} = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          Identifier.make_identifier(function_name),
          computed
        )
      {:., _, _} = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          Identifier.make_identifier(function_name),
          computed
        )
      _ ->
        JS.member_expression(
          Identifier.make_identifier(module_name),
          Identifier.make_identifier(function_name),
          computed
        )
    end
  end

  defp make_module_expression_tree([module], computed, env) do
    make_module_expression_tree(module, computed, env)
  end

  defp make_module_expression_tree(modules, computed, _) when is_list(modules) do
    Enum.reduce(modules, nil, fn(x, ast) ->
      case ast do
        nil ->
          JS.member_expression(Identifier.make_identifier(x), nil, computed)
        %ESTree.MemberExpression{ property: nil } ->
          %{ ast | property: Identifier.make_identifier(x) }
        _ ->
          JS.member_expression(ast, Identifier.make_identifier(x), computed)
      end
    end)
  end

  defp make_module_expression_tree(module, _, _) when is_binary(module) or is_atom(module) do
    Identifier.make_identifier(module)
  end

  defp make_module_expression_tree(module, _, env) do
    Translator.translate!(module, env)
  end
end
