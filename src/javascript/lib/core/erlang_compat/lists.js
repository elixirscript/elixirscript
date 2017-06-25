// http://erlang.org/doc/man/lists.html

function reverse(list) {
  return [...list].reverse();
}

function foreach(fun, list) {
  list.forEach(x => fun(x));

  return Symbol.for('ok');
}

export default {
  reverse,
  foreach,
};
