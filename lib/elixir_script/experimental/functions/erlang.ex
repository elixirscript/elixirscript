defmodule ElixirScript.Experimental.Functions.Erlang do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form

  def rewrite({{:., _, [:erlang, :abs]}, _, [number]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("abs")
      ),
      [Form.compile(number)]
    )
  end

  def rewrite({{:., _, [:erlang, :apply]}, _, [fun, args]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(fun),
        J.identifier("apply")
      ),
      [Form.compile(fun), J.array_expression(Enum.map(args, &Form.compile(&1)))]
    )
  end

  def rewrite({{:., _, [:erlang, :apply]}, _, [module, fun, args]}) do
    mod = J.member_expression(
          Form.compile(module),
          Form.compile(fun)
        )

    J.call_expression(
      J.member_expression(
        mod,
        J.identifier("apply")
      ),
      [mod, J.array_expression(Enum.map(args, &Form.compile(&1)))]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_part]}, _, [binary, start, length]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(binary),
        J.identifier("substring")
      ),
      [Form.compile(start), Form.compile(length)]
    )
  end

  def rewrite({{:., _, [:erlang, :bit_size]}, _, [bitstring]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(bitstring),
        J.identifier("bit_size")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :byte_size]}, _, [bitstring]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(bitstring),
        J.identifier("byte_size")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :div]}, _, [left, right]}) do
    J.binary_expression(
      :/,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :exit]}, _, [reason]}) do
    J.literal(0)
  end

  def rewrite({{:., _, [:erlang, :hd]}, _, [list]}) do
    J.member_expression(
      Form.compile(list),
      J.literal(0),
      true
    )
  end

  def rewrite({{:., _, [:erlang, :is_atom]}, _, [term]}) do
    J.binary_expression(
      :typeof,
      Form.compile(term),
      J.literal("symbol")
    )
  end

  def rewrite({{:., _, [:erlang, :is_binary]}, _, [term]}) do
    J.binary_expression(
      :typeof,
      Form.compile(term),
      J.literal("string")
    )
  end

  def rewrite({{:., _, [:erlang, :is_bitstring]}, _, [term]}) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term),
        J.literal("string")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term),
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

  def rewrite({{:., _, [:erlang, :is_boolean]}, _, [term]}) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term),
        J.literal("boolean")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term),
        J.identifier("Boolean")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_float]}, _, [term]}) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term),
        J.literal("number")
      ),
      J.binary_expression(
        :&&,
        J.binary_expression(
          :instanceof,
          Form.compile(term),
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
            [Form.compile(term)]
          )
        )
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_function]}, _, [term]}) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term),
        J.literal("function")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term),
        J.identifier("Function")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_function]}, _, [term, _]}) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term),
        J.literal("function")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term),
        J.identifier("Function")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_integer]}, _, [term]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Number"),
        J.identifier("isInteger")
      ),
      [Form.compile(term)]
    )
  end

  def rewrite({{:., _, [:erlang, :is_list]}, _, [term]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Array"),
        J.identifier("isArray")
      ),
      [Form.compile(term)]
    )
  end

  def rewrite({{:., _, [:erlang, :is_number]}, _, [term]}) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term),
        J.literal("number")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term),
        J.identifier("Number")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_pid]}, _, [term]}) do
    J.binary_expression(
      :instanceof,
      Form.compile(term),
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("PID")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_port]}, _, [_term]}) do
    J.literal(false)
  end

  def rewrite({{:., _, [:erlang, :is_reference]}, _, [_term]}) do
    J.literal(false)
  end

  def rewrite({{:., _, [:erlang, :is_tuple]}, _, [term]}) do
    J.binary_expression(
      :instanceof,
      Form.compile(term),
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :is_map]}, _, [term]}) do
    J.binary_expression(
      :||,
      J.binary_expression(
        :typeof,
        Form.compile(term),
        J.literal("object")
      ),
      J.binary_expression(
        :instanceof,
        Form.compile(term),
        J.identifier("Object")
      )
    )
  end

  def rewrite({{:., _, [:erlang, :length]}, _, [list]}) do
    J.member_expression(
      Form.compile(list),
      J.identifier("length")
    )
  end

  def rewrite({{:., _, [:erlang, :make_ref]}, _, []}) do
    J.literal(false)
  end

  def rewrite({{:., _, [:erlang, :map_size]}, _, [map]}) do
    J.member_expression(
      J.call_expression(
        J.member_expression(
          J.identifier("Object"),
          J.identifier("keys")
        ),
        [Form.compile(map)]
      ),
      J.identifier("length")
    )
  end

  def rewrite({{:., _, [:erlang, :max]}, _, [first, second]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("max")
      ),
      [Form.compile(first), Form.compile(second)]
    )
  end

  def rewrite({{:., _, [:erlang, :min]}, _, [first, second]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("min")
      ),
      [Form.compile(first), Form.compile(second)]
    )
  end

  def rewrite({{:., _, [:erlang, :node]}, _, []}) do
    J.identifier("nonode@nohost")
  end

  def rewrite({{:., _, [:erlang, :node]}, _, [_]}) do
    J.identifier("nonode@nohost")
  end

  def rewrite({{:., _, [:erlang, :rem]}, _, [first, second]}) do
    J.binary_expression(
      :%,
      Form.compile(first),
      Form.compile(second)
    )
  end

  def rewrite({{:., _, [:erlang, :round]}, _, [number]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("round")
      ),
      [Form.compile(number)]
    )
  end

  def rewrite({{:., _, [:erlang, :send]}, _, [dest, msg]}) do
    raise ":erlang.send not supported"
  end

  def rewrite({{:., _, [:erlang, :self]}, _, []}) do
    raise ":erlang.self not supported"
  end

  def rewrite({{:., _, [:erlang, :spawn]}, _, [_fun]}) do
    raise ":erlang.spawn not supported"
  end

  def rewrite({{:., _, [:erlang, :spawn]}, _, [_module, _fun, _args]}) do
    raise ":erlang.spawn not supported"
  end

  def rewrite({{:., _, [:erlang, :spawn_link]}, _, [_fun]}) do
    raise ":erlang.spawn_link not supported"
  end

  def rewrite({{:., _, [:erlang, :spawn_link]}, _, [_module, _fun, _args]}) do
    raise ":erlang.spawn_link not supported"
  end

  def rewrite({{:., _, [:erlang, :spawn_monitor]}, _, [_fun]}) do
    raise ":erlang.spawn_monitor not supported"
  end

  def rewrite({{:., _, [:erlang, :spawn_monitor]}, _, [_module, _fun, _args]}) do
    raise ":erlang.spawn_monitor not supported"
  end

  def rewrite({{:., _, [:erlang, :throw]}, _, [term]}) do
    J.throw_statement(
      Form.compile(term)
    )
  end

  def rewrite({{:., _, [:erlang, :tl]}, _, [list]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(list),
        J.identifier("splice")
      ),
      [J.literal(1)]
    )
  end

  def rewrite({{:., _, [:erlang, :trunc]}, _, [number]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Math"),
        J.identifier("floor")
      ),
      [Form.compile(number)]
    )
  end

  def rewrite({{:., _, [:erlang, :tuple_size]}, _, [tuple]}) do
    J.member_expression(
      Form.compile(tuple),
      J.identifier("length")
    )
  end

  def rewrite({{:., _, [:erlang, operator]}, _, [left, right]}) when operator in [:+, :-, :*, :/, :<, :>, :>=, :==] do
    J.binary_expression(
      operator,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, operator]}, _, [value]}) when operator in [:+, :-] do
    J.unary_expression(
      operator,
      true,
      Form.compile(value)
    )
  end

  def rewrite({{:., _, [:erlang, :++]}, _, [left, right]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(left),
        J.identifier("concat")
      ),
      [Form.compile(right)]
    )
  end

  def rewrite({{:., _, [:erlang, :--]}, _, [list, element]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(list),
        J.identifier("slice")
      ),
      [
        J.binary_expression(
          :+,
          J.call_expression(
            J.member_expression(
              Form.compile(list),
              J.identifier("indexOf")
            ),
            [Form.compile(element)]
          ),
          J.literal(1)
        )
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :not]}, _, [value]}) do
    J.unary_expression(
      :!,
      true,
      Form.compile(value)
    )
  end

  def rewrite({{:., _, [:erlang, :"=<"]}, _, [left, right]}) do
    J.binary_expression(
      :<=,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :"/="]}, _, [left, right]}) do
    J.binary_expression(
      :!=,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :"=:="]}, _, [left, right]}) do
    J.binary_expression(
      :===,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :"=/="]}, _, [left, right]}) do
    J.binary_expression(
      :!==,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :element]}, _, [index, tuple]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple),
        J.identifier("get")
      ),
      [
        J.binary_expression(
          :-,
          Form.compile(index),
          J.literal(1)
        )
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :setelement]}, _, [index, tuple, value]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple),
        J.identifier("put_elem")
      ),
      [
        J.binary_expression(
          :-,
          Form.compile(index),
          J.literal(1)
        ),
        Form.compile(value)
      ]
    )

    quote do: unquote(tuple).put_elem(unquote(index) - 1, unquote(value))
  end

  def rewrite({{:., _, [:erlang, :orelse]}, _, [left, right]}) do
    J.binary_expression(
      :||,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :or]}, _, [left, right]}) do
    J.binary_expression(
      :||,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :andalso]}, _, [left, right]}) do
    J.binary_expression(
      :&&,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :error]}, _, [error]}) do
    J.throw_statement(
      Form.compile(error)
    )
  end

  def rewrite({{:., _, [:erlang, :raise]}, _, [_class, reason, _stacktrace]}) do
    J.throw_statement(
      Form.compile(reason)
    )
  end

  def rewrite({{:., _, [:erlang, :atom_to_binary]}, _, [atom, _]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("keyFor")
      ),
      [Form.compile(atom)]
    )
  end

  def rewrite({{:., _, [:erlang, :atom_to_list]}, _, [atom]}) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            J.identifier("Symbol"),
            J.identifier("keyFor")
          ),
          [Form.compile(atom)]
        ),
        J.identifier("split")
      ),
      [J.literal("")]
    )
  end

  def rewrite({{:., _, [:erlang, :bnot]}, _, [expr]}) do
    J.unary_expression(
      :"~",
      true,
      Form.compile(expr)
    )
  end

  def rewrite({{:., _, [:erlang, :band]}, _, [left, right]}) do
    J.binary_expression(
      :&,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :bor]}, _, [left, right]}) do
    J.binary_expression(
      :|,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :bxor]}, _, [left, right]}) do
    J.binary_expression(
      :^,
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :bsl]}, _, [left, right]}) do
    J.binary_expression(
      :"<<",
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :bsr]}, _, [left, right]}) do
    J.binary_expression(
      :">>",
      Form.compile(left),
      Form.compile(right)
    )
  end

  def rewrite({{:., _, [:erlang, :function_exported]}, _, [_, _, _]}) do
    J.literal(true)
  end

  def rewrite({{:., _, [:erlang, :make_tuple]}, _, [size, data]}) do
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

  def rewrite({{:., _, [:erlang, :insert_element]}, _, [index, tuple, term]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple),
        J.identifier("put_elem")
      ),
      [
        J.binary_expression(
          :-,
          Form.compile(index),
          1
        ),
        Form.compile(term)
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :tuple_to_list]}, _, [tuple]}) do
    J.member_expression(
      Form.compile(tuple),
      J.identifier("values")
    )
  end

  def rewrite({{:., _, [:erlang, :append_element]}, _, [tuple, value]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple),
        J.identifier("put_elem")
      ),
      [
        J.member_expression(
          Form.compile(tuple),
          J.identifier("length")
        ),
        Form.compile(value)
      ]
    )

    quote do: unquote(tuple).put_elem(unquote(tuple).length, unquote(value))
  end

  def rewrite({{:., _, [:erlang, :delete_element]}, _, [index, tuple]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(tuple),
        J.identifier("remove_elem")
      ),
      [Form.compile(index)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_atom]}, _, [binary, _]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [Form.compile(binary)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_existing_atom]}, _, [binary, _]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [Form.compile(binary)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_atom]}, _, [char_list]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [Form.compile(char_list)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_existing_atom]}, _, [char_list]}) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [Form.compile(char_list)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_tuple]}, _, [list]}) do
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
          Form.compile(list)
        )
      ]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_float]}, _, [list]}) do
    J.call_expression(
      J.identifier("parseFloat"),
      [Form.compile(list)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_integer]}, _, [list]}) do
    J.call_expression(
      J.identifier("parseInt"),
      [Form.compile(list)]
    )
  end

  def rewrite({{:., _, [:erlang, :list_to_integer]}, _, [list, base]}) do
    J.call_expression(
      J.identifier("parseInt"),
      [Form.compile(list), Form.compile(base)]
    )
  end

  def rewrite({{:., _, [:erlang, :integer_to_binary]}, _, [integer]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(integer),
        J.identifier("toString")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :integer_to_binary]}, _, [integer, base]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(integer),
        J.identifier("toString")
      ),
      [Form.compile(base)]
    )
  end

  def rewrite({{:., _, [:erlang, :integer_to_list]}, _, [integer]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(integer),
        J.identifier("toString")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :integer_to_list]}, _, [integer, base]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(integer),
        J.identifier("toString")
      ),
      [Form.compile(base)]
    )
  end

  def rewrite({{:., _, [:erlang, :float_to_binary]}, _, [float]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(float),
        J.identifier("toString")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :float_to_binary]}, _, [float, base]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(float),
        J.identifier("toString")
      ),
      [Form.compile(base)]
    )
  end

  def rewrite({{:., _, [:erlang, :float_to_list]}, _, [float]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(float),
        J.identifier("toString")
      ),
      []
    )
  end

  def rewrite({{:., _, [:erlang, :float_to_list]}, _, [float, base]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(float),
        J.identifier("toString")
      ),
      [Form.compile(base)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_float]}, _, [binary]}) do
    J.call_expression(
      J.identifier("parseFloat"),
      [Form.compile(binary)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_integer]}, _, [binary]}) do
    J.call_expression(
      J.identifier("parseInt"),
      [Form.compile(binary)]
    )
  end

  def rewrite({{:., _, [:erlang, :binary_to_integer]}, _, [binary, base]}) do
    J.call_expression(
      J.identifier("parseInt"),
      [Form.compile(binary), Form.compile(base)]
    )
  end

end
