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

test('foldl', (t) => {
  t.deepEqual(Core.lists.foldl((v, acc) => acc + v, 0, [1, 2, 3]), 6);
});

test('foldr', (t) => {
  t.deepEqual(Core.lists.foldr((v, acc) => acc + v.toString(), '', [1, 2, 3]), '321');
});
