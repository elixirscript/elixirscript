defmodule ElixirScript.PostProcessor do
  alias ESTree.Builder
  alias ElixirScript.Translator

  @standard_libs [
    {:Atom, from: "./atom"},
    {:BitString, from: "./bit_string"},
    {:Enum, from: "./enum"},
    {:Integer, from: "./integer"},
    {:Kernel, from: "./kernel"},
    {:List, from: "./list"},
    {:Logger, from: "./logger"},
    {:Mutable, from: "./mutable"},
    {:Range, from: "./range"},
    {:Tuple, from: "./tuple"},
  ]

  def create_import_statements() do
    Application.get_env(:elixir_script, :js_deps, [])
    |> create_import_statements
  end

  def create_import_statements(js_deps) do
    #js_deps = @standard_libs ++ js_deps
    Enum.map(js_deps, fn(x) -> 
      case x do
        { dep } ->
          ElixirScript.Translator.JSImport.make_js_import(dep, [])
        { dep, options } ->
          ElixirScript.Translator.JSImport.make_js_import(dep, options)          
      end
    end)
  end

  def create_root_object() do
    Application.get_env(:elixir_script, :app)
    |> create_root_object
  end

  def create_root_object(root) do
    root = Atom.to_string(root)
    |> String.capitalize

    declarator = Builder.variable_declarator(
      Builder.identifier(root),
      Builder.object_expression([])
    )

    Builder.variable_declaration([declarator], :let)
  end

  def export_root_object() do
    Application.get_env(:elixir_script, :app)
    |> export_root_object
  end

  def export_root_object(root) do
    Atom.to_string(root)
    |> String.capitalize
    |> Builder.identifier
    |> Builder.export_declaration([], true)
  end

end