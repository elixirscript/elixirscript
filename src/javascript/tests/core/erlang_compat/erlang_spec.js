import test from 'ava';
import Core from '../../../lib/core';

test('atom_to_binary2', t => {
  t.is(Core.erlang.atom_to_binary2(Symbol.for('error')), 'error');
  t.is(
    Core.erlang.atom_to_binary2(Symbol.for('error'), Symbol.for('utf8')),
    'error'
  );

  t.throws(
    () => Core.erlang.atom_to_binary2(Symbol.for('error'), Symbol.for('utf16')),
    Error
  );
});
