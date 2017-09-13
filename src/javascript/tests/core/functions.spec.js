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
  t.deepEqual(Functions.split_at('👨‍👩‍👦‍👦abélkm', 4).values, ['👨‍👩‍👦‍👦abé', 'lkm']);
});

test('map_to_object/1', (t) => {
  const map = new Map([[Symbol.for('key'), 'value'], [Symbol.for('anotherKey'), 'value2']]);
  const result = Functions.map_to_object(map);
  const obj = {};
  obj[Symbol.for('key')] = 'value';
  obj[Symbol.for('anotherKey')] = 'value2';
  t.deepEqual(result, obj);
});

test('map_to_object/2', (t) => {
  const map = new Map([[Symbol.for('key'), 'value'], [Symbol.for('anotherKey'), 'value2']]);
  const options = [new Core.Tuple(Symbol.for('keys'), Symbol.for('string'))];
  const result = Functions.map_to_object(map, options);

  t.deepEqual(result, { key: 'value', anotherKey: 'value2' });
});

test('object_to_map/1', (t) => {
  let obj = {};
  let result = Functions.object_to_map(obj);
  t.deepEqual(result, new Map());

  obj = { key: 'value', key2: null };
  result = Functions.object_to_map(obj);
  t.deepEqual(result, new Map([['key', 'value'], ['key2', null]]));

  obj = {};
  obj[Symbol.for('key')] = 'value';
  result = Functions.object_to_map(obj);
  t.deepEqual(result, new Map([[Symbol.for('key'), 'value']]));
});

test('object_to_map/2', (t) => {
  let obj = {};
  let result = Functions.object_to_map(obj, []);
  t.deepEqual(result, new Map());

  obj = { key: 'value' };
  result = Functions.object_to_map(obj, [new Core.Tuple(Symbol.for('keys'), Symbol.for('atom'))]);
  t.deepEqual(result, new Map([[Symbol.for('key'), 'value']]));

  obj = {};
  obj[Symbol.for('key')] = [{ nest1: 'valuenest1' }, { nest2: 'valuenest2' }];
  result = Functions.object_to_map(obj, [
    new Core.Tuple(Symbol.for('keys'), Symbol.for('atom')),
    new Core.Tuple(Symbol.for('recurse_array'), true),
  ]);
  t.deepEqual(
    result,
    new Map([
      [
        Symbol.for('key'),
        [
          new Map([[Symbol.for('nest1'), 'valuenest1']]),
          new Map([[Symbol.for('nest2'), 'valuenest2']]),
        ],
      ],
    ]),
  );
});
