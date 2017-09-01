import test from 'ava';
import Core from '../../../lib/core';

test('warn', (t) => {
  const result = Core.elixir_errors.warn(['this is a warning']);
  t.deepEqual(result, Symbol.for('ok'));
});
