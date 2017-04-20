import test from 'ava';
const Elixir = require('../build/Elixir.App');

test('Integer.is_odd/1', async t => {
  const Integer = Elixir.load(Elixir.ElixirScript.Integer);

  t.is(await Integer.is_odd(0), false);
  t.is(await Integer.is_odd(1), true);
  t.is(await Integer.is_odd(2), false);
  t.is(await Integer.is_odd(3), true);
  t.is(await Integer.is_odd(-1), true);
  t.is(await Integer.is_odd(-2), false);
  t.is(await Integer.is_odd(-3), true);
});

test('Integer.is_even/1', async t => {
  const Integer = Elixir.load(Elixir.ElixirScript.Integer);

  t.is(await Integer.is_even(0), true);
  t.is(await Integer.is_even(1), false);
  t.is(await Integer.is_even(2), true);
  t.is(await Integer.is_even(3), false);
  t.is(await Integer.is_even(-1), false);
  t.is(await Integer.is_even(-2), true);
  t.is(await Integer.is_even(-3), false);
});

test('Integer.parse/2', async t => {
  const Integer = Elixir.load(Elixir.ElixirScript.Integer);
  t.deepEqual(await Integer.parse('12').values, [12, '']);
  t.deepEqual(await Integer.parse('012').values, [12, '']);
  t.deepEqual(await Integer.parse('+12').values, [12, '']);
  t.deepEqual(await Integer.parse('-12').values, [-12, '']);
  t.deepEqual(await Integer.parse('123456789').values, [123456789, '']);
  t.deepEqual(await Integer.parse('12.5').values, [12, '.5']);
  t.deepEqual(await Integer.parse('7.5e-3').values, [7, '.5e-3']);
  // t.deepEqual(await Integer.parse('12x').values, [12, 'x']);
  t.deepEqual(await Integer.parse('++1'), Symbol.for('error'));
  t.deepEqual(await Integer.parse('--1'), Symbol.for('error'));
  t.deepEqual(await Integer.parse('+-1'), Symbol.for('error'));
  t.deepEqual(await Integer.parse('three'), Symbol.for('error'));

  t.deepEqual(await Integer.parse('12', 10).values, [12, '']);
  t.deepEqual(await Integer.parse('-12', 12).values, [-14, '']);
  t.deepEqual(await Integer.parse('12345678', 9).values, [6053444, '']);
  t.deepEqual(await Integer.parse('3.14', 4).values, [3, '.14']);
  t.deepEqual(await Integer.parse('64eb', 16).values, [25835, '']);
  // t.deepEqual(await Integer.parse('64eb', 10).values, [64, 'eb']);
  t.deepEqual(await Integer.parse('10', 2).values, [2, '']);
  t.deepEqual(await Integer.parse('++4', 10), Symbol.for('error'));
});
