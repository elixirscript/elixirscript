import test from 'ava';
import Core from '../../../lib/core';

test('put_chars', (t) => {
  let result = Core.io.put_chars(Symbol.for('stdio'), 'Hello');
  t.deepEqual(result, Symbol.for('ok'));

  result = Core.io.put_chars(Symbol.for('stderr'), 'Hello');
  t.deepEqual(result, Symbol.for('ok'));
});
