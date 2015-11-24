defmodule ElixirScript.Translator.Import do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.State

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

  def make_import(module_name_list, [], _) do
    module = State.get_module(module_name_list)
    functions = ElixirScript.Module.functions(module)

    functions = Enum.map(functions, fn
      ({name, _arity}) ->
        name
      (name) ->
        name
    end)

    specifiers = Enum.map(functions, fn
      ({name, _arity}) ->
        name = JS.identifier(name)
        JS.import_specifier(
          name,
          name
        )
      (name) ->
        name = JS.identifier(name)
        JS.import_specifier(
          name,
          name
        )
    end)

    import_path = make_source(module_name_list)

    JS.import_declaration(specifiers, JS.identifier(import_path))
  end

  def make_import(module_name_list, [only: :functions], _) do
    module = State.get_module(module_name_list)
    functions = ElixirScript.Module.functions(module)

    functions = Enum.map(functions, fn
      ({name, _arity}) ->
        name
      (name) ->
        name
    end)

    specifiers = Enum.map(functions, fn
      (name) ->
        name = JS.identifier(name)
        JS.import_specifier(
          name,
          name
        )
    end)

    import_path = make_source(module_name_list)

    JS.import_declaration(specifiers, JS.identifier(import_path))
  end

  def make_import(module_name_list, [only: only], _) do
    only = Enum.map(only, fn
      ({name, _arity}) ->
        name
      (name) ->
        name
    end)

    module = State.get_module(module_name_list)

    functions = ElixirScript.Module.functions(module)
    |> get_functions_from_module([only: only])

    specifiers = Enum.map(functions, fn
      (name) ->
        name = JS.identifier(name)
        JS.import_specifier(
          name,
          name
        )
    end)

    import_path = make_source(module_name_list)

    JS.import_declaration(specifiers, JS.identifier(import_path))
  end

  def make_import(module_name_list, [except: except], _) do
    except = Enum.map(except, fn
      ({name, _arity}) ->
        name
      (name) ->
        name
    end)

    module = State.get_module(module_name_list)
    functions = ElixirScript.Module.functions(module)
    |> get_functions_from_module([except: except])

    specifiers = Enum.map(functions, fn
      (name) ->
        name = JS.identifier(name)
        JS.import_specifier(
          name,
          name
        )
    end)

    import_path = make_source(module_name_list)

    JS.import_declaration(specifiers, JS.identifier(import_path))
  end

  defp make_source(name) do
    root = ElixirScript.State.get().root
    "'#{root(root)}#{make_file_path(name)}'"
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

  def create_standard_lib_imports(root, _) do
    import_specifier = JS.import_namespace_specifier(
      JS.identifier(:Elixir)
    )

    import_declaration = JS.import_declaration(
      [import_specifier],
      JS.identifier("'#{root(root) <> "elixir"}'")
    )

    [import_declaration]
  end

  defp root(nil) do
    ""
  end

  defp root(root) do
    root <> "/"
  end

end
