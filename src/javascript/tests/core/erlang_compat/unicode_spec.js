import test from 'ava';
import Core from '../../../lib/core';

test('characters_to_list', (t) => {
  let result = Core.unicode.characters_to_list('hello');
  t.deepEqual(result, [104, 101, 108, 108, 111]);

  result = Core.unicode.characters_to_list(['hello', 'fg']);
  t.deepEqual(result, [104, 101, 108, 108, 111, 102, 103]);

  result = Core.unicode.characters_to_list(['hello', 'fg', 34]);
  t.deepEqual(result, [104, 101, 108, 108, 111, 102, 103, 34]);

  result = Core.unicode.characters_to_list(['hello', 'fg', 34, ['s']]);
  t.deepEqual(result, [104, 101, 108, 108, 111, 102, 103, 34, 115]);
});

test('characters_to_binary', (t) => {
  let result = Core.unicode.characters_to_binary('hello');
  t.deepEqual(result, 'hello');

  result = Core.unicode.characters_to_binary(['hello', 'fg']);
  t.deepEqual(result, 'hellofg');

  result = Core.unicode.characters_to_binary(['hello', 'fg', 34]);
  t.deepEqual(result, 'hellofg"');

  result = Core.unicode.characters_to_binary(['hello', 'fg', 34, ['s']]);
  t.deepEqual(result, 'hellofg"s');
});
