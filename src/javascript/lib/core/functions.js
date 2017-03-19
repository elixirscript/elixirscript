import Protocol from './protocol';
import Core from '../core';

function call_property(item, property) {
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

  if (item[prop] instanceof Function) {
    return item[prop]();
  }
  return item[prop];
}

function get_global() {
  if (typeof self !== 'undefined') {
    return self;
  } else if (typeof window !== 'undefined') {
    return window;
  } else if (typeof global !== 'undefined') {
    return global;
  }

  throw new Error('No global state found');
}

function defstruct(defaults) {
  return class {
    constructor(update = {}) {
      const the_values = Object.assign(defaults, update);
      Object.assign(this, the_values);
    }

    static create(updates = {}) {
      const x = new this(updates);
      return Object.freeze(x);
    }
  };
}

function defexception(defaults) {
  return class extends Error {
    constructor(update = {}) {
      const message = update.message || '';
      super(message);

      const the_values = Object.assign(defaults, update);
      Object.assign(this, the_values);

      this.name = this.constructor.name;
      this.message = message;
      this[Symbol.for('__exception__')] = true;
      Error.captureStackTrace(this, this.constructor.name);
    }

    static create(updates = {}) {
      const x = new this(updates);
      return Object.freeze(x);
    }
  };
}

function defprotocol(spec) {
  return new Protocol(spec);
}

function defimpl(protocol, type, impl) {
  protocol.implementation(type, impl);
}

function delete_property_from_map(map, property) {
  const new_map = Object.assign(Object.create(map.constructor.prototype), map);
  delete new_map[property];

  return Object.freeze(new_map);
}

function class_to_obj(map) {
  const new_map = Object.assign({}, map);
  return Object.freeze(new_map);
}

function add_property_to_map(map, property, value) {
  const new_map = Object.assign({}, map);
  new_map[property] = value;
  return Object.freeze(new_map);
}

function bnot(expr) {
  return ~expr;
}

function band(left, right) {
  return left & right;
}

function bor(left, right) {
  return left | right;
}

function bsl(left, right) {
  return left << right;
}

function bsr(left, right) {
  return left >> right;
}

function bxor(left, right) {
  return left ^ right;
}

function zip(list_of_lists) {
  if (list_of_lists.length === 0) {
    return Object.freeze([]);
  }

  const new_value = [];
  let smallest_length = list_of_lists[0];

  for (const x of list_of_lists) {
    if (x.length < smallest_length) {
      smallest_length = x.length;
    }
  }

  for (let i = 0; i < smallest_length; i++) {
    const current_value = [];
    for (let j = 0; j < list_of_lists.length; j++) {
      current_value.push(list_of_lists[j][i]);
    }

    new_value.push(new Core.Tuple(...current_value));
  }

  return Object.freeze(new_value);
}

function mapfoldl(fun, acc, list) {
  const newlist = [];
  let new_acc = acc;

  for (const x of list) {
    const tup = fun(x, new_acc);
    newlist.push(tup.get(0));
    new_acc = tup.get(1);
  }

  return new Core.Tuple(Object.freeze(newlist), new_acc);
}

function filtermap(fun, list) {
  const newlist = [];

  for (const x of list) {
    const result = fun(x);

    if (result === true) {
      newlist.push(x);
    } else if (result instanceof Core.Tuple) {
      newlist.push(result.get(1));
    }
  }

  return Object.freeze(newlist);
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

  root.__table = ns.__table || {};
  root.__table[Symbol.for(ns_string)] = parent;

  return parent;
}

export default {
  call_property,
  get_global,
  defstruct,
  defexception,
  defprotocol,
  defimpl,
  delete_property_from_map,
  add_property_to_map,
  class_to_obj,
  bnot,
  band,
  bor,
  bsl,
  bsr,
  bxor,
  zip,
  mapfoldl,
  filtermap,
  build_namespace,
};
