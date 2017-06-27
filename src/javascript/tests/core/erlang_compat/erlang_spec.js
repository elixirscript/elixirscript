import test from 'ava';
import Core from '../../../lib/core';

test('atom_to_binary', t => {
  t.is(Core.erlang.atom_to_binary(Symbol.for('error')), 'error');
  t.is(
    Core.erlang.atom_to_binary(Symbol.for('error'), Symbol.for('utf8')),
    'error'
  );

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
    6,
  ]);
});

test('list_subtraction', t => {
  t.deepEqual(Core.erlang.list_subtraction([], []), []);
  t.deepEqual(Core.erlang.list_subtraction([1], []), [1]);
  t.deepEqual(Core.erlang.list_subtraction([1, 2, 3], [4, 5, 6]), [1, 2, 3]);
  t.deepEqual(Core.erlang.list_subtraction([1, 2, 3], [1, 2, 3]), []);
  t.deepEqual(Core.erlang.list_subtraction([1, 2, 3], [1, 2]), [3]);
});
