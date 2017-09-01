import test from 'ava';
import Core from '../../../lib/core';

test('copy', (t) => {
  let result = Core.binary.copy('h', 3);
  t.deepEqual(result, 'hhh');

  result = Core.binary.copy('h');
  t.deepEqual(result, 'h');
});

test('list_to_bin', (t) => {
  const result = Core.binary.list_to_bin([104, 101, 108, 108, 111]);
  t.deepEqual(result, 'hello');
});
