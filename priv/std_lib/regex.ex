defmodule ElixirScript.Regex do
  @moduledoc false
  require JS

  def compile(source, options \\ "") do
    try do
      {:ok, JS.new(JS.RegExp, [source, options])}
    rescue
      x ->
        {:error, x.message}
    end
  end

  def compile!(source, options \\ "") do
    JS.new(JS.RegExp, [source, options])
  end

  def regex?(term) do
    JS.instanceof(term, JS.RegExp)
  end

  def match?(regex, string) do
    reg = if regex?(regex), do: regex, else: compile!(source(regex), opts(regex))
    reg.test(string)
  end

  def source(regex) do
    regex.source
  end

  def opts(regex) do
    regex.opts
  end

  def run(regex, string, options \\ []) do
    regex.exec(string)
  end

  def scan(regex, string, options \\ []) do
    reg = make_global(regex)
    do_scan(reg, string, options, [])
  end

  def replace(regex, string, replacement, options \\ []) do
    reg = if Keyword.get(options, :global, true) do
      make_global(regex)
    else
      regex
    end

    string.replace(reg, replacement)
  end

  defp do_scan(regex, string, options, results) do
    case run(regex, string, options) do
      nil ->
        results
      match ->
        do_scan(regex, string, options, results ++ match)
    end
  end

  defp make_global(regex) do
    if String.contains?(opts(regex), "g") do
      regex
    else
      JS.new(JS.RegExp, [ source(regex), opts(regex) <> "g" ])
    end
  end

end
