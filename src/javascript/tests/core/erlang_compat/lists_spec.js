import test from 'ava';
import Core from '../../../lib/core';

test('reverse', t => {
  t.deepEqual(Core.lists.reverse([1, 2, 3]), [3, 2, 1]);
});
