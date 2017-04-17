const expect = require('chai').expect;
const Elixir = require('../build/Elixir.App');

describe('Exception', () => {
  it('Create Exception', () => {
    const ArgumentError = Elixir.load(Elixir.ElixirScript.ArgumentError);

    let struct = ArgumentError.__struct__();

    expect(Object.getOwnPropertySymbols(struct)).to.eql([
      Symbol.for('__struct__'),
      Symbol.for('message'),
      Symbol.for('__exception__'),
    ]);

    expect(struct[Symbol.for('__struct__')]).to.eql(
      Symbol.for('Elixir.ElixirScript.ArgumentError'),
    );
    expect(struct[Symbol.for('__exception__')]).to.eql(true);
    expect(struct[Symbol.for('message')]).to.eql('argument error');

    struct = ArgumentError.__struct__({
      [Symbol.for('message')]: 'new argument error',
    });

    expect(struct[Symbol.for('message')]).to.eql('new argument error');
  });

  it('raise exception', () => {
    const User = Elixir.load(Elixir.User);
    const ArgumentError = Elixir.load(Elixir.ElixirScript.ArgumentError);

    try {
      User.throw_something();
    } catch (e) {
      expect(e[Symbol.for('message')]).to.eql('argument error');
    }
  });
});
