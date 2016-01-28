defmodule ElixirScript.Translator.Rewriter do


  def rewrite({{:., _, [:erlang, :abs]}, _, [number]}) do
    quote do: Math.abs(unquote(number))
  end

  def rewrite({{:., _, [:erlang, :apply]}, _, [fun, args]}) do
    quote do: unquote(fun).apply(nil, unquote(args))
  end

  def rewrite({{:., _, [:erlang, :apply]}, _, [module, fun, args]}) do
    quote do: unquote(module).unquote(fun).apply(nil, unquote(args))
  end

  def rewrite({{:., _, [:erlang, :binary_part]}, _, [binary, start, length]})do
    quote do: unquote(binary).substring(unquote(start), unquote(length))
  end

  def rewrite({{:., _, [:erlang, :bit_size]}, _, [bitstring]})do
    quote do: unquote(bitstring).bit_size
  end

  def rewrite({{:., _, [:erlang, :byte_size]}, _, [bitstring]})do
    quote do: unquote(bitstring).byte_size
  end

  def rewrite({{:., _, [:erlang, :div]}, _, [left, right]}) do
    quote do: unquote(left) / unquote(right)
  end

  def rewrite({{:., _, [:erlang, :exit]}, _, [reason]}) do
    # TODO: implement exit
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :hd]}, _, [list]}) do
    quote do: unquote(list)[0]
  end

  def rewrite({{:., _, [:erlang, :is_atom]}, _, [term]}) do
    quote do: JS.typeof(unquote(term)) === "symbol"
  end

  def rewrite({{:., _, [:erlang, :is_binary]}, _, [term]}) do
    quote do: JS.typeof(unquote(term)) === "string"
  end

  def rewrite({{:., _, [:erlang, :is_bitstring]}, _, [term]}) do
    quote do: is_binary(unquote(term)) || JS.instanceof(unquote(term), Elixir.Core.BitString)
  end

  def rewrite({{:., _, [:erlang, :is_boolean]}, _, [term]}) do
    quote do: JS.typeof(unquote(term)) === "boolean" || JS.instanceof(unquote(term), Boolean)
  end

  def rewrite({{:., _, [:erlang, :is_float]}, _, [term]}) do
    quote do: (JS.typeof(unquote(term)) === "number" || JS.instanceof(unquote(term, Number))) && !Number.isInteger(unquote(term))
  end

  def rewrite({{:., _, [:erlang, :is_function]}, _, [term]}) do
    quote do: JS.typeof(unquote(term)) === "function" || JS.instanceof(unquote(term), Function)
  end

  def rewrite({{:., _, [:erlang, :is_function]}, _, [term, _]}) do
    quote do: JS.typeof(unquote(term)) === "function" || JS.instanceof(unquote(term), Function)
  end

  def rewrite({{:., _, [:erlang, :is_integer]}, _, [term]}) do
    quote do: Number.isInteger(unquote(term))
  end

  def rewrite({{:., _, [:erlang, :is_list]}, _, [term]}) do
    quote do: Array.isArray(unquote(term))
  end

  def rewrite({{:., _, [:erlang, :is_number]}, _, [term]}) do
    quote do: JS.typeof(unquote(term)) === "number" || JS.instanceof(unquote(term), Number)
  end

  def rewrite({{:., _, [:erlang, :is_pid]}, _, [term]}) do
    quote do: JS.instanceof(unquote(term), Elixir.Core.PID)
  end

  def rewrite({{:., _, [:erlang, :is_port]}, _, [_term]}) do
    #TODO implement is_port
    quote do: false
  end

  def rewrite({{:., _, [:erlang, :is_reference]}, _, [_term]}) do
    #TODO implement is_reference
    quote do: false
  end

  def rewrite({{:., _, [:erlang, :is_tuple]}, _, [term]}) do
    quote do: JS.instanceof(unquote(term), Elixir.Core.Tuple)
  end

  def rewrite({{:., _, [:erlang, :is_map]}, _, [term]}) do
    quote do: JS.typeof(unquote(term)) === "object" || JS.instanceof(unquote(term), Object)
  end

  def rewrite({{:., _, [:erlang, :length]}, _, [list]}) do
    quote do: unquote(list).length
  end

  def rewrite({{:., _, [:erlang, :make_ref]}, _, []}) do
    #TODO: implement make_ref
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :map_size]}, _, [map]}) do
    quote do: Object.keys(unquote(map)).length
  end

  def rewrite({{:., _, [:erlang, :max]}, _, [first, second]}) do
    quote do: Math.max(unquote(first), unquote(second))
  end

  def rewrite({{:., _, [:erlang, :min]}, _, [first, second]}) do
    quote do: Math.min(unquote(first), unquote(second))
  end

  def rewrite({{:., _, [:erlang, :node]}, _, []}) do
    quote do: :nonode@nohost
  end

  def rewrite({{:., _, [:erlang, :node]}, _, [_]}) do
    quote do: :nonode@nohost
  end

  def rewrite({{:., _, [:erlang, :rem]}, _, [first, second]}) do
    {:%, [], [first, second]}
  end

  def rewrite({{:., _, [:erlang, :round]}, _, [number]}) do
    quote do: Math.round(unquote(number))
  end

  def rewrite({{:., _, [:erlang, :send]}, _, [dest, msg]}) do
    #TODO implement send
    quote do: unquote(msg)
  end

  def rewrite({{:., _, [:erlang, :self]}, _, []}) do
    #TODO: implement self
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :spawn]}, _, [_fun]}) do
    #TODO: implement spawn
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :spawn]}, _, [_module, _fun, _args]}) do
    #TODO: implement spawn
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :spawn_link]}, _, [_fun]}) do
    #TODO: implement spawn_link
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :spawn_link]}, _, [_module, _fun, _args]}) do
    #TODO: implement spawn_link
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :spawn_monitor]}, _, [_fun]}) do
    #TODO: implement spawn_monitor
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :spawn_monitor]}, _, [_module, _fun, _args]}) do
    #TODO: implement spawn_monitor
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :spawn_monitor]}, _, [_module, _fun, _args]}) do
    #TODO: implement spawn_monitor
    quote do: nil
  end

  def rewrite({{:., _, [:erlang, :throw]}, _, [term]}) do
    quote do: JS.throw(unquote(term))
  end

  def rewrite({{:., _, [:erlang, :tl]}, _, [list]}) do
    quote do: unquote(list).splice(1)
  end

  def rewrite({{:., _, [:erlang, :trunc]}, _, [number]}) do
    quote do: Math.floor(unquote(number))
  end

  def rewrite({{:., _, [:erlang, :tuple_size]}, _, [tuple]}) do
    quote do: unquote(tuple).length
  end

  def rewrite({{:., _, [:erlang, operator]}, _, [left, right]}) when operator in [:+, :-, :*, :/, :<, :>, :>=, :==] do
    {operator, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, operator]}, _, [value]}) when operator in [:+, :-] do
    {operator, [], [value]}
  end

  def rewrite({{:., _, [:erlang, :++]}, _, [left, right]}) do
    quote do: unquote(left).concat(unquote(right))
  end

  def rewrite({{:., _, [:erlang, :--]}, _, [list, element]}) do
    quote do: unquote(list).slice(unquote(list).indexOf(unquote(element)) + 1)
  end

  def rewrite({{:., _, [:erlang, :not]}, _, [value]}) do
    {:!, [], [value]}
  end

  def rewrite({{:., _, [:erlang, :"=<"]}, _, [left, right]}) do
    {:<=, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :"/="]}, _, [left, right]}) do
    {:!=, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :"=:="]}, _, [left, right]}) do
    {:===, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :"=/="]}, _, [left, right]}) do
    {:!==, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :element]}, _, [index, tuple]}) do
    quote do: unquote(tuple).get(unquote(index) - 1)
  end

  def rewrite({{:., _, [:erlang, :setelement]}, _, [index, tuple, value]}) do
    quote do: unquote(tuple).put_elem(unquote(index) - 1, unquote(value))
  end

  def rewrite({{:., _, [:erlang, :orelse]}, _, [left, right]}) do
    {:||, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :andalso]}, _, [left, right]}) do
    {:&&, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :error]}, _, [error]}) do
    quote do: JS.throw(unquote(error))
  end

  def rewrite({{:., _, [:erlang, :raise]}, _, [_class, reason, _stacktrace]}) do
    quote do: JS.throw(unquote(reason))
  end

  def rewrite({{:., _, [:lists, :map]}, _, [fun, list]}) do
    quote do: unquote(list).map(unquote(fun))
  end

  def rewrite({{:., _, [:lists, :member]}, _, [elem, list]}) do
    quote do: unquote(list).indexOf(unquote(elem)) > -1
  end

  def rewrite({{:., _, [:lists, :foldl]}, _, [fun, acc, list]}) do
    quote do: Elixir.Core.Functions.foldl(unquote(fun), unquote(acc), unquote(list))
  end

  def rewrite({{:., _, [:lists, :foldr]}, _, [fun, acc, list]}) do
    quote do: Elixir.Core.Functions.foldr(unquote(fun), unquote(acc), unquote(list))
  end

  def rewrite({{:., _, [:lists, :keydelete]}, _, [key, n, list]}) do
    quote do: Elixir.Core.Functions.keydelete(unquote(key), unquote(n), unquote(list))
  end

  def rewrite({{:., _, [:lists, :keystore]}, _, [key, n, list, newtuple]}) do
    quote do: Elixir.Core.Functions.keymember(unquote(key), unquote(n), unquote(list),  unquote(newtuple))
  end

  def rewrite({{:., _, [:lists, :reverse]}, _, [list]}) do
    quote do: Elixir.Core.Functions.reverse(unquote(list))
  end

  def rewrite({{:., _, [:maps, :is_key]}, _, [key, map]}) do
    quote do: unquote(key) in Elixir.Core.Functions.get_object_keys(unquote(map))
  end

  def rewrite({{:., _, [:maps, :put]}, _, [key, value, map]}) do
    quote do: Elixir.Core.Functions.add_property_to_map(unquote(map), unquote(key), unquote(value))
  end

  def rewrite({{:., _, [:maps, :update]}, _, [key, value, map]}) do
    quote do: Elixir.Core.Functions.update_map(unquote(map), unquote(key), unquote(value))
  end


end
