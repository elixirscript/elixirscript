import test from 'ava';
import Core from '../../../lib/core';

test('join/1', (t) => {
  let result = Core.filename.join(['/usr', 'local', 'bin']);
  t.is(result, '/usr/local/bin');

  result = Core.filename.join(['a', '///b/', 'c/']);
  t.is(result, '/b/c');

  result = Core.filename.join(['a/b///c/']);
  t.is(result, 'a/b/c');
});
