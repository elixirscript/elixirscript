const expect = require('chai').expect;
const Elixir = require('../build/Elixir.App');
const Tuple = require('../../../src/javascript/lib/core').default.Tuple;

describe('Tuple', () => {
  it('duplicate/2', () => {
    const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
    expect(TupleModule.duplicate(Symbol.for('foo'), 0).values).to.eql([]);
    expect(TupleModule.duplicate(Symbol.for('foo'), 3).values).to.eql([Symbol.for('foo'), Symbol.for('foo'), Symbol.for('foo')]);
  });

  it('insert_at/3', () => {
    const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
    const t = new Tuple(Symbol.for('bar'), Symbol.for('baz'));
    expect(TupleModule.insert_at(t, 0, Symbol.for('foo')).values).to.eql([Symbol.for('foo'), Symbol.for('bar'), Symbol.for('baz')]);
  });

  it('append/2', () => {
    const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
    const t = new Tuple(Symbol.for('foo'), Symbol.for('bar'));
    expect(TupleModule.append(t, Symbol.for('baz')).values).to.eql([Symbol.for('foo'), Symbol.for('bar'), Symbol.for('baz')]);
  });

  it('delete_at/2', () => {
    const TupleModule = Elixir.load(Elixir.ElixirScript.Tuple);
    const t = new Tuple(Symbol.for('foo'), Symbol.for('bar'), Symbol.for('baz'));
    expect(TupleModule.delete_at(t, 0).values).to.eql([Symbol.for('bar'), Symbol.for('baz')]);
  });
});
