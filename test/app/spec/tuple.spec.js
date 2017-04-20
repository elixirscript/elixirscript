import test from 'ava';
const Elixir = require('../build/Elixir.App');
const Tuple = require('../../../src/javascript/lib/core').default.Tuple;

test('Tuple.duplicate/2', async t => {
  const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);

  let val = await TupleModule.duplicate(Symbol.for('foo'), 0);
  t.deepEqual(val.values, []);

  val = await TupleModule.duplicate(Symbol.for('foo'), 3);
  t.deepEqual(val.values, [
    Symbol.for('foo'),
    Symbol.for('foo'),
    Symbol.for('foo'),
  ]);
});

test('Tuple.insert_at/3', async t => {
  const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
  const tuple = new Tuple(Symbol.for('bar'), Symbol.for('baz'));
  let val = await TupleModule.insert_at(tuple, 0, Symbol.for('foo'));

  t.deepEqual(val.values, [
    Symbol.for('foo'),
    Symbol.for('bar'),
    Symbol.for('baz'),
  ]);
});

test('Tuple.append/2', async t => {
  const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
  const tuple = new Tuple(Symbol.for('foo'), Symbol.for('bar'));
  let val = await TupleModule.append(tuple, Symbol.for('baz'));

  t.deepEqual(val.values, [
    Symbol.for('foo'),
    Symbol.for('bar'),
    Symbol.for('baz'),
  ]);
});

test('Tuple.delete_at/2', async t => {
  const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
  const tuple = new Tuple(
    Symbol.for('foo'),
    Symbol.for('bar'),
    Symbol.for('baz'),
  );

  let val = await TupleModule.delete_at(tuple, 0);

  t.deepEqual(val.values, [Symbol.for('bar'), Symbol.for('baz')]);
});
