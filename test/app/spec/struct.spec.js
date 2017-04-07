const expect = require('chai').expect;
const Elixir = require('../build/Elixir.App');

describe('Struct', () => {
  it('Create Struct', () => {
    const User = Elixir.load(Elixir.User);

    let struct = User.__struct__();

    expect(Object.getOwnPropertySymbols(struct)).to.eql([
      Symbol.for('__struct__'),
      Symbol.for('first'),
      Symbol.for('last'),
    ]);

    expect(struct[Symbol.for('__struct__')]).to.eql(Symbol.for('Elixir.User'));
    expect(struct[Symbol.for('first')]).to.eql(null);
    expect(struct[Symbol.for('last')]).to.eql(null);

    struct = User.__struct__({ [Symbol.for('first')]: 'John' });

    expect(struct[Symbol.for('first')]).to.eql('John');
  });
});
