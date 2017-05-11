defmodule ElixirScript.AtomTest do
	def test_to_string() do
		Blueprint.Assertions.assertEqual(Atom.to_string(:"héllo"), "héllo")
	end
end