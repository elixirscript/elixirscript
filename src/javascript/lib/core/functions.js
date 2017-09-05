import Protocol from './protocol';
import Core from '../core';
import proplists from './erlang_compat/proplists';
import erlang from './erlang_compat/erlang';

function call_property(item, property) {
  if (!property) {
    if (item instanceof Function || typeof item === 'function') {
      return item();
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

    if (item.get(prop) instanceof Function || typeof item.get(prop) === 'function') {
      return item.get(prop)();
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

//TODO: Revisit performance of .toString() in tight loop
function map_to_object(map, options = []) {
  const opt_keys = proplists.get_value(Symbol.for('keys'), options);
  const opt_symbols = proplists.get_value(Symbol.for('symbols'), options);

  const object = {};

  for (let [key, value] of map.entries()) {
    if (opt_keys === Symbol.for('string') && typeof key === 'number') {
      key = key.toString();
    } else if (
      (opt_keys === Symbol.for('string') || opt_symbols !== Symbol.for('undefined')) 
      && typeof key === 'symbol'
    ) {
      key = erlang.atom_to_binary(key);
    }

    if (value instanceof Map) {
      object[key] = map_to_object(value, options);
    } else if (opt_symbols !==  Symbol.for('undefined') && typeof value === 'symbol') {
      object[key] = erlang.atom_to_binary(value);
    } else {
      object[key] = value;
    }
  }

  return object;
}

class Recurse {
  constructor(func) {
    this.func = func;
  }
}

function trampoline(f) {
  let currentValue = f;

  while (currentValue && currentValue instanceof Recurse) {
    currentValue = currentValue.func();
  }

  return currentValue;
}

function split_at(value, position) {
  if (position < 0) {
    const newPosition = value.length + position;
    if (newPosition < 0) {
      return new Core.Tuple('', value);
    }

    return split_at(value, newPosition);
  }

  let first = '';
  let second = '';
  let index = 0;

  for (const character of value) {
    if (index < position) {
      first += character;
    } else {
      second += character;
    }

    index += 1;
  }

  return new Core.Tuple(first, second);
}

export default {
  call_property,
  defprotocol,
  defimpl,
  build_namespace,
  map_to_object,
  trampoline,
  Recurse,
  split_at,
};