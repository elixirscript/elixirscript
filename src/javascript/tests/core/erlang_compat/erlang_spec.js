import test from 'ava';
import Core from '../../../lib/core';

test('atom_to_binary2', t => {
  t.is(Core.erlang.atom_to_binary2(Symbol.for('error')), 'error');
  t.is(
    Core.erlang.atom_to_binary2(Symbol.for('error'), Symbol.for('utf8')),
    'error'
  );

  t.throws(
    () => Core.erlang.atom_to_binary2(Symbol.for('error'), Symbol.for('utf16')),
    Error
  );
});

test('list_concatenation2', t => {
  t.deepEqual(Core.erlang.list_concatenation2([], []), []);
  t.deepEqual(Core.erlang.list_concatenation2([1], []), [1]);
  t.deepEqual(Core.erlang.list_concatenation2([1, 2, 3], [4, 5, 6]), [
    1,
    2,
    3,
    4,
    5,
    6,
  ]);
});

test('list_subtraction2', t => {
  t.deepEqual(Core.erlang.list_subtraction2([], []), []);
  t.deepEqual(Core.erlang.list_subtraction2([1], []), [1]);
  t.deepEqual(Core.erlang.list_subtraction2([1, 2, 3], [4, 5, 6]), [1, 2, 3]);
  t.deepEqual(Core.erlang.list_subtraction2([1, 2, 3], [1, 2, 3]), []);
  t.deepEqual(Core.erlang.list_subtraction2([1, 2, 3], [1, 2]), [3]);
});
