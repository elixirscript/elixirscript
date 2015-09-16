defmodule ElixirScript.Bench do
  use Benchfella

  bench "compile number" do
    ElixirScript.compile("1")
    :ok
  end

  bench "compile string" do
    ElixirScript.compile("\"1\"")
    :ok
  end

  bench "compile atom" do
    ElixirScript.compile(":atom")
    :ok
  end

  bench "compile list" do
    ElixirScript.compile("[1, 2, 3, 4]")
    :ok
  end

  bench "compile tuple" do
    ElixirScript.compile("{1, 2, 3, 4}")
    :ok
  end

  bench "compile map" do
    ElixirScript.compile("%{ a: 1, b: 2, c: :atom }")
    :ok
  end

end