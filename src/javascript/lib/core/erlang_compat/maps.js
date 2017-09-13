// http://erlang.org/doc/man/maps.html
import ErlangTypes from 'erlang-types';
import erlang from './erlang';

const OK = Symbol.for('ok');
const ERROR = Symbol.for('error');
const BADMAP = Symbol.for('badmap');
const BADKEY = Symbol.for('badkey');

function is_non_primitive(key) {
  return (
    erlang.is_list(key) ||
    erlang.is_map(key) ||
    erlang.is_pid(key) ||
    erlang.is_reference(key) ||
    erlang.is_bitstring(key)
  );
}

function __has(map, key) {
  if (is_non_primitive(key)) {
    for (const map_key of map.keys()) {
      if (erlang.equals(map_key, key)) {
        return true;
      }
    }

    return false;
  }

  return map.has(key);
}

function __get(map, key) {
  if (is_non_primitive(key)) {
    for (const map_key of map.keys()) {
      if (erlang.equals(map_key, key)) {
        return map.get(map_key);
      }
    }

    return null;
  }

  return map.get(key);
}

function __delete(map, key) {
  if (is_non_primitive(key)) {
    for (const map_key of map.keys()) {
      if (erlang.equals(map_key, key)) {
        map.delete(map_key);
      }
    }
  } else {
    map.delete(key);
  }
}

function find(key, map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const value = __get(map, key);

  if (typeof value !== 'undefined') {
    return new ErlangTypes.Tuple(OK, value);
  }

  return ERROR;
}

function fold(fun, init, map) {
  let acc = init;

  for (const [key, value] of map.entries()) {
    acc = fun(key, value, acc);
  }

  return acc;
}

function remove(key, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  const map2 = new Map(map1);

  __delete(map2, key);

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
  return __has(map, key);
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
    return __get(map, key);
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

  const value = __get(map1, key);
  const map2 = new Map(map1);
  __delete(map2, key);

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
  take,
  __has,
};
