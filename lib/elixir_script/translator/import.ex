defmodule ElixirScript.Translator.Import do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  def make_alias_import(alias_info, options) do
    {_, _, name} = alias_info

    default = Dict.get(options, :default, false)

    
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
    



    import_path = if options[:from] do
      "'#{options[:from]}'"
    else
      make_source(name)
    end

    JS.import_declaration(
      [import_specifier], 
      JS.identifier(import_path)
    )
  end

  def make_import(module_name_list, options, env) do
    mod = List.last(module_name_list) |> JS.identifier

    specifiers = if options[:only] do
      Enum.map(options[:only], fn
        ({name, _arity}) ->
          name = JS.identifier(name)
          JS.import_specifier(
            name,
            name
          )
        (name) ->
          name = Translator.translate(name, env)
          JS.import_specifier(
            name,
            name
          )   
      end)
    else
      List.wrap(JS.import_namespace_specifier(mod))
    end

    import_path = if options[:from] do
      "'#{options[:from]}'"
    else
      make_source(module_name_list)
    end

    JS.import_declaration(specifiers, JS.identifier(import_path))
  end

  defp make_source(name) do
    "'#{make_file_path(name)}'"
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

end
