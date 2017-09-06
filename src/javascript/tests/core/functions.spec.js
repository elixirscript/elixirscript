import test from 'ava';
import Core from '../../lib/core';

const Functions = Core.Functions;

test('call_property', (t) => {
  t.is(Functions.call_property(1, 'toString'), '1');
  t.is(Functions.call_property([], 'toString'), '');
  t.is(Functions.call_property([], 'length'), 0);
  t.is(Functions.call_property('', 'toString'), '');
  t.is(Functions.call_property('', 'length'), 0);
  t.is(Functions.call_property(Symbol('test'), 'toString'), 'Symbol(test)');
  t.is(Functions.call_property({ completed: false }, 'completed'), false);
  t.is(Functions.call_property({ id: 0 }, 'id'), 0);
});

test('split_at', (t) => {
  t.deepEqual(Functions.split_at('sweetelixir', 5).values, ['sweet', 'elixir']);
  t.deepEqual(Functions.split_at('sweetelixir', -6).values, ['sweet', 'elixir']);
  t.deepEqual(Functions.split_at('abc', 0).values, ['', 'abc']);
  t.deepEqual(Functions.split_at('abc', 1000).values, ['abc', '']);
  t.deepEqual(Functions.split_at('abc', -1000).values, ['', 'abc']);
  t.deepEqual(Functions.split_at('😀abélkm', 4).values, ['😀abé', 'lkm']);
});

//TODO: Fix these tests
/*test('map_to_object/1', (t) => {
  const s_key = Symbol.for('key');
  const s_anotherKey = Symbol.for('anotherKey');

  const map = new Map([[s_key, 'value'], [s_anotherKey, 'value2']]);
  const result = Functions.map_to_object(map);
  t.deepEqual(result, { s_key: 'value', s_anotherKey: 'value2' });
});

test('map_to_object/2', (t) => {
  const s_key = Symbol.for('key');
  const s_anotherKey = Symbol.for('anotherKey');

  const map = new Map([[s_key, 'value'], [s_anotherKey, 'value2']]);
  const options = [new Core.Tuple(Symbol.for('keys'), Symbol.for('strings'))];
  const result = Functions.map_to_object(map, options);

  t.deepEqual(result, { key: 'value', anotherKey: 'value2' });

  map = new Map([[s_key, 'value'], [s_anotherKey, 'value2']]);
  result = Functions.map_to_object(map, []);

  t.deepEqual(result, { s_key: 'value', s_anotherKey: 'value2' });
});*/
