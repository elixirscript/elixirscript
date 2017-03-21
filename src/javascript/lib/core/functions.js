import Protocol from './protocol';
import Core from '../core';

function iterator_to_reducer(iterable, acc, fun) {
  const iterator = iterable[Symbol.iterator]();
  let x = iterator.next();
  let _acc = acc;

  while (x.done !== false) {
    _acc = fun(x.value, _acc.get(1));
    if (_acc.get(0) === Symbol.for('halt')) {
      return new Core.Tuple(Symbol.for('halted'), _acc.get(1));
    } else if (_acc.get(0) === Symbol.for('suspend')) {
      return new Core.Tuple(Symbol.for('suspended'), _acc.get(1), new_acc => {
        return iterator_to_reducer(iterator, new_acc, fun);
      });
    }

    x = iterator.next();
  }

  return new Core.Tuple(Symbol.for('done'), _acc.get(1));
}

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
  build_namespace,
  iterator_to_reducer,
};
