import test from 'ava';
const Elixir = require('../build/Elixir.App');

test('Atom.to_string/1', async t => {
  const Atom = Elixir.load(Elixir.ElixirScript.Atom);
  const val = await Atom.to_string(Symbol.for('héllo'));
  t.is(val, 'héllo');
});

test('Atom.to_charlist/1', async t => {
  const Atom = Elixir.load(Elixir.ElixirScript.Atom);
  const val = await Atom.to_string(Symbol.for('héllo'));
  t.is(val, 'héllo');
});
