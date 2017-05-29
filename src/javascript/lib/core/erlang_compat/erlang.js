// http://erlang.org/doc/man/erlang.html

function atom_to_binary2(atom, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  return Symbol.keyFor(atom);
}

function list_concatenation2(list1, list2) {
  return list1.concat(list2);
}

function list_subtraction2(list1, list2) {
  const list = [...list1];

  for (const item of list2) {
    const index = list.indexOf(item);

    if (index > -1) {
      list.splice(index, 1);
    }
  }

  return list;
}

export default {
  atom_to_binary2,
  list_concatenation2,
  list_subtraction2,
};
