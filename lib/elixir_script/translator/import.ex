defmodule ElixirScript.Translator.Import do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def make_alias_import(alias_info, options) do
    {_, _, name} = alias_info

    Builder.call_expression(
      Builder.member_expression(
        Builder.member_expression(
          Builder.identifier("Kernel"),
          Builder.identifier("SpecialForms")
        ),
        Builder.identifier("alias")
      ),
      [
        Utils.make_module_expression_tree(name, false),
        Translator.translate(options),
        Builder.identifier(:this)
      ]
    )
  end

  def make_import(module_name_list, options) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.member_expression(
          Builder.identifier("Kernel"),
          Builder.identifier("SpecialForms")
        ),
        Builder.identifier("import")
      ),
      [
        Utils.make_module_expression_tree(module_name_list, false),
        Translator.translate(options),
        Builder.identifier(:this)
      ]
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