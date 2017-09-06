import test from 'ava';
import Core from '../../../lib/core';

test('get_value/2', (t) => {
  let result = Core.proplists.get_value('abc', [new Core.Tuple('abc', '123')]);
  t.deepEqual(result, '123');

  result = Core.proplists.get_value('abc', ['abc']);
  t.deepEqual(result, true);

  result = Core.proplists.get_value('abcd', ['abc']);
  t.deepEqual(result, Symbol.for('undefined'));
});

test('get_value/3', (t) => {
  let result = Core.proplists.get_value('abc', [new Core.Tuple('abc', '123')], 'xyz');
  t.deepEqual(result, '123');

  result = Core.proplists.get_value('abcd', [new Core.Tuple('abc', '123')], 'xyz');
  t.deepEqual(result, 'xyz');
});

test('is_defined/2', (t) => {
  const result = Core.binary.at('abc', 0);
  t.deepEqual(result, 'a');
});
