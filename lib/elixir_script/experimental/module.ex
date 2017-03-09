defmodule ElixirScript.Experimental.Module do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Function
  alias ElixirScript.Translator.Identifier

  @moduledoc """
  Upper level module that handles compilation
  """

  def compile(_line, _file, module, attrs, defs, unreachable, opts) do
    reachable_defs = Enum.filter(defs, fn
      { name, _, _, _} -> not(name in unreachable)
      { _, type, _, _} when type in [:defmacro, :defmacrop] -> false
      _ -> true
    end)

    compiled_functions = reachable_defs
    |> Enum.map(&Function.compile(&1))

    imports = make_imports(reachable_defs)
    exports = make_exports(reachable_defs)

    J.program(imports ++ compiled_functions ++ [J.export_default_declaration(exports)])
  end

  defp make_exports(reachable_defs) do
    exports = Enum.reduce(reachable_defs, [], fn
      {{name, arity}, :def, _, _}, list ->
      function_name = ElixirScript.Translator.Identifier.make_function_name(name, arity)
        list ++ [J.property(function_name, function_name, :init, true)]
      _, list ->
        list
    end)

    J.object_expression(exports)
  end

  defp make_imports(reachable_defs) do
    imports = Enum.reduce(reachable_defs, [], fn
      {{name, arity}, type, _, clauses}, list when type in [:def, :defp] ->
        imports = search_for_imports(clauses)
        list ++ imports
      _, list ->
        list
    end)

    imports
  end

  defp search_for_imports(clauses) do
    imports = Enum.map(clauses, fn(clause) ->

      # Walk the AST and try to find module references
      # We will turn these into imports
     {ast, list} = Macro.postwalk(clause, [], fn
      {_, _, _, {{:., _, [module, _]}, _, _}} = ast, list ->
          if is_elixir_module(module) do
            {ast, list ++ [module_to_import(module)]}
          else
            {ast, list}
          end
      ast, list ->
          { ast, list }
    end)

      list

    end)

    List.flatten(imports) |> Enum.uniq
  end

  defp module_to_import(module) do
    members = ["Elixir"] ++ Module.split(module)

    import_specifier = J.import_default_specifier(
      J.identifier(Enum.join(members, "_"))
    )

    file_path = Path.join(["."] ++ [Enum.join(members, ".")])

    J.import_declaration(
      [import_specifier],
      J.literal(file_path)
    )
  end

  def is_elixir_module(module) when is_atom(module) do
    first_char = String.first(to_string(module))
    Regex.match?(~r/[A-Z]/, first_char)
  end

  def is_elixir_module(_) do
    false
  end

end
