import test from 'ava';
import Core from '../../../lib/core';

test('reverse', (t) => {
  t.deepEqual(Core.lists.reverse([1, 2, 3]), [3, 2, 1]);
});

test('duplicate', (t) => {
  t.deepEqual(Core.lists.duplicate(0, 1), []);
  t.deepEqual(Core.lists.duplicate(1, 1), [1]);
  t.deepEqual(Core.lists.duplicate(2, 1), [1, 1]);
});

test('flatten', (t) => {
  t.deepEqual(Core.lists.flatten([1, 2, 3]), [1, 2, 3]);
  t.deepEqual(Core.lists.flatten([1, [[2], 3]]), [1, 2, 3]);
});

test('foldl', async (t) => {
  t.deepEqual(await Core.lists.foldl((v, acc) => acc + v, 0, [1, 2, 3]), 6);
});

test('foldr', async (t) => {
  t.deepEqual(await Core.lists.foldr((v, acc) => acc + v.toString(), '', [1, 2, 3]), '321');
});

test('member/2', (t) => {
  let result = Core.lists.member('abc', ['abc']);
  t.deepEqual(result, true);

  result = Core.lists.member('abc', ['abcd']);
  t.deepEqual(result, false);
});

test('keyfind/3', (t) => {
  let result = Core.lists.keyfind('abc', 1, ['abc']);
  t.deepEqual(result, false);

  result = Core.lists.keyfind('abc', 1, [new Core.Tuple('abc')]);
  t.deepEqual(result, new Core.Tuple('abc'));
});
