// http://erlang.org/doc/man/erlang.html

function atom_to_binary2(atom, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  return Symbol.keyFor(atom);
}

export default {
  atom_to_binary2,
};
