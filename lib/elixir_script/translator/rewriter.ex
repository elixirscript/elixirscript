defmodule ElixirScript.Translator.Rewriter do

  # :erlang, :lists, :maps, :beam_lib, :binary, :calendar, :digraph,
  # :epp, :erl_lint, :erl_internal, :erl_expand_records, :erl_eval,
  # :ets, :filename, :gen_event, :gen_server, :io, :io_lib, :math,
  # :ordsets, :proc_lib, :rand, :re, :sets, :supervisor,:sys, :timer,
  # :unicode, :os, :application, :code, :gen_tcp, :error_logger, :gen,
  # :file
  # http://erlang.org/doc/applications.html


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
    quote do: (JS.typeof(unquote(term)) === "number" || JS.instanceof(unquote(term), Number)) && !Number.isInteger(unquote(term))
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

  def rewrite({{:., _, [:erlang, :atom_to_binary]}, _, [atom, _]}) do
    quote do: Symbol.keyFor(unquote(atom))
  end

  def rewrite({{:., _, [:erlang, :atom_to_list]}, _, [atom]}) do
    quote do: to_string(unquote(atom)).split("")
  end

  def rewrite({{:., _, [:erlang, :bnot]}, _, [expr]}) do
    {:"~", [], [expr]}
  end

  def rewrite({{:., _, [:erlang, :band]}, _, [left, right]}) do
    {:&, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :bor]}, _, [left, right]}) do
    {:|, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :bxor]}, _, [left, right]}) do
    {:^, [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :bsl]}, _, [left, right]}) do
    {:"<<", [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :bsr]}, _, [left, right]}) do
    {:">>", [], [left, right]}
  end

  def rewrite({{:., _, [:erlang, :function_exported]}, _, [_, _, _]}) do
    quote do: true
  end

  def rewrite({{:., _, [:erlang, :make_tuple]}, _, [size, data]}) do
    quote do: JS.new(Elixir.Core.Tuple, List.duplicate(unquote(size), unquote(data)))
  end

  def rewrite({{:., _, [:erlang, :insert_element]}, _, [index, tuple, term]}) do
    quote do: unquote(tuple).put_elem(unquote(index) - 1, unquote(term))
  end

  def rewrite({{:., _, [:erlang, :tuple_to_list]}, _, [tuple]}) do
    quote do: unquote(tuple).values
  end

  def rewrite({{:., _, [:erlang, :append_element]}, _, [tuple, value]}) do
    quote do: unquote(tuple).put_elem(unquote(tuple).length, unquote(value))
  end

  def rewrite({{:., _, [:erlang, :delete_element]}, _, [index, tuple]}) do
    quote do: unquote(tuple).remove_elem(unquote(index))
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

  def rewrite({{:., _, [:lists, :keymember]}, _, [key, n, list]}) do
    quote do: Elixir.Core.Functions.keymember(unquote(key), unquote(n), unquote(list))
  end

  def rewrite({{:., _, [:lists, :keydelete]}, _, [key, n, list]}) do
    quote do: Elixir.Core.Functions.keydelete(unquote(key), unquote(n), unquote(list))
  end

  def rewrite({{:., _, [:lists, :keystore]}, _, [key, n, list, newtuple]}) do
    quote do: Elixir.Core.Functions.keystore(unquote(key), unquote(n), unquote(list),  unquote(newtuple))
  end

  def rewrite({{:., _, [:lists, :keytake]}, _, [key, n, list]}) do
    quote do: Elixir.Core.Functions.keystore(unquote(key), unquote(n), unquote(list))
  end

  def rewrite({{:., _, [:lists, :keyfind]}, _, [key, n, list]}) do
    quote do: Elixir.Core.Functions.keyfind(unquote(key), unquote(n), unquote(list))
  end

  def rewrite({{:., _, [:lists, :keyreplace]}, _, [key, n, list, newtuple]}) do
    quote do: Elixir.Core.Functions.keyreplace(unquote(key), unquote(n), unquote(list), unquote(newtuple))
  end

  def rewrite({{:., _, [:lists, :keysort]}, _, [n, tuplelist]}) do
    #TODO: implement keysort
    quote do: unquote(tuplelist)
  end

  def rewrite({{:., _, [:lists, :reverse]}, _, [list]}) do
    quote do: Elixir.Core.Functions.reverse(unquote(list))
  end

  def rewrite({{:., _, [:lists, :reverse]}, _, [list, tail]}) do
    quote do: Elixir.Core.Functions.reverse(unquote(list)) ++ unquote(tail)
  end

  def rewrite({{:., _, [:lists, :flatten]}, _, [list]}) do
    quote do: Elixir.Core.Functions.flatten(unquote(list))
  end

  def rewrite({{:., _, [:lists, :flatten]}, _, [list, tail]}) do
    quote do: Elixir.Core.Functions.flatten(unquote(list), unquote(tail))
  end

  def rewrite({{:., _, [:lists, :delete]}, _, [elem, list]}) do
    quote do: Elixir.Core.Functions.remove_from_list(unquote(list), unquote(elem))
  end

  def rewrite({{:., _, [:lists, :duplicate]}, _, [n, elem]}) do
    quote do: Elixir.Core.Functions.duplicate(unquote(n), unquote(elem))
  end

  def rewrite({{:., _, [:lists, :mapfoldl]}, _, [fun, acc, list]}) do
    quote do: Elixir.Core.Functions.mapfoldl(unquote(fun), unquote(acc), unquote(list))
  end

  def rewrite({{:., _, [:lists, :sort]}, _, [list]}) do
    quote do: unquote(list).sort()
  end

  #TODO: Implement sort
  def rewrite({{:., _, [:lists, :sort]}, _, [_fun, list]}) do
    quote do: unquote(list)
  end

  def rewrite({{:., _, [:lists, :filter]}, _, [pred, list]}) do
    quote do: unquote(list).filter(unquote(pred))
  end

  def rewrite({{:., _, [:lists, :filtermap]}, _, [fun, list]}) do
    quote do: Elixir.Core.Functions.filtermap(unquote(fun), unquote(list))
  end

  def rewrite({{:., _, [:lists, :concat]}, _, [things]}) do
    quote do: unquote(things).join("")
  end

  def rewrite({{:., _, [:erlang, :binary_to_atom]}, _, [binary, _]}) do
    quote do: Symbol.for(unquote(binary))
  end

  def rewrite({{:., _, [:erlang, :binary_to_existing_atom]}, _, [binary, _]}) do
    quote do: Symbol.for(unquote(binary))
  end

  def rewrite({{:., _, [:erlang, :list_to_atom]}, _, [char_list]}) do
    quote do: Symbol.for(unquote(char_list))
  end

  def rewrite({{:., _, [:erlang, :list_to_existing_atom]}, _, [char_list]}) do
    quote do: Symbol.for(unquote(char_list))
  end

  def rewrite({{:., _, [:erlang, :list_to_tuple]}, _, [list]}) do
    quote do: JS.new(Elixir.Core.Tuple, unquote(list))
  end

  def rewrite({{:., _, [:erlang, :list_to_float]}, _, [list]}) do
    quote do: parseFloat(unquote(list))
  end

  def rewrite({{:., _, [:erlang, :list_to_integer]}, _, [list]}) do
    quote do: parseInt(unquote(list))
  end

  def rewrite({{:., _, [:erlang, :list_to_integer]}, _, [list, base]}) do
    quote do: parseInt(unquote(list), unquote(base))
  end

  def rewrite({{:., _, [:erlang, :integer_to_binary]}, _, [integer]}) do
    quote do: unquote(integer).toString()
  end

  def rewrite({{:., _, [:erlang, :integer_to_binary]}, _, [integer, base]}) do
    quote do: unquote(integer).toString(unquote(base))
  end

  def rewrite({{:., _, [:erlang, :integer_to_list]}, _, [integer]}) do
    quote do: unquote(integer).toString()
  end

  def rewrite({{:., _, [:erlang, :integer_to_list]}, _, [integer, base]}) do
    quote do: unquote(integer).toString(unquote(base))
  end

  def rewrite({{:., _, [:erlang, :float_to_binary]}, _, [float]}) do
    quote do: unquote(float).toString()
  end

  def rewrite({{:., _, [:erlang, :float_to_binary]}, _, [float, base]}) do
    quote do: unquote(float).toString(unquote(base))
  end

  def rewrite({{:., _, [:erlang, :float_to_list]}, _, [float]}) do
    quote do: unquote(float).toString()
  end

  def rewrite({{:., _, [:erlang, :float_to_list]}, _, [float, base]}) do
    quote do: unquote(float).toString(unquote(base))
  end

  def rewrite({{:., _, [:erlang, :binary_to_float]}, _, [binary]}) do
    quote do: parseFloat(unquote(binary))
  end

  def rewrite({{:., _, [:erlang, :binary_to_integer]}, _, [binary]}) do
    quote do: parseInt(unquote(binary))
  end

  def rewrite({{:., _, [:erlang, :binary_to_integer]}, _, [binary, base]}) do
    quote do: parseInt(unquote(binary), unquote(base))
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

  def rewrite({{:., _, [:maps, :find]}, _, [key, map]}) do
    quote do: Elixir.Core.Functions.maps_find(unquote(key), unquote(map))
  end

  def rewrite({{:., _, [:maps, :remove]}, _, [key, map]}) do
    quote do: Elixir.Core.Functions.delete_property_from_map(unquote(map), unquote(key))
  end

  def rewrite({{:., _, [:maps, :fold]}, _, [fun, init, map]}) do
    quote do: Elixir.Core.Functions.maps_fold(unquote(fun), unquote(init), unquote(map))
  end

  def rewrite({{:., _, [:maps, :from_list]}, _, [list]}) do
    quote do: Elixir.Core.Functions.maps_fold(unquote(list))
  end

end
