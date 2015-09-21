defmodule ElixirScript.Translator.Import do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.State

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
    
    import_path = make_source(name)

    JS.import_declaration(
      [import_specifier], 
      JS.identifier(import_path)
    )
  end

  def make_import(module_name_list, [], env) do
    mod = List.last(module_name_list) |> JS.identifier

    functions = State.get_module(module_name_list).functions

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

  def make_import(module_name_list, [only: :functions], env) do
    mod = List.last(module_name_list) |> JS.identifier

    functions = State.get_module(module_name_list).functions

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

  def make_import(module_name_list, [only: only], env) do
    mod = List.last(module_name_list) |> JS.identifier

    only = Enum.map(only, fn
      ({name, _arity}) ->
        name
      (name) ->
        name 
    end)

    functions = State.get_module(module_name_list)
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

  def make_import(module_name_list, [except: except], env) do
    mod = List.last(module_name_list) |> JS.identifier

    except = Enum.map(except, fn
      ({name, _arity}) ->
        name
      (name) ->
        name 
    end)

    functions = State.get_module(module_name_list)
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

  def get_functions_from_module(module, [only: only]) do
    Set.intersection(Enum.into(only, HashSet.new), Enum.into(module.functions, HashSet.new))
  end

  def get_functions_from_module(module, [except: except]) do
    Set.difference(Enum.into(module.functions, HashSet.new), Enum.into(except, HashSet.new))    
  end


  def create_standard_lib_imports(root, env) do
    module_names = [
      :Patterns, :Kernel, :Atom, :Enum, :Integer, 
      :JS, :List, :Range, :Tuple, :Agent, :Keyword,
      :BitString
    ]

    import_specifiers = Enum.map(module_names, fn(x) -> 
        JS.import_specifier(
          JS.identifier(x),
          JS.identifier(x)
        )
    end)

    import_declaration = JS.import_declaration(
      import_specifiers, 
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
