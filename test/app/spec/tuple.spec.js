import test from 'ava';
const Elixir = require('../build/Elixir.App');
const Tuple = require('../../../src/javascript/lib/core').default.Tuple;

test('Tuple.duplicate/2', t => {
  const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
  t.deepEqual(TupleModule.duplicate(Symbol.for('foo'), 0).values, []);
  t.deepEqual(TupleModule.duplicate(Symbol.for('foo'), 3).values, [
    Symbol.for('foo'),
    Symbol.for('foo'),
    Symbol.for('foo'),
  ]);
});

test('Tuple.insert_at/3', t => {
  const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
  const tuple = new Tuple(Symbol.for('bar'), Symbol.for('baz'));
  t.deepEqual(TupleModule.insert_at(tuple, 0, Symbol.for('foo')).values, [
    Symbol.for('foo'),
    Symbol.for('bar'),
    Symbol.for('baz'),
  ]);
});

test('Tuple.append/2', t => {
  const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
  const tuple = new Tuple(Symbol.for('foo'), Symbol.for('bar'));
  t.deepEqual(TupleModule.append(tuple, Symbol.for('baz')).values, [
    Symbol.for('foo'),
    Symbol.for('bar'),
    Symbol.for('baz'),
  ]);
});

test('Tuple.delete_at/2', t => {
  const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
  const tuple = new Tuple(
    Symbol.for('foo'),
    Symbol.for('bar'),
    Symbol.for('baz'),
  );
  t.deepEqual(TupleModule.delete_at(tuple, 0).values, [
    Symbol.for('bar'),
    Symbol.for('baz'),
  ]);
});
