import ErlangTypes from 'erlang-types';
import lists from './lists';

function get_value(key, list, defaultv = Symbol.for('undefined')) {
  const tuple = lists.keyfind(key, 1, list);
  if (tuple) {
    const [, value] = tuple.values;
    return value;
  } else if (lists.member(key, list)) {
    return true;
  }
  return defaultv;
}

function is_defined(key, list) {
  const tuple = lists.keyfind(key, 1, list);
  if (tuple) {
    return true;
  }
  return false;
}

export default {
  get_value,
  is_defined,
};
