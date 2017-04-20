import test from 'ava';

const Elixir = require('../../build/Elixir.App');

test('Functions.contains', async t => {
  const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
  t.is(await Functions.contains(1, []), false);
  t.is(await Functions.contains(1, [1, 2, 3]), true);
  t.is(await Functions.contains(4, [1, 2, 3]), false);
  t.is(await Functions.contains(1, [1]), true);
  t.is(await Functions.contains(4, [1]), false);
  t.is(await Functions.contains('apple', [1]), false);
});

test('Functions.get_object_keys', async t => {
  const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
  t.deepEqual(await Functions.get_object_keys({}), []);
  t.deepEqual(await Functions.get_object_keys({ key: 1 }), ['key']);
  t.deepEqual(
    await Functions.get_object_keys({ key: 1, [Symbol.for('hi')]: 2 }),
    ['key', Symbol.for('hi')],
  );
});

test('Functions.is_valid_character', async t => {
  const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
  t.is(await Functions.is_valid_character(42), true);
  t.is(await Functions.is_valid_character(NaN), false);
});
