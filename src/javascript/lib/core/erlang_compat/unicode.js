import erlang from './erlang';

function characters_to_list(characters) {
  return characters.split('').map(c => c.codePointAt(0));
}

function characters_to_binary(characters) {
  if (erlang.is_binary(characters)) {
    return characters;
  }

  return String.fromCodePoint(...characters);
}

export default {
  characters_to_list,
  characters_to_binary
};
