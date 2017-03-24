defmodule ElixirScript.String do
  @moduledoc false
  import Kernel, except: [length: 1]

  def to_atom(str) do
    JS.Symbol.for(str)
  end

  def to_existing_atom(str) do
    JS.Symbol.for(str)
  end

  def to_char_list(str) do
    str.split("")
  end

  def to_float(str) do
    JS.parseFloat(str)
  end

  def to_integer(str) do
    JS.parseInt(str, 10)
  end

  def to_integer(str, base) do
    JS.parseInt(str, base)
  end

  def upcase(str) do
    str.toUpperCase()
  end

  def downcase(str) do
    str.toLowerCase()
  end

  def at(str, pos) do
    case pos > length(str) do
      true ->
        nil
      _ ->
        str[pos]
    end
  end

  def capitalize(str) do
    first = str[0].toUpperCase()
    rest = str.substr(1).toLowerCase()

    first <> rest
  end

  def split(str) do
    str.split()
  end

  def split(str, replace, options \\ []) do
    limit = Keyword.get(options, :parts, -1)
    trim = Keyword.get(options, :trim, false)
    split = str.split(replace, limit)

    Enum.map(split, fn(x) ->
      if trim do
        x.trim()
      else
        x
      end
    end)
  end


  def next_grapheme(nil), do: nil
  def next_grapheme(""), do: nil

  def next_grapheme(str) do
    { str[0], str.substr(1) }
  end

  def first(nil), do: nil
  def first(str) do
    str[0]
  end

  def last(nil), do: nil
  def last(str) do
    str[length(str) - 1]
  end

  def graphemes(str) do
    str.split('')
  end

  def length(str) do
    str.length()
  end

  def match?(str, regex) do
    str.match(regex) != nil
  end

  def next_codepoint(nil), do: nil
  def next_codepoint(""), do: nil
  def next_codepoint(str) do
    { str[0].codePointAt(0), str.substr(1) }
  end

  def reverse(str) do
    do_reverse(str, "")
  end

  defp do_reverse("", str) do
    str
  end

  defp do_reverse(str, reverse_str) do
    do_reverse(str.substr(1), reverse_str <> last(str))
  end

  def starts_with?(str, prefix) when is_binary(prefix) do
    str.startsWith(prefix)
  end

  def starts_with?(str, prefixes) when is_list(prefixes) do
    do_starts_with?(str, prefixes)
  end

  def do_starts_with?(_, []) do
    false
  end

  def do_starts_with?(str, prefixes) do
    case starts_with?(str, hd(prefixes)) do
      true ->
        true
      _ ->
        do_starts_with?(str, tl(prefixes))
    end
  end


  def ends_with?(str, suffix) when is_binary(suffix) do
    str.endsWith(suffix)
  end

  def ends_with?(str, suffixes) when is_list(suffixes) do
    do_ends_with?(str, suffixes)
  end

  def do_ends_with?(_, []) do
    false
  end

  def do_ends_with?(str, suffixes) do
    case ends_with?(str, hd(suffixes)) do
      true ->
        true
      _ ->
        do_ends_with?(str, tl(suffixes))
    end
  end

  def duplicate(str, n) do
    str.repeat(n)
  end


  def contains?(str, s) when is_binary(s) do
    str.indexOf(s) > -1
  end

  def contains?(str, s) when is_list(s) do
    do_contains?(str, s)
  end

  def do_contains?(_, []) do
    false
  end

  def do_contains?(str, prefixes) do
    case contains?(str, hd(prefixes)) do
      true ->
        true
      _ ->
        do_contains?(str, tl(prefixes))
    end
  end


  def codepoints(str) do
    do_codepoints(str, [])
  end

  def do_codepoints("", codepoint_list) do
    codepoint_list
  end

  def do_codepoints(str, codepoint_list) do
    do_codepoints(str.substr(1), codepoint_list ++ [first(str).codePointAt(0)])
  end

  def valid_character?(codepoint) do
    ElixirScript.Bootstrap.Functions.is_valid_character(codepoint)
  end
end
