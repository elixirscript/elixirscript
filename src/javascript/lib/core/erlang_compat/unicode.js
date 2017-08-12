import erlang from './erlang';
import lists from './lists';

function characters_to_list(characters, inEncoding = Symbol.for('unicode')) {
  let values = characters;

  if (Array.isArray(characters)) {
    values = lists.flatten(characters);
  }

  if (erlang.is_binary(values)) {
    return values.split('').map(c => c.codePointAt(0));
  }

  return values.reduce((acc, c) => {
    if (erlang.is_integer(c)) {
      return acc.concat(c);
    }

    return acc.concat(characters_to_list(c, inEncoding));
  }, []);
}

function characters_to_binary(characters) {
  const values = characters_to_list(characters);

  return String.fromCodePoint(...values);
}

export default {
  characters_to_list,
  characters_to_binary
};
