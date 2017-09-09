// http://erlang.org/doc/man/erlang.html
import ErlangTypes from 'erlang-types';
import lists from './lists';

const selfPID = new ErlangTypes.PID();

function is_boolean(value) {
  return typeof value === 'boolean' || value instanceof Boolean;
}

function atom_to_binary(atom, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  if (atom === null) {
    return 'nil';
  } else if (is_boolean(atom)) {
    return atom.toString();
  } else if (atom.__MODULE__) {
    return Symbol.keyFor(atom.__MODULE__);
  }

  return Symbol.keyFor(atom);
}

function atom_to_list(atom) {
  return atom_to_binary(atom);
}

function binary_to_atom(binary, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  if (binary === 'nil') {
    return null;
  } else if (binary === 'true') {
    return true;
  } else if (binary === 'false') {
    return false;
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

function arrayEquals(left, right) {
  if (!Array.isArray(right)) {
    return false;
  }

  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i++) {
    if (equals(left[i], right[i]) === false) {
      return false;
    }
  }

  return true;
}

function tupleEquals(left, right) {
  if (right instanceof ErlangTypes.Tuple === false) {
    return false;
  }

  if (left.length !== right.length) {
    return false;
  }

  return arrayEquals(left.values, right.values);
}

function bitstringEquals(left, right) {
  if (right instanceof ErlangTypes.BitString === false) {
    return false;
  }

  if (left.length !== right.length) {
    return false;
  }

  return arrayEquals(left.value, right.value);
}

function pidEquals(left, right) {
  if (right instanceof ErlangTypes.PID === false) {
    return false;
  }

  return left.id === right.id;
}

function referenceEquals(left, right) {
  if (right instanceof ErlangTypes.Reference === false) {
    return false;
  }

  return left.id === right.id;
}

function mapEquals(left, right) {
  if (right instanceof Map === false) {
    return false;
  }

  const leftEntries = Array.from(left.entries());
  const rightEntries = Array.from(right.entries());

  return arrayEquals(leftEntries, rightEntries);
}

function equals(left, right) {
  if (Array.isArray(left)) {
    return arrayEquals(left, right);
  }

  if (left instanceof ErlangTypes.Tuple) {
    return tupleEquals(left, right);
  }

  if (left instanceof ErlangTypes.PID) {
    return pidEquals(left, right);
  }

  if (left instanceof ErlangTypes.BitString) {
    return bitstringEquals(left, right);
  }

  if (left instanceof ErlangTypes.Reference) {
    return referenceEquals(left, right);
  }

  if (left instanceof Map) {
    return mapEquals(left, right);
  }

  return left === right;
}

function div(left, right) {
  return left / right;
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
  if (value === null) {
    return true;
  } else if (is_boolean(value)) {
    return true;
  }

  return typeof value === 'symbol' || value instanceof Symbol || value.__MODULE__ != null;
}

function is_bitstring(value) {
  return value instanceof ErlangTypes.BitString;
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
  return value instanceof Map;
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
  const tupleData = [...tuple1.values];

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
  const list = [...tuple.values];
  list.splice(index - 1, 0, term);

  return new ErlangTypes.Tuple(...list);
}

function append_element(tuple, term) {
  const list = [...tuple.values];
  list.push(term);

  return new ErlangTypes.Tuple(...list);
}

function delete_element(index, tuple) {
  const list = [...tuple.values];
  list.splice(index - 1, 1);

  return new ErlangTypes.Tuple(...list);
}

function tuple_to_list(tuple) {
  const list = [...tuple.values];
  return list;
}

function abs(number) {
  return Math.abs(number);
}

function apply(...args) {
  if (args.length === 2) {
    return args[0].apply(this, ...args[1]);
  }

  return args[0][atom_to_binary(args[1])].apply(this, ...args[2]);
}

function binary_part(binary, start, _length) {
  return binary.substring(start, start + _length);
}

function bit_size(bitstring) {
  return bitstring.bit_size;
}

function byte_size(bitstring) {
  if (typeof bitstring === 'string' || bitstring instanceof String) {
    return bitstring.length;
  }
  return bitstring.byte_size;
}

function hd(list) {
  return list[0];
}

function length(list) {
  return list.length;
}

function make_ref() {
  return new ErlangTypes.Reference();
}

function map_size(map) {
  return map.size;
}

function max(first, second) {
  return Math.max(first, second);
}

function min(first, second) {
  return Math.min(first, second);
}

function round(number) {
  return Math.round(number);
}

function tl(list) {
  return list.slice(1);
}

function trunc(number) {
  return Math.trunc(number);
}

function tuple_size(tuple) {
  return tuple.length;
}

function binary_to_float(str) {
  return parseFloat(str);
}

function binary_to_integer(str, base = 10) {
  return parseInt(str, base);
}

function process_info(pid, item) {
  if (item) {
    if (item === Symbol.for('current_stacktrace')) {
      return new ErlangTypes.Tuple(item, []);
    }

    return new ErlangTypes.Tuple(item, null);
  }

  return [];
}

function list_to_binary(iolist) {
  const iolistFlattened = lists.flatten(iolist);

  const value = iolistFlattened.reduce((acc, current) => {
    if (current === null) {
      return acc;
    } else if (is_integer(current)) {
      return acc + String.fromCodePoint(current);
    } else if (is_bitstring(current)) {
      return acc + String.fromCodePoint(...current.value);
    }

    return acc + current;
  }, '');

  return value;
}

function iolist_to_binary(ioListOrBinary) {
  if (ioListOrBinary === null) {
    return '';
  }

  if (is_binary(ioListOrBinary)) {
    return ioListOrBinary;
  }

  if (is_bitstring(ioListOrBinary)) {
    return String.fromCodePoint(...ioListOrBinary.value);
  }

  if (is_number(ioListOrBinary)) {
    return String.fromCodePoint(ioListOrBinary);
  }

  const iolistFlattened = lists.flatten(ioListOrBinary);

  const value = iolistFlattened.reduce((acc, current) => {
    if (current === null) {
      return acc;
    } else if (is_integer(current)) {
      return acc + String.fromCodePoint(current);
    } else if (is_bitstring(current)) {
      return acc + String.fromCodePoint(...current.value);
    }

    return acc + iolist_to_binary(current);
  }, '');

  return value;
}

function io_size(ioListOrBinary) {
  return iolist_to_binary(ioListOrBinary).length;
}

function integer_to_binary(integer, base = 10) {
  return integer.toString(base);
}

function node() {
  return Symbol.for('nonode@nohost');
}

function nodes(arg = []) {
  const nodeTypes = Array.isArray(arg) ? arg : [arg];
  const nodesFound = [];

  for (const nodeType of nodeTypes) {
    if (nodeType === Symbol.for('this')) {
      nodesFound.push(Symbol.for('nonode@nohost'));
      console.log(nodesFound);
    }
  }
  return nodesFound;
}

function self() {
  return selfPID;
}

function _throw(term) {
  throw term;
}

function error(reason) {
  throw new ErlangTypes.Tuple(reason, []);
}

function exit(...args) {
  if (args.length === 2) {
    throw args[1];
  } else {
    throw args[0];
  }
}

function raise(_class, reason) {
  if (_class === Symbol.for('throw')) {
    _throw(reason);
  } else if (_class === Symbol.for('error')) {
    error(reason);
  } else {
    exit(reason);
  }
}

function function_exported(module, _function) {
  return module[_function] != null;
}

export default {
  atom_to_binary,
  binary_to_atom,
  binary_to_existing_atom,
  list_concatenation,
  list_subtraction,
  div,
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
  abs,
  apply,
  binary_part,
  bit_size,
  byte_size,
  hd,
  length,
  make_ref,
  map_size,
  max,
  min,
  round,
  tl,
  trunc,
  tuple_size,
  binary_to_float,
  binary_to_integer,
  process_info,
  iolist_to_binary,
  io_size,
  integer_to_binary,
  atom_to_list,
  node,
  self,
  throw: _throw,
  error,
  exit,
  raise,
  list_to_binary,
  nodes,
  function_exported,
  equals,
};
