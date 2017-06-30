// http://erlang.org/doc/man/erlang.html
import ErlangTypes from 'erlang-types';

function atom_to_binary(atom, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  if (atom.__MODULE__) {
    return Symbol.keyFor(atom.__MODULE__);
  }

  return Symbol.keyFor(atom);
}

function binary_to_atom(binary, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  return Symbol.for(binary);
}

function binary_to_existing_atom(binary, encoding = Symbol.for('utf8')) {
  return binary_to_atom(binary, encoding);
}

function list_concatenation(list1, list2) {
  return list1.concat(list2);
}

function list_subtraction(list1, list2) {
  const list = [...list1];

  for (const item of list2) {
    const index = list.indexOf(item);

    if (index > -1) {
      list.splice(index, 1);
    }
  }

  return list;
}

function plus(left, right) {
  if (!right) {
    return +left;
  }

  return left + right;
}

function minus(left, right) {
  if (!right) {
    return -left;
  }

  return left - right;
}

function multiply(left, right) {
  return left * right;
}

function div(left, right) {
  return left / right;
}

function equal(left, right) {
  return left == right;
}

function doesNotEqual(left, right) {
  return left != right;
}

function greaterThan(left, right) {
  return left > right;
}

function greaterThanOrEqualTo(left, right) {
  return left >= right;
}

function lessThan(left, right) {
  return left < right;
}

function lessThanOrEqualTo(left, right) {
  return left <= right;
}

function strictlyEqual(left, right) {
  return left === right;
}

function doesNotStrictlyEqual(left, right) {
  return left !== right;
}

function and(left, right) {
  return left && right;
}

function or(left, right) {
  return left || right;
}

function not(x) {
  return !x;
}

function rem(left, right) {
  return left % right;
}

function band(left, right) {
  return left & right;
}

function bor(left, right) {
  return left | right;
}

function bnot(x) {
  return ~x;
}

function bsl(left, right) {
  return left << right;
}

function bsr(left, right) {
  return left >> right;
}

function bxor(left, right) {
  return left ^ right;
}

function is_atom(value) {
  return (
    typeof value === 'symbol' || value instanceof Symbol || value.__MODULE__
  );
}

function is_bitstring(value) {
  return value instanceof ErlangTypes.BitString;
}

function is_boolean(value) {
  return typeof value === 'boolean' || value instanceof Boolean;
}

function is_number(value) {
  return typeof value === 'number' || value instanceof Number;
}

function is_float(value) {
  return is_number(value) && !Number.isInteger(value);
}

function is_function(value) {
  return typeof value === 'function' || value instanceof Function;
}

function is_integer(value) {
  return Number.isInteger(value);
}

function is_list(value) {
  return Array.isArray(value);
}

function is_map(value) {
  return typeof value === 'object' || value instanceof Object;
}

function is_pid(value) {
  return value instanceof ErlangTypes.PID;
}

function is_port() {
  return false;
}

function is_reference(value) {
  return value instanceof ErlangTypes.Reference;
}

function is_tuple(value) {
  return value instanceof ErlangTypes.Tuple;
}

function is_binary(value) {
  return typeof value === 'string' || value instanceof String;
}

function element(n, tuple) {
  return tuple.get(n - 1);
}

function setelement(index, tuple1, value) {
  const tupleData = [...tuple1.data];

  tupleData[index - 1] = value;

  return new ErlangTypes.Tuple(...tupleData);
}

function make_tuple(arity, initialValue) {
  const list = [];

  for (let i = 0; i < arity; i++) {
    list.push(initialValue);
  }

  return new ErlangTypes.Tuple(...list);
}

function insert_element(index, tuple, term) {
  const list = [...tuple.data];
  list.splice(index - 1, 0, term);

  return new ErlangTypes.Tuple(...list);
}

function append_element(tuple, term) {
  const list = [...tuple.data];
  list.push(term);

  return new ErlangTypes.Tuple(...list);
}

function delete_element(index, tuple) {
  const list = [...tuple.data];
  list.splice(index - 1, 1);

  return new ErlangTypes.Tuple(...list);
}

function tuple_to_list(tuple) {
  const list = [...tuple.data];
  return list;
}

export default {
  atom_to_binary,
  binary_to_atom,
  binary_to_existing_atom,
  list_concatenation,
  list_subtraction,
  plus,
  minus,
  multiply,
  div,
  equal,
  greaterThan,
  greaterThanOrEqualTo,
  lessThan,
  lessThanOrEqualTo,
  doesNotEqual,
  strictlyEqual,
  doesNotStrictlyEqual,
  and,
  or,
  not,
  rem,
  band,
  bor,
  bsl,
  bsr,
  bxor,
  bnot,
  is_bitstring,
  is_boolean,
  is_float,
  is_function,
  is_integer,
  is_list,
  is_map,
  is_number,
  is_pid,
  is_port,
  is_reference,
  is_tuple,
  is_atom,
  is_binary,
  element,
  setelement,
  make_tuple,
  insert_element,
  append_element,
  delete_element,
  tuple_to_list,
};
