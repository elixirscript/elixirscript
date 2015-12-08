defmodule ElixirScript.Translator.Import do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.State

  def make_import(module_name) do
    import_specifier = JS.import_namespace_specifier(
      JS.identifier(ElixirScript.Module.name_to_js_name(module_name))
    )

    JS.import_declaration(
      [import_specifier],
      JS.literal("#{ElixirScript.Module.name_to_js_file_name(module_name)}")
    )
  end

  def make_alias_import(alias_info, options) do

    {_, _, name} = alias_info

    default = Dict.get(options, :default, false)

    if State.protocol_listed?(name) do
      default = true
    end

     import_specifier = if default == false do
      if options[:as] do
        {_, _, alt} = options[:as]

        JS.import_namespace_specifier(
          JS.identifier(List.last(alt))
        )
      else
      JS.import_namespace_specifier(
        JS.identifier(List.last(name))
      )
      end
    else
      if options[:as] do
        {_, _, alt} = options[:as]

        JS.import_specifier(
          JS.identifier("default"),
          JS.identifier(List.last(alt))
        )
      else
      JS.import_default_specifier(
        JS.identifier(List.last(name)),
        JS.identifier(List.last(name))
      )
      end
    end

    import_path = make_source(name)

    JS.import_declaration(
      [import_specifier],
      JS.identifier(import_path)
    )
  end

  defp make_source(name) do
    root = ElixirScript.State.get().root
    "'#{make_root(root)}#{make_file_path(name)}'"
  end

  def make_file_path(name) do
    Enum.map(name, fn(x) ->
      x
      |> Atom.to_string
      |> Inflex.underscore
      |> String.downcase
    end)
    |> Enum.join("/")
  end

  def get_functions_from_module(functions, [only: only]) do
    Set.intersection(Enum.into(only, HashSet.new), Enum.into(functions, HashSet.new))
  end

  def get_functions_from_module(functions, [except: except]) do
    Set.difference(Enum.into(functions, HashSet.new), Enum.into(except, HashSet.new))
  end

  def create_standard_lib_imports(root, name) do

    import_specifier = JS.import_namespace_specifier(
      JS.identifier(:Elixir)
    )

    import_declaration = JS.import_declaration(
      [import_specifier],
      JS.identifier("'#{make_root(root) <> name}'")
    )

    [import_declaration]
  end

  defp make_root(nil) do
    ""
  end

  defp make_root(root) do
    root <> "/"
  end

end
