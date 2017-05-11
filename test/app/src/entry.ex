defmodule Entry do
	
	def start(:normal, _) do
		Blueprint.run([ElixirScript.AtomTest])
  end

end