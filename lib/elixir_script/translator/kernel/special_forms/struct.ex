defmodule ElixirScript.Translator.Struct do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Identifier

  def get_struct_module_name(module_name, env) do
      ElixirScript.Translator.State.get_module_name(env.state, Utils.quoted_to_name(module_name))
  end

  def get_struct_class(module_name, env) do
    candiate_module_name = ElixirScript.Translator.State.get_module_name(env.state, Utils.quoted_to_name(module_name))

    if ElixirScript.Translator.LexicalScope.get_module_name(env, candiate_module_name) in ElixirScript.Translator.State.list_module_names(env.state) do
      name = ElixirScript.Translator.LexicalScope.get_module_name(env, candiate_module_name)
      ident = JS.identifier(Utils.name_to_js_name(name))
      ElixirScript.Translator.State.add_module_reference(env.state, env.module, name)

      members = ["Elixir"] ++ Module.split(name) ++ ["__load"]

      JS.member_expression(
        JS.call_expression(
          Identifier.make_namespace_members(members),
          [JS.identifier("Elixir")]
        ),
        ident
      )

    else
      Identifier.make_identifier(module_name)
    end
  end

  def new_struct(module_name, data, env) do
    JS.call_expression(
      JS.member_expression(
        get_struct_class(module_name, env),
        JS.identifier(:create)
      ),
      [Translator.translate!(data, env)]
    )
  end

  def make_defstruct(attributes, env) when length(attributes) == 1 do
    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    defaults = Enum.map(attributes, fn
      ({x, y}) ->
        Map.make_property(
          Translator.translate!(x, env),
          Translator.translate!(y, env)
        )
      (attribute) ->
        Map.make_property(
          Translator.translate!(attribute, env),
          Translator.translate!(nil, env)
        )
    end)
    |> JS.object_expression

    do_make_defstruct(:defstruct, defaults, env)
  end

  def make_defstruct(attributes, env) do
    defaults = Enum.map(attributes, fn(x) ->
      Map.make_property(
        Translator.translate!(x, env),
        Translator.translate!(nil, env)
      )
    end)
    |> JS.object_expression

    do_make_defstruct(:defstruct, defaults, env)
  end

  def make_defexception(attributes, env) when length(attributes) == 1 do
    exception_key_value = Map.make_property(Translator.translate!(:__exception__, env), Translator.translate!(true, env))

    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    defaults = [exception_key_value] ++ Enum.map(attributes, fn
      ({x, y}) ->
        Map.make_property(
          Translator.translate!(x, env),
          Translator.translate!(y, env)
        )
      (x) ->
        Map.make_property(
          Translator.translate!(x, env),
          Translator.translate!(nil, env)
        )
    end)
    |> JS.object_expression

    do_make_defstruct(:defexception, defaults, env)
  end

  def make_defexceptions(attributes, env) do
    exception_key_value = Map.make_property(Translator.translate!(:__exception__, env), Translator.translate!(true, env))

    defaults = [exception_key_value] ++ Enum.map(attributes, fn
      (x) ->
        Map.make_property(
          Translator.translate!(x, env),
          Translator.translate!(nil, env)
        )
    end)
    |> JS.object_expression

    do_make_defstruct(:defexception, defaults, env)
  end

  defp do_make_defstruct(name, defaults, env) do
    struct_name = Map.make_property(Translator.translate!(:__struct__, env), Translator.translate!({:__MODULE__, [], []}, env))

    defaults = %{ defaults | properties: [struct_name]  ++ defaults.properties }

    ref = JS.identifier(Utils.name_to_js_name(env.module))

    ref_declarator = JS.variable_declarator(
      ref,
      JS.call_expression(
        JS.member_expression(
          JS.member_expression(
            JS.identifier("Bootstrap"),
              JS.member_expression(
                JS.identifier("Core"),
                JS.identifier("Functions")
              )
          ),
          JS.identifier(name)
        ),
        [defaults]
      )
    )

    JS.variable_declaration([ref_declarator], :const)
  end

  def make_struct(attributes, env) do
    struct_name = Map.make_property(Translator.translate!(:__struct__, env), Translator.translate!({:__MODULE__, [], []}, env))

    defaults = Enum.map(attributes, fn
      ({x, y}) ->
        Map.make_property(
          Translator.translate!(x, env),
          Translator.translate!(y, env)
        )
      (x) ->
        Map.make_property(
          Translator.translate!(x, env),
          Translator.translate!(nil, env)
        )
    end)

    keys = Enum.map(attributes, fn
      ({x, _}) ->
        Translator.translate!(x, env)
      (x) ->
        Translator.translate!(x, env)
    end)

    keys = JS.array_expression(keys)
    defaults = JS.object_expression([struct_name] ++ defaults)

    allowed_keys = JS.variable_declaration([JS.variable_declarator(
      JS.identifier("allowed_keys"),
      keys      
    )], :const)

    value_keys = JS.variable_declaration([JS.variable_declarator(
      JS.identifier("value_keys"),
      JS.call_expression(
        JS.member_expression(
          JS.identifier("Object"),
          JS.identifier("keys")
        ),
        [JS.identifier("values")]
      )      
    )], :const)

    every_call = JS.call_expression(
      JS.member_expression(
        JS.identifier("value_keys"),
        JS.identifier("every")
      ),
      [
        JS.function_expression([JS.identifier("key")], [], JS.block_statement([
          JS.return_statement(
            JS.call_expression(
              JS.member_expression(
                JS.identifier("allowed_keys"),
                JS.identifier("includes")
              ),
              [JS.identifier("key")]         
            )
          )
        ]))
      ]
    )

    every_call_result = JS.variable_declaration([JS.variable_declarator(
      JS.identifier("every_call_result"),
      every_call      
    )], :const)

    bottom = JS.if_statement(
      JS.identifier("every_call_result"),
      JS.block_statement([
        JS.return_statement(
          JS.call_expression(
            JS.member_expression(
              JS.identifier("Object"),
              JS.identifier("assign")
            ),
            [JS.object_expression([]), defaults, JS.identifier("values")]
          )
        )     
      ]),
      JS.block_statement([
        JS.throw_statement(
          JS.literal("Unallowed key found")
        )
      ])
    )

    func = JS.function_expression([
      %ESTree.AssignmentPattern{
        left: JS.identifier("values"),
        right: JS.object_expression([])
      }
    ],
    [],
    JS.block_statement([
      allowed_keys,
      value_keys,
      every_call_result,
      bottom
    ]))

    JS.variable_declaration([JS.variable_declarator(
      JS.identifier("__struct__"),
      func      
    )], :const)
  end

end
