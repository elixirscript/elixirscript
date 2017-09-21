import test from 'ava';
import Core from '../../../lib/core';

test('find', (t) => {
  let myMap = new Map();
  let result = Core.maps.find('t', myMap);
  t.is(result, Symbol.for('error'));

  myMap = 'Hello';
  result = Core.maps.find('t', myMap);
  t.deepEqual(result.values, [Symbol.for('badmap'), myMap]);

  myMap = new Map([['t', 'b']]);
  result = Core.maps.find('t', myMap);
  t.deepEqual(result.values, [Symbol.for('ok'), 'b']);

  myMap = new Map([[[1], 'b']]);
  result = Core.maps.find([1], myMap);
  t.deepEqual(result.values, [Symbol.for('ok'), 'b']);

  myMap = new Map([[new Map(), 'b']]);
  result = Core.maps.find(new Map(), myMap);
  t.deepEqual(result.values, [Symbol.for('ok'), 'b']);
});

test('fold', async (t) => {
  const myMap = new Map([['a', 1], ['b', 2]]);
  const result = await Core.maps.fold((k, v, acc) => acc + v, 0, myMap);
  t.is(result, 3);
});

test('is_key', (t) => {
  const myMap = new Map([['a', 1], ['b', 2]]);
  let result = Core.maps.is_key('a', myMap);
  t.is(result, true);

  result = Core.maps.is_key('c', myMap);
  t.is(result, false);
});

test('get/2', (t) => {
  const myMap = new Map([['a', 1], ['b', 2]]);
  const result = Core.maps.get('a', myMap);
  t.is(result, 1);
});

test('get/3', (t) => {
  let myMap = new Map([['a', 1], ['b', 2]]);
  let result = Core.maps.get('a', myMap);
  t.is(result, 1);

  myMap = new Map([['a', 1], ['b', 2]]);
  result = Core.maps.get('c', myMap, 'undefined');
  t.is(result, 'undefined');
});

test('put/3', (t) => {
  const keyMap = new Map([['a', 5]]);

  let myMap = new Map([]);
  myMap = Core.maps.put(keyMap, 5, myMap);
  myMap = Core.maps.put(new Map([['a', 5]]), 6, myMap);

  const result = Core.maps.get(new Map([['a', 5]]), myMap);
  t.is(result, 6);
});

test('take/2', (t) => {
  const myMap = new Map([['a', 1], ['b', 2]]);
  let a; 
  let result;
  [a, result] = Core.maps.take('a', myMap);
  t.is(a, 1);
  t.is(result.has('a'), false);
});

test('remove', (t) => {
  let myMap = new Map([['a', 1], ['b', 2]]);
  let result = Core.maps.remove('a', myMap);
  t.is(result.has('a'), false);

  myMap = new Map([[[1], 1], ['b', 2]]);
  result = Core.maps.remove([1], myMap);
  t.is(Core.maps.__has(result, [1]), false);
});
