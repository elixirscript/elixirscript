// http://erlang.org/doc/man/maps.html
import ErlangTypes from 'erlang-types';
import erlang from './erlang';

const OK = Symbol.for('ok');
const ERROR = Symbol.for('error');
const BADMAP = Symbol.for('badmap');
const BADKEY = Symbol.for('badkey');

function find(key, map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const value = map[key];

  if (typeof value !== 'undefined') {
    return new ErlangTypes.Tuple(OK, value);
  }

  return ERROR;
}

function fold(fun, init, map) {
  let acc = init;

  for (const [key, value] of to_list(map)) {
    acc = fun(key, value, acc);
  }

  return acc;
}

function remove(key, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  const map2 = Object.assign({}, map1);

  delete map2[key];

  return map2;
}

function to_list(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const list = [];

  for (const key of keys(map)) {
    list.push(new ErlangTypes.Tuple(key, map[key]));
  }

  return list;
}

function from_list(list) {
  return list.reduce((acc, item) => {
    const [key, value] = item;
    acc[key] = value;

    return acc;
  }, {});
}

function keys(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const keys = [];

  for (const key of Object.getOwnPropertySymbols(map)) {
    keys.push(key);
  }

  for (const key of Object.getOwnPropertyNames(map)) {
    keys.push(key);
  }

  return keys;
}

function values(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const theValues = [];

  for (const key of keys(map)) {
    theValues.push(map[key]);
  }

  return theValues;
}

function is_key(key, map) {
  return map.hasOwnProperty(key);
}

function put(key, value, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  const map2 = Object.assign({}, map1, { [key]: value });

  return map2;
}

function merge(map1, map2) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  if (erlang.is_map(map2) === false) {
    return new ErlangTypes.Tuple(BADMAP, map2);
  }

  return Object.assign({}, map1, map2);
}

function update(key, value, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  if (is_key(key, map1) === false) {
    return new ErlangTypes.Tuple(BADKEY, key);
  }

  return Object.assign({}, map1, { [key]: value });
}

function get(...args) {
  const key = args[0];
  const map = args[1];

  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  if (is_key(key)) {
    return map[key];
  }

  if (args.length === 3) {
    return args[2];
  }

  return new ErlangTypes.Tuple(BADKEY, key);
}

function take(key, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  if (!is_key(key)) {
    return ERROR;
  }

  const value = map1[key];
  const map2 = Object.assign({}, map1);
  delete map2[key];

  return new ErlangTypes.Tuple(value, map2);
}

export default {
  find,
  fold,
  remove,
  to_list,
  from_list,
  keys,
  values,
  is_key,
  put,
  merge,
  update,
  get,
  take
};
