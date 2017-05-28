// http://erlang.org/doc/man/maps.html
import ErlangTypes from 'erlang-types';

const OK = Symbol.for('ok');
const ERROR = Symbol.for('error');
const BADMAP = Symbol.for('badmap');

function find2(key, map) {
  if (map instanceof Object === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const value = map[key];

  if (typeof value !== 'undefined') {
    return new ErlangTypes.Tuple(OK, value);
  }

  return ERROR;
}

function fold3(fun, init, map) {
  let acc = init;

  for (const [key, value] of Object.entries(map)) {
    acc = fun(key, value, acc);
  }

  return acc;
}

export default {
  find2,
  fold3,
};
