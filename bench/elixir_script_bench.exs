defmodule ElixirScript.Bench do
  use Benchfella

  bench "transpile number" do
    ElixirScript.transpile("1")
    :ok
  end

  bench "transpile string" do
    ElixirScript.transpile("\"1\"")
    :ok
  end

  bench "transpile atom" do
    ElixirScript.transpile(":atom")
    :ok
  end

  bench "transpile list" do
    ElixirScript.transpile("[1, 2, 3, 4]")
    :ok
  end

  bench "transpile tuple" do
    ElixirScript.transpile("{1, 2, 3, 4}")
    :ok
  end

  bench "transpile map" do
    ElixirScript.transpile("%{ a: 1, b: 2, c: :atom }")
    :ok
  end

end