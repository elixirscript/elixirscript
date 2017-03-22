const expect = require('chai').expect;
const Elixir = require('../build/Elixir.App');

const Enum = Elixir.load(Elixir.ElixirScript.Enum);

describe('Enum', () => {
  it('all?/2', () => {
    expect(Enum.all__qmark__([2, 4, 6], x => x % 2 === 0)).to.eql(true);
    expect(Enum.all__qmark__([2, 3, 4], x => x % 2 === 0)).to.eql(false);
  });

  it('any?/2', () => {
    expect(Enum.any__qmark__([2, 4, 6], x => x % 2 === 1)).to.eql(false);
    expect(Enum.any__qmark__([2, 3, 4], x => x % 2 === 1)).to.eql(true);
  });

  it('at/3', () => {
    expect(Enum.at([2, 4, 6], 0)).to.eql(2);
    expect(Enum.at([2, 4, 6], 2)).to.eql(6);
    expect(Enum.at([2, 4, 6], 4)).to.eql(null);
    expect(Enum.at([2, 4, 6], 4, Symbol.for('none'))).to.eql(
      Symbol.for('none'),
    );

    expect(Enum.at([2, 4, 6], -2)).to.eql(4);
    expect(Enum.at([2, 4, 6], -4)).to.eql(null);
  });

  it('concat/1', () => {
    expect(Enum.concat([[1, [2], 3], [4], [5, 6]])).to.eql([
      1,
      [2],
      3,
      4,
      5,
      6,
    ]);
    expect(Enum.concat([[], []])).to.eql([]);
    expect(Enum.concat([[]])).to.eql([]);
    expect(Enum.concat([])).to.eql([]);
  });

  it('concat/2', () => {
    expect(Enum.concat([], [1])).to.eql([1]);
    expect(Enum.concat([1, [2], 3], [4, 5])).to.eql([1, [2], 3, 4, 5]);
    expect(Enum.concat([], [])).to.eql([]);
  });

  it('count/1', () => {
    expect(Enum.count([1, 2, 3])).to.eql(3);
    expect(Enum.count([])).to.eql(0);
    expect(Enum.count([1, true, false, null])).to.eql(4);
  });

  it('count/2', () => {
    expect(Enum.count([1, 2, 3], x => x % 2 === 0)).to.eql(1);
    expect(Enum.count([], x => x % 2 === 0)).to.eql(0);
    expect(Enum.count([1, true, false, null], x => x)).to.eql(2);
  });

  it('drop/2', () => {
    expect(Enum.drop([1, 2, 3], 0)).to.eql([1, 2, 3]);
    expect(Enum.drop([1, 2, 3], 1)).to.eql([2, 3]);
    expect(Enum.drop([1, 2, 3], 2)).to.eql([3]);
    expect(Enum.drop([1, 2, 3], 3)).to.eql([]);
    expect(Enum.drop([1, 2, 3], 4)).to.eql([]);
    expect(Enum.drop([1, 2, 3], -1)).to.eql([1, 2]);
    expect(Enum.drop([1, 2, 3], -2)).to.eql([1]);
    expect(Enum.drop([1, 2, 3], -4)).to.eql([]);
  });

  it('drop_every/2', () => {
    expect(Enum.drop_every([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2)).to.eql([
      2,
      4,
      6,
      8,
      10,
    ]);

    expect(Enum.drop_every([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)).to.eql([
      2,
      3,
      5,
      6,
      8,
      9,
    ]);

    expect(Enum.drop_every([], 2)).to.eql([]);
    expect(Enum.drop_every([1, 2], 2)).to.eql([2]);
    expect(Enum.drop_every([1, 2, 3], 0)).to.eql([1, 2, 3]);
  });
});
