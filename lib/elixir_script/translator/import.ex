defmodule ElixirScript.Translator.Import do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def make_alias_import(alias_info, options) do
    {_, _, name} = alias_info

    import_specifier = if options[:as] do
      {_, _, alt} = options[:as]
      Builder.identifier(alt)
    else
      List.last(name) 
      |> Builder.identifier 
    end

    declarator = Builder.variable_declarator(
      import_specifier,
      Utils.make_module_expression_tree(name, false)
    )

    Builder.variable_declaration([declarator], :let)
  end

  def make_import(module_name_list, options) do
    mod = List.last(module_name_list) |> Builder.identifier

    specifiers = if options[:only] do
      Enum.map(options[:only], fn({name, _arity}) -> 
        Builder.import_specifier(
          Builder.identifier(name)
        )
      end)
    else
      List.wrap(Builder.import_namespace_specifier(mod))
    end

    import_path = if options[:from] do
      "'#{options[:from]}'"
    else
      make_source(module_name_list)
    end

    Builder.import_declaration(specifiers, Builder.identifier(import_path))
  end

  defp make_source(name) do
    "'#{do_make_source(name)}'"
  end

  defp do_make_source([:Parent | name]) do
    "../#{do_make_source(name)}"
  end

  defp do_make_source(name) do
    source = Enum.map(name, fn(x) -> 
      x
      |> Atom.to_string 
      |> Inflex.underscore 
      |> String.downcase 
    end) 
    |> Enum.join("/")

    source
  end

end