import test from 'ava';
const Elixir = require('../build/Elixir.App');

test('Create Exception', t => {
  const ArgumentError = Elixir.load(Elixir.ElixirScript.ArgumentError);

  let struct = ArgumentError.__struct__();

  t.deepEqual(Object.getOwnPropertySymbols(struct), [
    Symbol.for('__struct__'),
    Symbol.for('message'),
    Symbol.for('__exception__'),
  ]);

  t.deepEqual(
    struct[Symbol.for('__struct__')],
    Symbol.for('Elixir.ElixirScript.ArgumentError'),
  );
  t.is(struct[Symbol.for('__exception__')], true);
  t.is(struct[Symbol.for('message')], 'argument error');

  struct = ArgumentError.__struct__({
    [Symbol.for('message')]: 'new argument error',
  });

  t.is(struct[Symbol.for('message')], 'new argument error');
});

test('raise exception', t => {
  const User = Elixir.load(Elixir.User);
  const ArgumentError = Elixir.load(Elixir.ElixirScript.ArgumentError);

  try {
    User.throw_something();
  } catch (e) {
    t.is(e[Symbol.for('message')], 'argument error');
  }
});
