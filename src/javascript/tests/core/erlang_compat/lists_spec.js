import test from 'ava';
import Core from '../../../lib/core';

test('reverse1', t => {
  t.deepEqual(Core.lists.reverse1([1, 2, 3]), [3, 2, 1]);
});
