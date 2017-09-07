import test from 'ava';
import Core from '../../../lib/core';

test('at/1', (t) => {
  const result = Core.binary.at('abc', 0);
  t.deepEqual(result, 'a');
});

test('copy/1', (t) => {
  const result = Core.binary.copy('h');
  t.deepEqual(result, 'h');
});

test('copy/2', (t) => {
  const result = Core.binary.copy('h', 3);
  t.deepEqual(result, 'hhh');
});

test('first/1', (t) => {
  const result = Core.binary.first('abc');
  t.deepEqual(result, 'a');
});

test('last/1', (t) => {
  const result = Core.binary.last('abc');
  t.deepEqual(result, 'c');
});

test('list_to_bin/1', (t) => {
  const result = Core.binary.list_to_bin([104, 101, 108, 108, 111]);
  t.deepEqual(result, 'hello');
});

test('part/2', (t) => {
  let posLen = new Core.Tuple(1, 1);
  let result = Core.binary.part('abcde', posLen);
  t.deepEqual(result, 'b');

  posLen = new Core.Tuple(1, 3);
  result = Core.binary.part('abcde', posLen);
  t.deepEqual(result, 'bcd');
});

test('part/3', (t) => {
  let result = Core.binary.part('abcde', 1, 1);
  t.deepEqual(result, 'b');

  result = Core.binary.part('abcde', 1, 3);
  t.deepEqual(result, 'bcd');
});

test('replace/3', (t) => {
  const result = Core.binary.replace('abcb', 'b', 'c');
  t.deepEqual(result, 'accb');
});

test('replace/4', (t) => {
  const result = Core.binary.replace('abcb', 'b', 'c', [new Core.Tuple(Symbol.for('global'), true)]);
  t.deepEqual(result, 'accc');
});

test('split/2', (t) => {
  const result = Core.binary.split('abcd', 'b');
  t.deepEqual(result, ['a', 'cd']);
});
