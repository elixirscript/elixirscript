defmodule ElixirScript.Translate.Functions.Erlang do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Form

  def rewrite({{:., _, [:erlang, :abs]}, _, [number]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("abs")
      ),
      [Form.compile(number, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :apply]}, _, [fun, args]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(fun, state),
        J.identifier("apply")
      ),
      [Form.compile(fun, state), J.array_expression(Enum.map(List.wrap(args), &Form.compile(&1, state)))]
    )
  end

  def rewrite({{:., _, [:erlang, :apply]}, _, [module, fun, args]}, state) do
    mod = J.member_expression(
          Form.compile(module, state),
          Form.compile(fun, state)
        )

    J.call_expression(
      J.member_expression(
        mod,
        J.identifier("apply")
      ),
      [mod, J.array_expression(Enum.map(List.wrap(args), &Form.compile(&1, state)))]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_part]}, _, [binary, start, length]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(binary, state),
        J.identifier("substring")
      ),
      [Form.compile(start, state), Form.compile(length, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :bit_size]}, _, [bitstring]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(bitstring, state),
        J.identifier("bit_size")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :byte_size]}, _, [bitstring]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(bitstring, state),
        J.identifier("byte_size")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :div]}, _, [left, right]}, state) do
    J.binary_expression(
      :/,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :exit]}, _, [reason]}, _) do
    J.literal(0)
  end

  def rewrite({{:., _, [:erlang, :hd]}, _, [list]}, state) do
    J.member_expression(
      Form.compile(list, state),
      J.literal(0),
      true
    )
  end

  def rewrite({{:., _, [:erlang, :is_atom]}, _, [term]}, state) do
    J.binary_expression(
      :typeof,
      Form.compile(term, state),
      J.literal("symbol")
    )
  end

  def rewrite({{:., _, [:erlang, :is_binary]}, _, [term]}, state) do
    J.binary_expression(
      :typeof,
      Form.compile(term, state),
      J.literal("string")
    )
  end

  def rewrite({{:., _, [:erlang, :is_bitstring]}, _, [term]}, state) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term, state),
        J.literal("string")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term, state),
        J.member_expression(
          J.member_expression(
            J.identifier("Bootstrap"),
            J.identifier("Core")
          ),
          J.identifier("BitString")
        )
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_boolean]}, _, [term]}, state) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term, state),
        J.literal("boolean")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term, state),
        J.identifier("Boolean")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_float]}, _, [term]}, state) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term, state),
        J.literal("number")
      ),
      J.binary_expression(
        :&&,
        J.binary_expression(
          :instanceof,
          Form.compile(term, state),
          J.identifier("Number")
        ),
        J.unary_expression(
          :!,
          true,
          J.call_expression(
            J.member_expression(
              J.identifier("Number"),
              J.identifier("isInteger")
            ),
            [Form.compile(term, state)]
          )
        )
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_function]}, _, [term]}, state) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term, state),
        J.literal("function")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term, state),
        J.identifier("Function")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_function]}, _, [term, _]}, state) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term, state),
        J.literal("function")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term, state),
        J.identifier("Function")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_integer]}, _, [term]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Number"),
        J.identifier("isInteger")
      ),
      [Form.compile(term, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :is_list]}, _, [term]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Array"),
        J.identifier("isArray")
      ),
      [Form.compile(term, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :is_number]}, _, [term]}, state) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term, state),
        J.literal("number")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term, state),
        J.identifier("Number")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_pid]}, _, [term]}, state) do
    J.binary_expression(
      :instanceof,
      Form.compile(term, state),
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("PID")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_port]}, _, [_term]}, state) do
    J.literal(false)
  end

  def rewrite({{:., _, [:erlang, :is_reference]}, _, [_term]}, state) do
    J.literal(false)
  end

  def rewrite({{:., _, [:erlang, :is_tuple]}, _, [term]}, state) do
    J.binary_expression(
      :instanceof,
      Form.compile(term, state),
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_map]}, _, [term]}, state) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term, state),
        J.literal("object")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term, state),
        J.identifier("Object")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :length]}, _, [list]}, state) do
    J.member_expression(
      Form.compile(list, state),
      J.identifier("length")
    )
  end

  def rewrite({{:., _, [:erlang, :make_ref]}, _, []}, state) do
    J.literal(false)
  end

  def rewrite({{:., _, [:erlang, :map_size]}, _, [map]}, state) do
    J.member_expression(
      J.call_expression(
        J.member_expression(
          J.identifier("Object"),
          J.identifier("keys")
        ),
        [Form.compile(map, state)]
      ),
      J.identifier("length")
    )
  end

  def rewrite({{:., _, [:erlang, :max]}, _, [first, second]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("max")
      ),
      [Form.compile(first, state), Form.compile(second, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :min]}, _, [first, second]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("min")
      ),
      [Form.compile(first, state), Form.compile(second, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :node]}, _, []}, state) do
    J.identifier("nonode@nohost")
  end

  def rewrite({{:., _, [:erlang, :node]}, _, [_]}, state) do
    J.identifier("nonode@nohost")
  end

  def rewrite({{:., _, [:erlang, :rem]}, _, [first, second]}, state) do
    J.binary_expression(
      :%,
      Form.compile(first, state),
      Form.compile(second, state)
    )
  end

  def rewrite({{:., _, [:erlang, :round]}, _, [number]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("round")
      ),
      [Form.compile(number, state)]
    )
  end

