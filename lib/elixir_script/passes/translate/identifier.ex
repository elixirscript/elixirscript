defmodule ElixirScript.Translate.Identifier do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J

  @js_reserved_words [
    :break,
    :case,
    :class,
    :const,
    :continue,
    :debugger,
    :default,
    :delete,
    :do,
    :else,
    :export,
    :extends,
    :finally,
    :function,
    :if,
    :import,
    :in,
    :instanceof,
    :new,
    :return,
    :super,
    :switch,
    :throw,
    :try,
    :typeof,
    :var,
    :void,
    :while,
    :with,
    :yield
  ]

  def make_identifier(ast) do
    ast
    |> filter_name
    |> J.identifier
  end

  defp filter_name(reserved_word) when reserved_word in @js_reserved_words do
    "__#{Atom.to_string(reserved_word)}__"
  end

  defp filter_name(name) do
    to_string(name)
    |> String.replace("?", "__qmark__")
    |> String.replace("!", "__emark__")
  end

  defp make_alias([x]) do
    make_identifier(x)
  end

  defp make_alias([h|t]) do
    J.member_expression(make_alias(t), make_identifier(h))
  end

  def make_namespace_members(module_name) do
    case module_name do
      m when is_list(m) ->
        m
      m when is_atom(m) ->
        Module.split(m)
    end
    |> Enum.reverse
    |> make_alias
  end

  def make_function_name(name) do
    name = filter_name(name)
    J.identifier(name)
  end

  def make_extern_function_name(name) do
    J.identifier("#{name}")
  end

end
