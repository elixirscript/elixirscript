import test from 'ava';
import Core from '../../../lib/core';

test('find2', t => {
  let myMap = {};
  let result = Core.maps.find2('t', myMap);
  t.is(result, Symbol.for('error'));

  myMap = 'Hello';
  result = Core.maps.find2('t', myMap);
  t.deepEqual(result.values, [Symbol.for('badmap'), myMap]);

  myMap = { t: 'b' };
  result = Core.maps.find2('t', myMap);
  t.deepEqual(result.values, [Symbol.for('ok'), 'b']);
});

test('fold3', t => {
  let myMap = { a: 1, b: 2 };
  let result = Core.maps.fold3((k, v, acc) => acc + v, 0, myMap);
  t.is(result, 3);
});
