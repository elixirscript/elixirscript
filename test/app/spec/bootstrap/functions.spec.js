import test from 'ava';
const Elixir = require('../../build/Elixir.App');

test('Functions.contains', t => {
  const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
  t.is(Functions.contains(1, []), false);
  t.is(Functions.contains(1, [1, 2, 3]), true);
  t.is(Functions.contains(4, [1, 2, 3]), false);
  t.is(Functions.contains(1, [1]), true);
  t.is(Functions.contains(4, [1]), false);
  t.is(Functions.contains('apple', [1]), false);
});

test('Functions.get_object_keys', t => {
  const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
  t.deepEqual(Functions.get_object_keys({}), []);
  t.deepEqual(Functions.get_object_keys({ key: 1 }), ['key']);
  t.deepEqual(Functions.get_object_keys({ key: 1, [Symbol.for('hi')]: 2 }), [
    'key',
    Symbol.for('hi'),
  ]);
});

test('Functions.is_valid_character', t => {
  const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
  t.is(Functions.is_valid_character(42), true);
  t.is(Functions.is_valid_character(NaN), false);
});
