const expect = require('chai').expect;
const Elixir = require('../build/Elixir.App');

describe('Integer', () => {
  it('is_odd/1', () => {
    const Integer = Elixir.load(Elixir.ElixirScript.Integer);

    expect(Integer.is_odd(0)).to.eq(false);
    expect(Integer.is_odd(1)).to.eq(true);
    expect(Integer.is_odd(2)).to.eq(false);
    expect(Integer.is_odd(3)).to.eq(true);
    expect(Integer.is_odd(-1)).to.eq(true);
    expect(Integer.is_odd(-2)).to.eq(false);
    expect(Integer.is_odd(-3)).to.eq(true);
  });

  it('is_even/1', () => {
    const Integer = Elixir.load(Elixir.ElixirScript.Integer);

    expect(Integer.is_even(0)).to.eq(true);
    expect(Integer.is_even(1)).to.eq(false);
    expect(Integer.is_even(2)).to.eq(true);
    expect(Integer.is_even(3)).to.eq(false);
    expect(Integer.is_even(-1)).to.eq(false);
    expect(Integer.is_even(-2)).to.eq(true);
    expect(Integer.is_even(-3)).to.eq(false);
  });

  it('parse/2', () => {
    const Integer = Elixir.load(Elixir.ElixirScript.Integer);
    expect(Integer.parse('12').values).to.eql([12, '']);
    expect(Integer.parse('012').values).to.eql([12, '']);
    expect(Integer.parse('+12').values).to.eql([12, '']);
    expect(Integer.parse('-12').values).to.eql([-12, '']);
    expect(Integer.parse('123456789').values).to.eql([123456789, '']);
    expect(Integer.parse('12.5').values).to.eql([12, '.5']);
    expect(Integer.parse('7.5e-3').values).to.eql([7, '.5e-3']);
    // expect(Integer.parse('12x').values).to.eql([12, 'x']);
    expect(Integer.parse('++1')).to.eql(Symbol.for('error'));
    expect(Integer.parse('--1')).to.eql(Symbol.for('error'));
    expect(Integer.parse('+-1')).to.eql(Symbol.for('error'));
    expect(Integer.parse('three')).to.eql(Symbol.for('error'));

    expect(Integer.parse('12', 10).values).to.eql([12, '']);
    expect(Integer.parse('-12', 12).values).to.eql([-14, '']);
    expect(Integer.parse('12345678', 9).values).to.eql([6053444, '']);
    expect(Integer.parse('3.14', 4).values).to.eql([3, '.14']);
    expect(Integer.parse('64eb', 16).values).to.eql([25835, '']);
    // expect(Integer.parse('64eb', 10).values).to.eql([64, 'eb']);
    expect(Integer.parse('10', 2).values).to.eql([2, '']);
    expect(Integer.parse('++4', 10)).to.eql(Symbol.for('error'));
  });
});
