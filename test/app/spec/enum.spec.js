import test from 'ava';

const Elixir = require('../build/Elixir.App');

const Enum = Elixir.load(Elixir.ElixirScript.Enum);

test('Enum.all?/2', async t => {
  t.deepEqual(await Enum.all__qmark__([2, 4, 6], x => x % 2 === 0), true);
  t.deepEqual(await Enum.all__qmark__([2, 3, 4], x => x % 2 === 0), false);
});

test('Enum.any?/2', async t => {
  t.deepEqual(await Enum.any__qmark__([2, 4, 6], x => x % 2 === 1), false);
  t.deepEqual(await Enum.any__qmark__([2, 3, 4], x => x % 2 === 1), true);
});

test('Enum.at/3', async t => {
  t.deepEqual(await Enum.at([2, 4, 6], 0), 2);
  t.deepEqual(await Enum.at([2, 4, 6], 2), 6);
  t.deepEqual(await Enum.at([2, 4, 6], 4), null);
  t.deepEqual(
    await Enum.at([2, 4, 6], 4, Symbol.for('none')),
    Symbol.for('none'),
  );

  t.deepEqual(await Enum.at([2, 4, 6], -2), 4);
  t.deepEqual(await Enum.at([2, 4, 6], -4), null);
});

test('Enum.concat/1', async t => {
  t.deepEqual(await Enum.concat([[1, [2], 3], [4], [5, 6]]), [
    1,
    [2],
    3,
    4,
    5,
    6,
  ]);
  t.deepEqual(await Enum.concat([[], []]), []);
  t.deepEqual(await Enum.concat([[]]), []);
  t.deepEqual(await Enum.concat([]), []);
});

test('Enum.concat/2', async t => {
  t.deepEqual(await Enum.concat([], [1]), [1]);
  t.deepEqual(await Enum.concat([1, [2], 3], [4, 5]), [1, [2], 3, 4, 5]);
  t.deepEqual(await Enum.concat([], []), []);
});

test('Enum.count/1', async t => {
  t.deepEqual(await Enum.count([1, 2, 3]), 3);
  t.deepEqual(await Enum.count([]), 0);
  t.deepEqual(await Enum.count([1, true, false, null]), 4);
});

test('Enum.count/2', async t => {
  t.deepEqual(await Enum.count([1, 2, 3], x => x % 2 === 0), 1);
  t.deepEqual(await Enum.count([], x => x % 2 === 0), 0);
  t.deepEqual(await Enum.count([1, true, false, null], x => x), 2);
});

test('Enum.drop/2', async t => {
  t.deepEqual(await Enum.drop([1, 2, 3], 0), [1, 2, 3]);
  t.deepEqual(await Enum.drop([1, 2, 3], 1), [2, 3]);
  t.deepEqual(await Enum.drop([1, 2, 3], 2), [3]);
  t.deepEqual(await Enum.drop([1, 2, 3], 3), []);
  t.deepEqual(await Enum.drop([1, 2, 3], 4), []);
  t.deepEqual(await Enum.drop([1, 2, 3], -1), [1, 2]);
  t.deepEqual(await Enum.drop([1, 2, 3], -2), [1]);
  t.deepEqual(await Enum.drop([1, 2, 3], -4), []);
});

test('Enum.drop_every/2', async t => {
  t.deepEqual(await Enum.drop_every([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2), [
    2,
    4,
    6,
    8,
    10,
  ]);

  t.deepEqual(await Enum.drop_every([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3), [
    2,
    3,
    5,
    6,
    8,
    9,
  ]);

  t.deepEqual(await Enum.drop_every([], 2), []);
  t.deepEqual(await Enum.drop_every([1, 2], 2), [2]);
  t.deepEqual(await Enum.drop_every([1, 2, 3], 0), [1, 2, 3]);
});

test('Enum.drop_while/2', async t => {
  t.deepEqual(await Enum.drop_while([1, 2, 3, 4, 3, 2, 1], x => x <= 3), [
    4,
    3,
    2,
    1,
  ]);

  t.deepEqual(await Enum.drop_while([1, 2, 3], _ => false), [1, 2, 3]);
  t.deepEqual(await Enum.drop_while([1, 2, 3], x => x <= 3), []);
  t.deepEqual(await Enum.drop_while([], _ => false), []);
});

test('Enum.empty?/1', async t => {
  t.deepEqual(await Enum.empty__qmark__([]), true);
  t.deepEqual(await Enum.empty__qmark__([1, 2, 3]), false);
});

test('Enum.fetch/2', async t => {
  let val = await Enum.fetch([66], 0);
  t.deepEqual(val.values, [Symbol.for('ok'), 66]);

  val = await Enum.fetch([66], -1);
  t.deepEqual(val.values, [Symbol.for('ok'), 66]);
  t.deepEqual(await Enum.fetch([66], 1), Symbol.for('error'));
  t.deepEqual(await Enum.fetch([66], -2), Symbol.for('error'));
});

test('Enum.fetch!/2', async t => {
  t.deepEqual(await Enum.fetch__emark__([2, 4, 6], 0), 2);
  t.deepEqual(await Enum.fetch__emark__([2, 4, 6], 2), 6);
  t.deepEqual(await Enum.fetch__emark__([2, 4, 6], -2), 4);
});
