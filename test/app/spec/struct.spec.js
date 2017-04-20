import test from 'ava';
const Elixir = require('../build/Elixir.App');

test('Create Struct', async t => {
  const User = Elixir.load(Elixir.User);

  let struct = await User.__struct__();

  t.deepEqual(Object.getOwnPropertySymbols(struct), [
    Symbol.for('__struct__'),
    Symbol.for('first'),
    Symbol.for('last'),
  ]);

  t.deepEqual(struct[Symbol.for('__struct__')], Symbol.for('Elixir.User'));
  t.deepEqual(struct[Symbol.for('first')], null);
  t.deepEqual(struct[Symbol.for('last')], null);

  struct = await User.__struct__({ [Symbol.for('first')]: 'John' });

  t.deepEqual(struct[Symbol.for('first')], 'John');
});

test('Protocol', async t => {
  const User = Elixir.load(Elixir.User);
  const StringChars = Elixir.load(Elixir.ElixirScript.String.Chars);

  const struct = await User.__struct__({
    [Symbol.for('first')]: 'John',
    [Symbol.for('last')]: 'Doe',
  });

  t.deepEqual(await StringChars.to_string(struct), 'JohnDoe');
});
