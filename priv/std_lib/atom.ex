defmodule ElixirScript.Atom do
   @moduledoc false 
  import Kernel, except: [to_string: 1]

  def to_char_list(atom) do
    to_string(atom).split("")
  end

  def to_string(atom) do
    Symbol.keyFor(atom)
  end

end
