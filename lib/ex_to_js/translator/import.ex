defmodule ExToJS.Translator.Import do
  require Logger
  alias ESTree.Builder

  def make_alias_import(alias_info) do
    {_, _, name} = hd(alias_info)

    import_id = if length(alias_info) > 1 do
      {_, _, alt} = List.last(alias_info)[:as]
      Builder.identifier(alt)
    else
      List.last(name) |> Builder.identifier
    end

    make_namespace_import(import_id, make_source(name))
  end

  def make_default_import(module_name_list) do
    mod = List.last(module_name_list) |> Builder.identifier

    Builder.import_declaration(
      [Builder.import_default_specifier(mod)], 
      Builder.identifier(make_source(module_name_list))
    )
  end

  def make_import(module_name_list) do
    mod = List.last(module_name_list) |> Builder.identifier
    make_namespace_import(mod, make_source(module_name_list))
  end

  def make_import(module_name_list, function_list) do
    source = make_source(module_name_list)

    identifiers = Enum.map(function_list, fn({name, _arity}) -> 
      Builder.import_specifier(
        Builder.identifier(name)
      )
    end)

    Builder.import_declaration(identifiers, Builder.identifier(source))
  end

  defp make_source(name) do
    source = Enum.map(name, fn(x) -> Atom.to_string(x) |> String.downcase end) |> Enum.join("/")
    "'#{source}'"
  end

  defp make_namespace_import(id, source) do
    import_specifier = Builder.import_namespace_specifier(id)
    Builder.import_declaration([import_specifier], Builder.identifier(source))
  end

end