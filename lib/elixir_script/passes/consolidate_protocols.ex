defmodule ElixirScript.Passes.ConsolidateProtocols do
  @pass 8
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Utils
  alias ElixirScript.ModuleSystems
  alias ElixirScript.Translator.Identifier
  require Logger

  def execute(compiler_data, opts) do
    only_protocols_and_impls = Enum.filter(compiler_data.data, fn
      ({_, %{type: :module}}) ->
        false
      _ ->
        true
    end)

    grouped = group_protocol_data(only_protocols_and_impls)
    consolidated_protocols = update_protocols(grouped, opts)

    %{ compiler_data | data: compiler_data.data ++ consolidated_protocols }
  end


  defp group_protocol_data(data) do
    Enum.reduce(data, %{}, fn({module_name, module_data} = dat, state) ->
      if module_data.type == :protocol do
        existing = Map.get(state, module_name, %{})
        Map.put(existing, :protocol, dat)
        Map.put(state, module_name, existing)
      else
        existing = Map.get(state, module_data.implements, %{})
        existing_protocol_data = Map.get(existing, :impls, [])
        existing_protocol_data = existing_protocol_data ++ [dat]
        Map.put(existing, :impls, existing_protocol_data)
        Map.put(state, module_name.implements, existing)
      end
    end)
  end

  defp update_protocols(grouped_protocol_data, opts) do
    Enum.map(grouped_protocol_data, fn({ protocol_name, %{ protocol: protocol, impls: impls } }) ->
      make_defimpl(protocol_name, protocol, Enum.uniq(impls), opts)
    end)
  end

  defp make_defimpl(name, protocol, implementations, compiler_opts) do
    imports = [ModuleSystems.import_module(:Elixir, Utils.make_local_file_path(:elixir, compiler_opts.core_path, compiler_opts.root))]

    declarator = JS.variable_declarator(
      JS.identifier("impls"),
      JS.array_expression([])
    )

    declaration = JS.variable_declaration([declarator], :let)

    default = JS.export_default_declaration(JS.identifier("impls"))

    protocol_name = Atom.to_string(name)

    app_name = protocol.app

    body = Enum.flat_map(implementations, fn({impl_app_name, impl_data}) ->
      x = Atom.to_string(impl_data.type)
      x = String.to_atom(protocol_name <> ".DefImpl." <> x)
      name = Utils.name_to_js_name(x)
      imports = ModuleSystems.import_module(name, Utils.make_local_file_path(impl_app_name, Utils.name_to_js_file_name(x), compiler_opts.root))
      call = JS.call_expression(
        JS.member_expression(
          JS.identifier("impls"),
          JS.identifier("push")
        ),
        [JS.identifier(name)]
      )

      [imports, call]
    end)

    module_name = String.to_atom(protocol_name <> ".DefImpl")
    module_data = %{
      module: String.to_atom(protocol_name <> ".DefImpl"),
      javascript_ast: imports ++ [declaration] ++ body ++ [default],
      app: app_name,
      type: :consolidated,
      protocol: name
    }

    { module_name, module_data }
  end

end
