import test from 'ava';
import Core from '../../lib/core';

const Functions = Core.Functions;

test('call_property', async (t) => {
  t.is(await Functions.call_property(1, 'toString'), '1');
  t.is(await Functions.call_property([], 'toString'), '');
  t.is(await Functions.call_property([], 'length'), 0);
  t.is(await Functions.call_property('', 'toString'), '');
  t.is(await Functions.call_property('', 'length'), 0);
  t.is(await Functions.call_property(Symbol('test'), 'toString'), 'Symbol(test)');
  t.is(await Functions.call_property({ completed: false }, 'completed'), false);
  t.is(await Functions.call_property({ id: 0 }, 'id'), 0);
});

test('split_at', (t) => {
  t.deepEqual(Functions.split_at('sweetelixir', 5).values, ['sweet', 'elixir']);
  t.deepEqual(Functions.split_at('sweetelixir', -6).values, ['sweet', 'elixir']);
  t.deepEqual(Functions.split_at('abc', 0).values, ['', 'abc']);
  t.deepEqual(Functions.split_at('abc', 1000).values, ['abc', '']);
  t.deepEqual(Functions.split_at('abc', -1000).values, ['', 'abc']);
  t.deepEqual(Functions.split_at('😀abélkm', 4).values, ['😀abé', 'lkm']);
});

test('map_to_object/2', (t) => {
  const map = new Map([[Symbol.for('key'), 'value'], [Symbol.for('anotherKey'), 'value2']]);

  const options = [new Core.Tuple(Symbol.for('keys'), Symbol.for('strings'))];

  const result = Functions.map_to_object(map, options);

  t.deepEqual(result, { key: 'value', anotherKey: 'value2' });
});
