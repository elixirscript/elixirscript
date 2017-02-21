defmodule ElixirScript.Passes.ConsolidateProtocols do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.State
  require Logger

  def execute(compiler_data, opts) do
    State.set_module_data(compiler_data.state, compiler_data.data)
    data = State.get_module_data(compiler_data.state)

    only_protocols_and_impls = Enum.filter(data, fn
      ({_, %{type: :module}}) ->
        false
      ({_, %{type: :consolidated}}) ->
        false
      _ ->
        true
    end)

    grouped = group_protocol_data(only_protocols_and_impls)
    consolidated_protocols = update_protocols(grouped, opts)

    data = Enum.reduce(consolidated_protocols, data, fn({ key, value }, d) -> Keyword.put(d, key, value) end)

    %{ compiler_data | data: data }
  end


  defp group_protocol_data(data) do
    Enum.reduce(data, %{}, fn({module_name, module_data} = dat, state) ->
      if module_data.type == :protocol do
        existing = Map.get(state, module_name, %{})
        existing = Map.put(existing, :protocol, dat)
        Map.put(state, module_name, existing)
      else
        existing = Map.get(state, module_data.implements, %{})
        existing_protocol_data = Map.get(existing, :impls, [])
        existing_protocol_data = existing_protocol_data ++ [dat]
        existing = Map.put(existing, :impls, existing_protocol_data)
        Map.put(state, module_data.implements, existing)
      end
    end)
  end

  defp update_protocols(grouped_protocol_data, opts) do
    Enum.map(grouped_protocol_data, fn
        ({ protocol_name, %{ protocol: protocol, impls: impls } }) ->
          make_defimpl(protocol_name, protocol, Enum.uniq(impls), opts)

        ({ protocol_name, %{ protocol: protocol } }) ->
        make_defimpl(protocol_name, protocol, [], opts)
    end)
  end

  defp make_defimpl(name, { _, protocol }, implementations, compiler_opts) do
    declarator = JS.variable_declarator(
      JS.identifier("impls"),
      JS.array_expression([])
    )

    declaration = JS.variable_declaration([declarator], :let)

    default = JS.export_default_declaration(JS.identifier("impls"))

    protocol_name = Atom.to_string(name)

    app_name = protocol.app

    defimpl_imports = Enum.map(implementations, fn({_, impl_data}) ->
      x = Atom.to_string(Utils.quoted_to_name(impl_data.for))
      x = String.to_atom(protocol_name <> ".DefImpl." <> x)
      name = Utils.name_to_js_name(x)
      {name, Utils.make_local_file_path(impl_data.app, Utils.name_to_js_file_name(x), compiler_opts.root, nil)}
    end)

    body = Enum.map(implementations, fn({_, impl_data}) ->
      x = Atom.to_string(Utils.quoted_to_name(impl_data.for))
      x = String.to_atom(protocol_name <> ".DefImpl." <> x)
      name = Utils.name_to_js_name(x)
      JS.call_expression(
        JS.member_expression(
          JS.identifier("impls"),
          JS.identifier("push")
        ),
        [JS.identifier(name)]
      )
    end)

    imports = defimpl_imports
    body = [declaration] ++ body

    module_name = String.to_atom(protocol_name <> ".DefImpl")
    module_data = %{
      name: name,
      module: String.to_atom(protocol_name <> ".DefImpl"),
      std_lib: {:Elixir, Utils.make_local_file_path(:elixir, compiler_opts.core_path, compiler_opts.root, nil)},
      js_imports: [],
      imports: imports,
      body: List.wrap(body),
      exports: JS.identifier("impls"),
      app: app_name,
      type: :consolidated,
      protocol: name
    }

    { module_name, module_data }
  end

end