#  def rewrite({{:., _, [:erlang, :send]}, _, [dest, msg]}, state) do
#    raise ":erlang.send not supported"
#  end
#
#  def rewrite({{:., _, [:erlang, :self]}, _, []}, state) do
#    raise ":erlang.self not supported"
#  end
#
#  def rewrite({{:., _, [:erlang, :spawn]}, _, [_fun]}, state) do
#    raise ":erlang.spawn not supported"
#  end
#
#  def rewrite({{:., _, [:erlang, :spawn]}, _, [_module, _fun, _args]}, state) do
#    raise ":erlang.spawn not supported"
#  end
#
#  def rewrite({{:., _, [:erlang, :spawn_link]}, _, [_fun]}, state) do
#    raise ":erlang.spawn_link not supported"
#  end
#
#  def rewrite({{:., _, [:erlang, :spawn_link]}, _, [_module, _fun, _args]}, state) do
#    raise ":erlang.spawn_link not supported"
#  end
#
#  def rewrite({{:., _, [:erlang, :spawn_monitor]}, _, [_fun]}, state) do
#    raise ":erlang.spawn_monitor not supported"
#  end
#
#  def rewrite({{:., _, [:erlang, :spawn_monitor]}, _, [_module, _fun, _args]}, state) do
#    raise ":erlang.spawn_monitor not supported"
#  end

  def rewrite({{:., _, [:erlang, :throw]}, _, [term]}, state) do
    J.throw_statement(
      Form.compile(term, state)
    )
  end

  def rewrite({{:., _, [:erlang, :tl]}, _, [list]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(list, state),
        J.identifier("splice")
      ),
      [J.literal(1)]
    )
  end

  def rewrite({{:., _, [:erlang, :trunc]}, _, [number]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("floor")
      ),
      [Form.compile(number, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :tuple_size]}, _, [tuple]}, state) do
    J.member_expression(
      Form.compile(tuple, state),
      J.identifier("length")
    )
  end

  def rewrite({{:., _, [:erlang, operator]}, _, [left, right]}, state) when operator in [:+, :-, :*, :/, :<, :>, :>=, :==] do
    J.binary_expression(
      operator,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, operator]}, _, [value]}, state) when operator in [:+, :-] do
    J.unary_expression(
      operator,
      true,
      Form.compile(value, state)
    )
  end

  def rewrite({{:., _, [:erlang, :++]}, _, [left, right]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(left, state),
        J.identifier("concat")
      ),
      [Form.compile(right, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :--]}, _, [list, element]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(list, state),
        J.identifier("slice")
      ),
      [
        J.binary_expression(
          :+,
          J.call_expression(
            J.member_expression(
              Form.compile(list, state),
              J.identifier("indexOf")
            ),
            [Form.compile(element, state)]
          ),
          J.literal(1)
        )
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :not]}, _, [value]}, state) do
    J.unary_expression(
      :!,
      true,
      Form.compile(value, state)
    )
  end

  def rewrite({{:., _, [:erlang, :"=<"]}, _, [left, right]}, state) do
    J.binary_expression(
      :<=,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :"/="]}, _, [left, right]}, state) do
    J.binary_expression(
      :!=,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :"=:="]}, _, [left, right]}, state) do
    J.binary_expression(
      :===,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :"=/="]}, _, [left, right]}, state) do
    J.binary_expression(
      :!==,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :element]}, _, [index, tuple]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple, state),
        J.identifier("get")
      ),
      [
        J.binary_expression(
          :-,
          Form.compile(index, state),
          J.literal(1)
        )
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :setelement]}, _, [index, tuple, value]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple, state),
        J.identifier("put_elem")
      ),
      [
        J.binary_expression(
          :-,
          Form.compile(index, state),
          J.literal(1)
        ),
        Form.compile(value, state)
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :orelse]}, _, [left, right]}, state) do
    J.binary_expression(
      :||,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :or]}, _, [left, right]}, state) do
    J.binary_expression(
      :||,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :andalso]}, _, [left, right]}, state) do
    J.binary_expression(
      :&&,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :error]}, _, [error]}, state) do
    J.throw_statement(
      Form.compile(error, state)
    )
  end

  def rewrite({{:., _, [:erlang, :raise]}, _, [_class, reason, _stacktrace]}, state) do
    J.throw_statement(
      Form.compile(reason, state)
    )
  end

  def rewrite({{:., _, [:erlang, :atom_to_binary]}, _, [atom, _]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("keyFor")
      ),
      [Form.compile(atom, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :atom_to_list]}, _, [atom]}, state) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            J.identifier("Symbol"),
            J.identifier("keyFor")
          ),
          [Form.compile(atom, state)]
        ),
        J.identifier("split")
      ),
      [J.literal("")]
    )
  end

  def rewrite({{:., _, [:erlang, :bnot]}, _, [expr]}, state) do
    J.unary_expression(
      :"~",
      true,
      Form.compile(expr, state)
    )
  end

  def rewrite({{:., _, [:erlang, :band]}, _, [left, right]}, state) do
    J.binary_expression(
      :&,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :bor]}, _, [left, right]}, state) do
    J.binary_expression(
      :|,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :bxor]}, _, [left, right]}, state) do
    J.binary_expression(
      :^,
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :bsl]}, _, [left, right]}, state) do
    J.binary_expression(
      :"<<",
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :bsr]}, _, [left, right]}, state) do
    J.binary_expression(
      :">>",
      Form.compile(left, state),
      Form.compile(right, state)
    )
  end

  def rewrite({{:., _, [:erlang, :function_exported]}, _, [_, _, _]}, state) do
    J.literal(true)
  end

  def rewrite({{:., _, [:erlang, :make_tuple]}, _, [size, data]}, state) do
    J.new_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :insert_element]}, _, [index, tuple, term]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple, state),
        J.identifier("put_elem")
      ),
      [
        J.binary_expression(
          :-,
          Form.compile(index, state),
          J.literal(1)
        ),
        Form.compile(term, state)
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :tuple_to_list]}, _, [tuple]}, state) do
    J.member_expression(
      Form.compile(tuple, state),
      J.identifier("values")
    )
  end

  def rewrite({{:., _, [:erlang, :append_element]}, _, [tuple, value]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple, state),
        J.identifier("put_elem")
      ),
      [
        J.member_expression(
          Form.compile(tuple, state),
          J.identifier("length")
        ),
        Form.compile(value, state)
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :delete_element]}, _, [index, tuple]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple, state),
        J.identifier("remove_elem")
      ),
      [Form.compile(index, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_atom]}, _, [binary, _]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [Form.compile(binary, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_existing_atom]}, _, [binary, _]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [Form.compile(binary, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_atom]}, _, [char_list]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [Form.compile(char_list, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_existing_atom]}, _, [char_list]}, state) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [Form.compile(char_list, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_tuple]}, _, [list]}, state) do
    J.new_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      ),
      [
        J.rest_element(
          Form.compile(list, state)
        )
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_float]}, _, [list]}, state) do
    J.call_expression(
      J.identifier("parseFloat"),
      [Form.compile(list, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_integer]}, _, [list]}, state) do
    J.call_expression(
      J.identifier("parseInt"),
      [Form.compile(list, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_integer]}, _, [list, base]}, state) do
    J.call_expression(
      J.identifier("parseInt"),
      [Form.compile(list, state), Form.compile(base, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :integer_to_binary]}, _, [integer]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(integer, state),
        J.identifier("toString")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :integer_to_binary]}, _, [integer, base]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(integer, state),
        J.identifier("toString")
      ),
      [Form.compile(base, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :integer_to_list]}, _, [integer]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(integer, state),
        J.identifier("toString")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :integer_to_list]}, _, [integer, base]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(integer, state),
        J.identifier("toString")
      ),
      [Form.compile(base, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :float_to_binary]}, _, [float]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(float, state),
        J.identifier("toString")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :float_to_binary]}, _, [float, base]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(float, state),
        J.identifier("toString")
      ),
      [Form.compile(base, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :float_to_list]}, _, [float]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(float, state),
        J.identifier("toString")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :float_to_list]}, _, [float, base]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(float, state),
        J.identifier("toString")
      ),
      [Form.compile(base, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_float]}, _, [binary]}, state) do
    J.call_expression(
      J.identifier("parseFloat"),
      [Form.compile(binary, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_integer]}, _, [binary]}, state) do
    J.call_expression(
      J.identifier("parseInt"),
      [Form.compile(binary, state)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_integer]}, _, [binary, base]}, state) do
    J.call_expression(
      J.identifier("parseInt"),
      [Form.compile(binary, state), Form.compile(base, state)]
    )
  end

  def rewrite({{:., _, [:erlang, _]}, _, _}, state) do
    J.call_expression(
        J.identifier("toString"),
      []
    )
  end

end
