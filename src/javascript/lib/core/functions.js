import GraphemeSplitter from 'grapheme-splitter';
import Protocol from './protocol';
import Core from '../core';
import proplists from './erlang_compat/proplists';
import erlang from './erlang_compat/erlang';

function* call_property(item, property) {
  if (!property) {
    if (item instanceof Function || typeof item === 'function') {
      return yield* item();
    }

    return item;
  }

  if (item instanceof Map) {
    let prop = null;

    if (item.has(property)) {
      prop = property;
    } else if (item.has(Symbol.for(property))) {
      prop = Symbol.for(property);
    }

    if (prop === null) {
      throw new Error(`Property ${property} not found in ${item}`);
    }

    return item.get(prop);
  }

  let prop = null;

  if (
    typeof item === 'number' ||
    typeof item === 'symbol' ||
    typeof item === 'boolean' ||
    typeof item === 'string'
  ) {
    if (item[property] !== undefined) {
      prop = property;
    } else if (item[Symbol.for(property)] !== undefined) {
      prop = Symbol.for(property);
    }
  } else if (property in item) {
    prop = property;
  } else if (Symbol.for(property) in item) {
    prop = Symbol.for(property);
  }

  if (prop === null) {
    throw new Error(`Property ${property} not found in ${item}`);
  }

  if (item[prop] instanceof Function || typeof item[prop] === 'function') {
    return item[prop]();
  }
  return item[prop];
}

function defprotocol(spec) {
  return new Protocol(spec);
}

function defimpl(protocol, type, impl) {
  protocol.implementation(type, impl);
}

function build_namespace(ns, ns_string) {
  let parts = ns_string.split('.');
  const root = ns;
  let parent = ns;

  if (parts[0] === 'Elixir') {
    parts = parts.slice(1);
  }

  for (const part of parts) {
    if (typeof parent[part] === 'undefined') {
      parent[part] = {};
    }

    parent = parent[part];
  }

  root.__table__ = ns.__table__ || {};
  root.__table__[Symbol.for(ns_string)] = parent;

  return parent;
}

function map_to_object(map, options = []) {
  const opt_keys = proplists.get_value(Symbol.for('keys'), options);
  const opt_symbols = proplists.get_value(Symbol.for('symbols'), options);

  const object = {};

  for (const entry of map.entries()) {
    let key = entry[0];
    const value = entry[1];

    if (opt_keys === Symbol.for('string') && typeof key === 'number') {
      key = key.toString();
    } else if (
      (opt_keys === Symbol.for('string') || opt_symbols !== Symbol.for('undefined')) &&
      typeof key === 'symbol'
    ) {
      key = erlang.atom_to_binary(key);
    }

    if (value instanceof Map) {
      object[key] = map_to_object(value, options);
    } else if (opt_symbols !== Symbol.for('undefined') && typeof value === 'symbol') {
      object[key] = erlang.atom_to_binary(value);
    } else {
      object[key] = value;
    }
  }

  return object;
}

function object_to_map(object, options = []) {
  const opt_atom_keys = proplists.get_value(Symbol.for('keys'), options) === Symbol.for('atom');
  const opt_recurse_array = proplists.get_value(Symbol.for('recurse_array'), options) === true;

  if (object.constructor === Object) {
    const map = new Map();
    Reflect.ownKeys(object).forEach((key) => {
      let key2 = key;
      let value = object[key];
      if (opt_atom_keys && typeof key === 'string') {
        key2 = Symbol.for(key);
      }

      if (
        value !== null &&
        (value.constructor === Object || (value instanceof Array && opt_recurse_array))
      ) {
        value = object_to_map(value, options);
      }
      map.set(key2, value);
    });
    return map;
  } else if (object instanceof Array && opt_recurse_array) {
    return object.map((ele) => {
      if (ele !== null && (ele.constructor === Object || ele instanceof Array)) {
        return object_to_map(ele, options);
      }
      return ele;
    });
  }
  throw new Error(`Object ${object} is not an native object or array`);
}

class Recurse {
  constructor(func) {
    this.func = func;
  }
}

function* trampoline(f) {
  let currentValue = f;

  while (currentValue && currentValue instanceof Recurse) {
    currentValue = yield* currentValue.func();
  }

  return currentValue;
}

function split_at(value, position) {
  const splitter = new GraphemeSplitter();
  const splitValues = splitter.splitGraphemes(value);

  if (position < 0) {
    const newPosition = splitValues.length + position;
    if (newPosition < 0) {
      return new Core.Tuple('', value);
    }

    return split_at(value, newPosition);
  }

  let first = '';
  let second = '';
  let index = 0;

  for (const character of splitValues) {
    if (index < position) {
      first += character;
    } else {
      second += character;
    }

    index += 1;
  }

  return new Core.Tuple(first, second);
}

function graphemes(str) {
  const splitter = new GraphemeSplitter();
  return splitter.splitGraphemes(str);
}

function concat(head, tail) {
  return [head].concat(tail);
}

export default {
  call_property,
  defprotocol,
  defimpl,
  build_namespace,
  map_to_object,
  object_to_map,
  trampoline,
  Recurse,
  split_at,
  graphemes,
  concat,
};
