defmodule ElixirScript.Translator.Protocol do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS

#defprotocol ElixirScript.String.Chars do
#  def to_string(thing)
#end
#
#defprotocol ElixirScript.List.Chars do
#  def to_char_list(thing)
#end
#
#defprotocol ElixirScript.Inspect do
#  def inspect(thing, opts)
#end
#
#defprotocol ElixirScript.Enumerable do
#  def count(collection)
#
#  def member?(collection, value)
#
#  def reduce(collection, acc, fun)
#end
#
#defprotocol ElixirScript.Collectable do
#  def into(collectable)
#end


  @doc """
    import * as Elixir from "elixir";

    const __MODULE__ = [Elixir.Kernel.SpecialForms.atom("Collectable")];

    Collectable = Elixir.Protocol.defprotocol({
      into: function(collectable){}
    });

    Collectable.impl(Array, {
      into: function(collectable){
        return collectable.push(a);
      }
    });

    export Collectable;
  """
  def consolidate(protocol) do
    name = protocol.name
    spec = protocol.spec
    impls = protocol.impls
  end


  @doc """
    Used to map Protocol types from Elixir to
    a function used by the protocol implementation
    in JavaScript
  """
  def map_to_js({:__aliases__, _, [:Integer]}) do
    quoted = quote do
      &Kernel.is_integer/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:Tuple]}) do
    quoted = quote do
      &Kernel.is_tuple/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:Atom]}) do
    quoted = quote do
      &Kernel.is_atom/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:List]}) do
    quoted = quote do
      &Kernel.is_list/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:BitString]}) do
    quoted = quote do
      &Kernel.is_bitstring/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:Float]}) do
    quoted = quote do
      &Kernel.is_float/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:Function]}) do
    quoted = quote do
      &Kernel.is_function/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:PID]}) do
    quoted = quote do
      &Kernel.is_pid/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:Port]}) do
    quoted = quote do
      &Kernel.is_port/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:Reference]}) do
    quoted = quote do
      &Kernel.is_reference/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:Map]}) do
    quoted = quote do
      &Kernel.is_map/1
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

  def map_to_js({:__aliases__, _, [:Any]}) do
    quoted = quote do
      nil
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end


  def map_to_js({:__aliases__, _, struct}) do
    quoted = quote do
      Kernel.is_struct_fn(unquote(List.last(struct)))
    end

    Translator.translate(quoted, ElixirScript.State.get().env)
  end

end