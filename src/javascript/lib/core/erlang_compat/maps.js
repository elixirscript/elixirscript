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

  const value = map.get(key);

  if (typeof value !== 'undefined') {
    return new ErlangTypes.Tuple(OK, value);
  }

  return ERROR;
}

function* fold(fun, init, map) {
  let acc = init;

  for (const [key, value] of map.entries()) {
    acc = yield* fun(key, value, acc);
  }

  return acc;
}

function remove(key, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  const map2 = new Map(map1);

  map2.delete(key);

  return map2;
}

function to_list(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const list = [];

  for (const [key, value] of map.entries()) {
    list.push(new ErlangTypes.Tuple(key, value));
  }

  return list;
}

function from_list(list) {
  return list.reduce((acc, item) => {
    const [key, value] = item;
    acc.set(key, value);

    return acc;
  }, new Map());
}

function keys(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  return Array.from(map.keys());
}

function values(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  return Array.from(map.values());
}

function is_key(key, map) {
  return map.has(key);
}

function put(key, value, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  const map2 = new Map(map1);
  map2.set(key, value);

  return map2;
}

function merge(map1, map2) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  if (erlang.is_map(map2) === false) {
    return new ErlangTypes.Tuple(BADMAP, map2);
  }

  return new Map([...map1, ...map2]);
}

function update(key, value, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  if (is_key(key, map1) === false) {
    return new ErlangTypes.Tuple(BADKEY, key);
  }

  return new Map([...map1, [key, value]]);
}

function get(...args) {
  const key = args[0];
  const map = args[1];

  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  if (is_key(key)) {
    return map.get(key);
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

  const value = map1.get(key);
  const map2 = new Map(map1);
  map2.delete(key);

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
