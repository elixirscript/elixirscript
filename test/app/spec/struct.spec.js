import test from 'ava';
const Elixir = require('../build/Elixir.App');

test('Create Struct', t => {
  const User = Elixir.load(Elixir.User);

  let struct = User.__struct__();

  t.deepEqual(Object.getOwnPropertySymbols(struct), [
    Symbol.for('__struct__'),
    Symbol.for('first'),
    Symbol.for('last'),
  ]);

  t.deepEqual(struct[Symbol.for('__struct__')], Symbol.for('Elixir.User'));
  t.deepEqual(struct[Symbol.for('first')], null);
  t.deepEqual(struct[Symbol.for('last')], null);

  struct = User.__struct__({ [Symbol.for('first')]: 'John' });

  t.deepEqual(struct[Symbol.for('first')], 'John');
});

test('Protocol', t => {
  const User = Elixir.load(Elixir.User);
  const StringChars = Elixir.load(Elixir.ElixirScript.String.Chars);

  const struct = User.__struct__({
    [Symbol.for('first')]: 'John',
    [Symbol.for('last')]: 'Doe',
  });

  t.deepEqual(StringChars.to_string(struct), 'JohnDoe');
});
