import test from 'ava';
import Core from '../../lib/core';

const Functions = Core.Functions;

test('call_property', t => {
  t.is(Functions.call_property(1, 'toString'), '1');
  t.is(Functions.call_property([], 'toString'), '');
  t.is(Functions.call_property([], 'length'), 0);
  t.is(Functions.call_property('', 'toString'), '');
  t.is(Functions.call_property('', 'length'), 0);
  t.is(Functions.call_property(Symbol('test'), 'toString'), 'Symbol(test)');
  t.is(Functions.call_property({ completed: false }, 'completed'), false);
  t.is(Functions.call_property({ id: 0 }, 'id'), 0);
});
