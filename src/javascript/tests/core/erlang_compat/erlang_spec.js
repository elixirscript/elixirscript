import test from 'ava';
import Core from '../../../lib/core';

test('is_atom', t => {
  t.is(Core.erlang.is_atom(null), true);
  t.is(Core.erlang.is_atom(true), true);
  t.is(Core.erlang.is_atom(false), true);
  t.is(Core.erlang.is_atom(Symbol.for('error')), true);
  t.is(Core.erlang.is_atom('Hello'), false);
});

test('is_boolean', t => {
  t.is(Core.erlang.is_boolean(null), false);
  t.is(Core.erlang.is_boolean(true), true);
  t.is(Core.erlang.is_boolean(false), true);
  t.is(Core.erlang.is_boolean(Symbol.for('error')), false);
  t.is(Core.erlang.is_boolean('Hello'), false);
});

test('is_number', t => {
  t.is(Core.erlang.is_number(null), false);
  t.is(Core.erlang.is_number(1), true);
  t.is(Core.erlang.is_number(2.3), true);
  t.is(Core.erlang.is_number(Symbol.for('error')), false);
  t.is(Core.erlang.is_number('Hello'), false);
});

test('is_float', t => {
  t.is(Core.erlang.is_float(null), false);
  t.is(Core.erlang.is_float(1), false);
  t.is(Core.erlang.is_float(2.3), true);
  t.is(Core.erlang.is_float(Symbol.for('error')), false);
  t.is(Core.erlang.is_float('Hello'), false);
});

test('is_integer', t => {
  t.is(Core.erlang.is_integer(null), false);
  t.is(Core.erlang.is_integer(1), true);
  t.is(Core.erlang.is_integer(2.3), false);
  t.is(Core.erlang.is_integer(Symbol.for('error')), false);
  t.is(Core.erlang.is_integer('Hello'), false);
});

test('is_function', t => {
  t.is(Core.erlang.is_function(null), false);
  t.is(Core.erlang.is_function(Math.max), true);
  t.is(Core.erlang.is_function(2.3), false);
  t.is(Core.erlang.is_function(Symbol.for('error')), false);
  t.is(Core.erlang.is_function(() => 'hello'), true);
});

test('is_list', t => {
  t.is(Core.erlang.is_list(null), false);
  t.is(Core.erlang.is_list([]), true);
  t.is(Core.erlang.is_list(2.3), false);
  t.is(Core.erlang.is_list(Symbol.for('error')), false);
  t.is(Core.erlang.is_list(() => 'hello'), false);
});

test('atom_to_binary', t => {
  t.is(Core.erlang.atom_to_binary(Symbol.for('error')), 'error');
  t.is(
    Core.erlang.atom_to_binary(Symbol.for('error'), Symbol.for('utf8')),
    'error'
  );

  t.is(Core.erlang.atom_to_binary(null, Symbol.for('utf8')), 'nil');

  t.is(Core.erlang.atom_to_binary(true, Symbol.for('utf8')), 'true');
  t.is(Core.erlang.atom_to_binary(false, Symbol.for('utf8')), 'false');

  t.throws(
    () => Core.erlang.atom_to_binary(Symbol.for('error'), Symbol.for('utf16')),
    Error
  );
});

test('list_concatenation', t => {
  t.deepEqual(Core.erlang.list_concatenation([], []), []);
  t.deepEqual(Core.erlang.list_concatenation([1], []), [1]);
  t.deepEqual(Core.erlang.list_concatenation([1, 2, 3], [4, 5, 6]), [
    1,
    2,
    3,
    4,
    5,
    6
  ]);
});

test('list_subtraction', t => {
  t.deepEqual(Core.erlang.list_subtraction([], []), []);
  t.deepEqual(Core.erlang.list_subtraction([1], []), [1]);
  t.deepEqual(Core.erlang.list_subtraction([1, 2, 3], [4, 5, 6]), [1, 2, 3]);
  t.deepEqual(Core.erlang.list_subtraction([1, 2, 3], [1, 2, 3]), []);
  t.deepEqual(Core.erlang.list_subtraction([1, 2, 3], [1, 2]), [3]);
});
