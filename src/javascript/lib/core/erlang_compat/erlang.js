// http://erlang.org/doc/man/erlang.html
import ErlangTypes from 'erlang-types';

function atom_to_binary(atom, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  return Symbol.keyFor(atom);
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
  return value instanceof Symbol || value.__MODULE__ === true;
}

function is_bitstring(value) {
  return value instanceof ErlangTypes.BitString;
}

function is_boolean(value) {
  return value instanceof Boolean;
}

function is_float(value) {
  return value instanceof Number && !Number.isInteger(value);
}

function is_function(value) {
  return value instanceof Function;
}

function is_integer(value) {
  return Number.isInteger(value);
}

function is_list(value) {
  return Array.isArray(value);
}

function is_map(value) {
  return value instanceof Object;
}

function is_number(value) {
  return value instanceof Number;
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
  return value instanceof String;
}

export default {
  atom_to_binary,
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
};
