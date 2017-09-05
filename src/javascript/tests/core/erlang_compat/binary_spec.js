import test from 'ava';
import Core from '../../../lib/core';

test('at', (t) => {
  let result = Core.binary.at('abc', 0);
  t.deepEqual(result, 'a');
});

test('copy', (t) => {
  let result = Core.binary.copy('h', 3);
  t.deepEqual(result, 'hhh');

  result = Core.binary.copy('h');
  t.deepEqual(result, 'h');
});

test('first', (t) => {
  let result = Core.binary.first('abc');
  t.deepEqual(result, 'a');
});

test('last', (t) => {
  let result = Core.binary.last('abc');
  t.deepEqual(result, 'c');
});

test('list_to_bin', (t) => {
  const result = Core.binary.list_to_bin([104, 101, 108, 108, 111]);
  t.deepEqual(result, 'hello');
});

test('part', (t) => {
  let result = Core.binary.part('abcde', 1, 1);
  t.deepEqual(result, 'b');

  result = Core.binary.part('abcde', 1, 3);
  t.deepEqual(result, 'bcd');
});

test('replace', (t) => {
  let result = Core.binary.replace('abcb', 'b', 'c');
  t.deepEqual(result, 'accb');

  //TODO: How to make a proplist here?
  //result = Core.binary.replace('abcb', 'b', 'c', [global: true]);
  //t.deepEqual(result, 'accc');
});

test('split', (t) => {
  let result = Core.binary.split('abcd', 'b');
  t.deepEqual(result, ['a', 'cd']);
});