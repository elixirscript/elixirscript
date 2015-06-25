defmodule ElixirScript.Translator.JSImport do
  alias ESTree.Builder

  def make_js_import(name, options) do

    import_specifier = if options[:as] do
      {_, _, alt} = options[:as]
      Builder.identifier(alt)
      Builder.import_specifier(
        Builder.identifier("default"),
        Builder.identifier(alt)
      )
    else
      List.last(name) 
      |> Builder.identifier
      |> Builder.import_default_specifier()  
    end

    import_path = if options[:from] do
      "'#{options[:from]}'"
    else
      make_source(name)
    end

    Builder.import_declaration(
      [import_specifier], 
      Builder.identifier(import_path)
    )
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