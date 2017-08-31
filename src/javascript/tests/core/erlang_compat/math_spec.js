import test from 'ava';
import Core from '../../../lib/core';

test('log2/1', t => {
  let result = Core.math.log2(1);
  t.is(result, 0);

  result = Core.math.log2(2);
  t.is(result, 1);

  result = Core.math.log2(4);
  t.is(result, 2);
});
