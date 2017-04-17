import Core from '../core';

// https://github.com/airportyh/protomorphism
class Protocol {
  constructor(spec) {
    this.registry = new Map();
    this.fallback = null;

    function createFun(funName) {
      return async function(...args) {
        const thing = args[0];
        let fun = null;

        if (Number.isInteger(thing) && this.hasImplementation(Core.Integer)) {
          fun = this.registry.get(Core.Integer)[funName];
        } else if (
          typeof thing === 'number' &&
          !Number.isInteger(thing) &&
          this.hasImplementation(Core.Float)
        ) {
          fun = this.registry.get(Core.Float)[funName];
        } else if (
          typeof thing === 'string' && this.hasImplementation(Core.BitString)
        ) {
          fun = this.registry.get(Core.BitString)[funName];
        } else if (
          thing[Symbol.for('__struct__')] && this.hasImplementation(thing)
        ) {
          fun = this.registry.get(thing[Symbol.for('__struct__')])[funName];
        } else if (this.hasImplementation(thing)) {
          fun = this.registry.get(thing.constructor)[funName];
        } else if (this.fallback) {
          fun = this.fallback[funName];
        }

        if (fun != null) {
          return fun.apply(this, args);
        }

        throw new Error(`No implementation found for ${thing}`);
      };
    }

    for (const funName in spec) {
      this[funName] = createFun(funName).bind(this);
    }
  }

  implementation(type, implementation) {
    if (type === null) {
      this.fallback = implementation;
    } else {
      this.registry.set(type, implementation);
    }
  }

  hasImplementation(thing) {
    if (
      thing === Core.Integer || thing === Core.Float || thing === Core.BitString
    ) {
      return this.registry.has(thing);
    } else if (thing[Symbol.for('__struct__')]) {
      return this.registry.has(thing[Symbol.for('__struct__')]);
    }

    return this.registry.has(thing.constructor);
  }
}

export default Protocol;
