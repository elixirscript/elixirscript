const expect = require('chai').expect;
const Elixir = require('../../build/Elixir.App');

describe('Functions', () => {
  it('contains', () => {
    const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
    expect(Functions.contains(1, [])).to.eq(false);
    expect(Functions.contains(1, [1, 2, 3])).to.eq(true);
    expect(Functions.contains(1, [1])).to.eq(true);

    expect(Functions.contains('apple', [1])).to.eq(false);
  });

  it('get_object_keys', () => {
    const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
    expect(Functions.get_object_keys({})).to.eql([]);
    expect(Functions.get_object_keys({ key: 1 })).to.eql(['key']);
    expect(
      Functions.get_object_keys({ key: 1, [Symbol.for('hi')]: 2 }),
    ).to.eql(['key', Symbol.for('hi')]);
  });

  it('is_valid_character', () => {
    const Functions = Elixir.load(Elixir.ElixirScript.Bootstrap.Functions);
    expect(Functions.is_valid_character(42)).to.eq(true);
    expect(Functions.is_valid_character(NaN)).to.eq(false);
  });
});
