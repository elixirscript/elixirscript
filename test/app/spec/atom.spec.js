const expect = require('chai').expect;
const Elixir = require('../build/Elixir.App');

describe('Atom', () => {
  it('to_string/1', () => {
    const exports = Elixir.load(Elixir.ElixirScript.Atom);
    expect(exports.to_string(Symbol.for('héllo'))).to.eq('héllo');
  });

  it('to_charlist/1', () => {
    const exports = Elixir.load(Elixir.ElixirScript.Atom);
    expect(exports.to_string(Symbol.for('héllo'))).to.eq('héllo');
  });
});
