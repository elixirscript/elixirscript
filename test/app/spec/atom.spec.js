import test from 'ava';
const Elixir = require('../build/Elixir.App');

test('Atom.to_string/1', t => {
  const exports = Elixir.load(Elixir.ElixirScript.Atom);
  t.is(exports.to_string(Symbol.for('héllo')), 'héllo');
});

test('Atom.to_charlist/1', t => {
  const exports = Elixir.load(Elixir.ElixirScript.Atom);
  t.is(exports.to_string(Symbol.for('héllo')), 'héllo');
});
