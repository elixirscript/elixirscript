var Patterns = {
  get default () { return _Patterns; }
};

class Tuple {

  constructor(...args) {
    this.values = Object.freeze(args);
  }

  get(index) {
    return this.values[index];
  }

  count() {
    return this.values.length;
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator]();
  }

  toString() {
    var i,
        s = "";
    for (i = 0; i < this.values.length; i++) {
      if (s !== "") {
        s += ", ";
      }
      s += this.values[i].toString();
    }

    return "{" + s + "}";
  }

  static to_string(tuple) {
    return tuple.toString();
  }

  static delete_at(tuple, index) {
    let new_list = [];

    for (var i = 0; i < tuple.count(); i++) {
      if (i !== index) {
        new_list.push(tuple.get(i));
      }
    }

    return Kernel.SpecialForms.tuple.apply(null, new_list);
  }

  static duplicate(data, size) {
    let array = [];

    for (var i = size - 1; i >= 0; i--) {
      array.push(data);
    }

    return Kernel.SpecialForms.tuple.apply(null, array);
  }

  static insert_at(tuple, index, term) {
    let new_tuple = [];

    for (var i = 0; i <= tuple.count(); i++) {
      if (i === index) {
        new_tuple.push(term);
        i++;
        new_tuple.push(tuple.get(i));
      } else {
        new_tuple.push(tuple.get(i));
      }
    }

    return Kernel.SpecialForms.tuple.apply(null, new_tuple);
  }

  static from_list(list) {
    return Kernel.SpecialForms.tuple.apply(null, list);
  }

  static to_list(tuple) {
    let new_list = [];

    for (var i = 0; i < tuple.count(); i++) {
      new_list.push(tuple.get(i));
    }

    return Kernel.SpecialForms.list(...new_list);
  }
}

/* @flow */

class Variable {

  constructor(name = null) {
    this.name = name;
  }
}

class Wildcard {
  constructor() {}
}

class StartsWith {

  constructor(prefix) {
    this.prefix = prefix;
  }
}

class Capture {

  constructor(value) {
    this.value = value;
  }
}

class HeadTail {
  constructor() {}
}

class Type {

  constructor(type, objPattern = {}) {
    this.type = type;
    this.objPattern = objPattern;
  }
}

class Bound {

  constructor(value) {
    this.value = value;
  }
}

function variable(name = null) {
  return new Variable(name);
}

function wildcard() {
  return new Wildcard();
}

function startsWith(prefix) {
  return new StartsWith(prefix);
}

function capture(value) {
  return new Capture(value);
}

function headTail() {
  return new HeadTail();
}

function type(type, objPattern = {}) {
  return new Type(type, objPattern);
}

function bound(value) {
  return new Bound(value);
}

function _is_number(value) {
  return typeof value === 'number';
}

function is_string(value) {
  return typeof value === 'string';
}

function _is_tuple(value) {
  return value instanceof Tuple;
}

function _is_boolean(value) {
  return typeof value === 'boolean';
}

function is_symbol(value) {
  return typeof value === 'symbol';
}

function is_null(value) {
  return value === null;
}

function is_undefined(value) {
  return typeof value === 'undefined';
}

function _is_function(value) {
  return Object.prototype.toString.call(value) == '[object Function]';
}

function is_variable(value) {
  return value instanceof Variable;
}

function is_wildcard(value) {
  return value instanceof Wildcard;
}

function is_headTail(value) {
  return value instanceof HeadTail;
}

function is_capture(value) {
  return value instanceof Capture;
}

function is_type(value) {
  return value instanceof Type;
}

function is_startsWith(value) {
  return value instanceof StartsWith;
}

function is_bound(value) {
  return value instanceof Bound;
}

function is_object(value) {
  return typeof value === 'object';
}

function is_array(value) {
  return Array.isArray(value);
}

var Checks = {
  is_number: _is_number,
  is_string,
  is_boolean: _is_boolean,
  is_symbol,
  is_null,
  is_undefined,
  is_function: _is_function,
  is_variable,
  is_wildcard,
  is_headTail,
  is_capture,
  is_type,
  is_startsWith,
  is_bound,
  is_object,
  is_array,
  is_tuple: _is_tuple
};

function resolveTuple(pattern) {
  let matches = [];

  for (let elem of pattern) {
    matches.push(buildMatch(elem));
  }

  return function (value, args) {
    if (!Checks.is_tuple(value) || value.count() != pattern.count()) {
      return false;
    }

    return value.values.every(function (v, i) {
      return matches[i](value.get(i), args);
    });
  };
}

function resolveSymbol(pattern) {
  return function (value) {
    return Checks.is_symbol(value) && value === pattern;
  };
}

function resolveString(pattern) {
  return function (value) {
    return Checks.is_string(value) && value === pattern;
  };
}

function resolveNumber(pattern) {
  return function (value) {
    return Checks.is_number(value) && value === pattern;
  };
}

function resolveBoolean(pattern) {
  return function (value) {
    return Checks.is_boolean(value) && value === pattern;
  };
}

function resolveFunction(pattern) {
  return function (value) {
    return Checks.is_function(value) && value === pattern;
  };
}

function resolveNull(pattern) {
  return function (value) {
    return Checks.is_null(value);
  };
}

function resolveBound(pattern) {
  return function (value, args) {
    if (typeof value === typeof pattern.value && value === pattern.value) {
      args.push(value);
      return true;
    }

    return false;
  };
}

function resolveWildcard() {
  return function () {
    return true;
  };
}

function resolveVariable() {
  return function (value, args) {
    args.push(value);
    return true;
  };
}

function resolveHeadTail() {
  return function (value, args) {
    if (!Checks.is_array(value) || value.length < 2) {
      return false;
    }

    const head = value[0];
    const tail = value.slice(1);

    args.push(head);
    args.push(tail);

    return true;
  };
}

function resolveCapture(pattern) {
  const matches = buildMatch(pattern.value);

  return function (value, args) {
    if (matches(value, args)) {
      args.push(value);
      return true;
    }

    return false;
  };
}

function resolveStartsWith(pattern) {
  const prefix = pattern.prefix;

  return function (value, args) {
    if (Checks.is_string(value) && value.startsWith(prefix)) {
      args.push(value.substring(prefix.length));
      return true;
    }

    return false;
  };
}

function resolveType(pattern) {
  return function (value, args) {
    if (value instanceof pattern.type) {
      const matches = buildMatch(pattern.objPattern);
      return matches(value, args) && args.push(value) > 0;
    }

    return false;
  };
}

function resolveArray(pattern) {
  const matches = pattern.map(x => buildMatch(x));

  return function (value, args) {
    if (!Checks.is_array(value) || value.length != pattern.length) {
      return false;
    }

    return value.every(function (v, i) {
      return matches[i](value[i], args);
    });
  };
}

function resolveObject(pattern) {
  let matches = {};

  for (let key of Object.keys(pattern)) {
    matches[key] = buildMatch(pattern[key]);
  }

  return function (value, args) {
    if (!Checks.is_object(value) || pattern.length > value.length) {
      return false;
    }

    for (let key of Object.keys(pattern)) {
      if (!(key in value) || !matches[key](value[key], args)) {
        return false;
      }
    }

    return true;
  };
}

function resolveNoMatch() {
  return function () {
    return false;
  };
}

var Resolvers = {
  resolveBound,
  resolveWildcard,
  resolveVariable,
  resolveHeadTail,
  resolveCapture,
  resolveStartsWith,
  resolveType,
  resolveArray,
  resolveObject,
  resolveNoMatch,
  resolveSymbol,
  resolveString,
  resolveNumber,
  resolveBoolean,
  resolveFunction,
  resolveNull,
  resolveTuple
};

function buildMatch(pattern) {

  if (Checks.is_tuple(pattern)) {
    return Resolvers.resolveTuple(pattern);
  }

  if (Checks.is_variable(pattern)) {
    return Resolvers.resolveVariable(pattern);
  }

  if (Checks.is_wildcard(pattern)) {
    return Resolvers.resolveWildcard(pattern);
  }

  if (Checks.is_undefined(pattern)) {
    return Resolvers.resolveWildcard(pattern);
  }

  if (Checks.is_headTail(pattern)) {
    return Resolvers.resolveHeadTail(pattern);
  }

  if (Checks.is_startsWith(pattern)) {
    return Resolvers.resolveStartsWith(pattern);
  }

  if (Checks.is_capture(pattern)) {
    return Resolvers.resolveCapture(pattern);
  }

  if (Checks.is_bound(pattern)) {
    return Resolvers.resolveBound(pattern);
  }

  if (Checks.is_type(pattern)) {
    return Resolvers.resolveType(pattern);
  }

  if (Checks.is_array(pattern)) {
    return Resolvers.resolveArray(pattern);
  }

  if (Checks.is_number(pattern)) {
    return Resolvers.resolveNumber(pattern);
  }

  if (Checks.is_string(pattern)) {
    return Resolvers.resolveString(pattern);
  }

  if (Checks.is_boolean(pattern)) {
    return Resolvers.resolveBoolean(pattern);
  }

  if (Checks.is_symbol(pattern)) {
    return Resolvers.resolveSymbol(pattern);
  }

  if (Checks.is_null(pattern)) {
    return Resolvers.resolveNull(pattern);
  }

  if (Checks.is_object(pattern)) {
    return Resolvers.resolveObject(pattern);
  }

  return Resolvers.resolveNoMatch();
}

class MatchError extends Error {
  constructor(arg) {
    super();

    if (typeof arg === 'symbol') {
      this.message = 'No match for: ' + arg.toString();
    } else if (Array.isArray(arg)) {
      let mappedValues = arg.map(x => x.toString());
      this.message = 'No match for: ' + mappedValues;
    } else {
      this.message = 'No match for: ' + arg;
    }

    this.stack = new Error().stack;
    this.name = this.constructor.name;
  }
}

class Case {

  constructor(pattern, fn, guard = () => true) {
    this.pattern = buildMatch(pattern);
    this.fn = fn;
    this.guard = guard;
  }
}

function make_case(pattern, fn, guard = () => true) {
  return new Case(pattern, fn, guard);
}

function defmatch(...cases) {
  return function (...args) {
    for (let processedCase of cases) {
      let result = [];
      if (processedCase.pattern(args, result) && processedCase.guard.apply(this, result)) {
        return processedCase.fn.apply(this, result);
      }
    }

    throw new MatchError(args);
  };
}

function match(pattern, expr, guard = () => true) {
  let result = [];
  let processedPattern = buildMatch(pattern);
  if (processedPattern(expr, result) && guard.apply(this, result)) {
    return result;
  } else {
    throw new MatchError(expr);
  }
}

function match_no_throw(pattern, expr, guard = () => true) {
  try {
    return match(pattern, expr, guard);
  } catch (e) {
    if (e instanceof MatchError) {
      return null;
    }

    throw e;
  }
}

function patternMap(collection, pattern, fun, guard = () => true) {
  let ret = [];

  for (let elem of collection) {
    try {
      let result = fun.apply(this, match(pattern, elem, guard));
      ret = ret.concat(result);
    } catch (e) {
      if (!(e instanceof MatchError)) {
        throw e;
      }
    }
  }

  return ret;
}

var _Patterns = {
  defmatch, match, MatchError, match_no_throw, patternMap,
  variable, wildcard, startsWith,
  capture, headTail, type, bound, Case, make_case
};

class BitString {
  constructor(...args) {
    this.raw_value = function () {
      return Object.freeze(args);
    };

    this.value = Object.freeze(this.process(args));
  }

  get(index) {
    return this.value[index];
  }

  count() {
    return this.value.length;
  }

  [Symbol.iterator]() {
    return this.value[Symbol.iterator]();
  }

  toString() {
    var i,
        s = "";
    for (i = 0; i < this.count(); i++) {
      if (s !== "") {
        s += ", ";
      }
      s += this[i].toString();
    }

    return "<<" + s + ">>";
  }

  process() {
    let processed_values = [];

    var i;
    for (i = 0; i < this.raw_value().length; i++) {
      let processed_value = this["process_" + this.raw_value()[i].type](this.raw_value()[i]);

      for (let attr of this.raw_value()[i].attributes) {
        processed_value = this["process_" + attr](processed_value);
      }

      processed_values = processed_values.concat(processed_value);
    }

    return processed_values;
  }

  process_integer(value) {
    return value.value;
  }

  process_float(value) {
    if (value.size === 64) {
      return BitString.float64ToBytes(value.value);
    } else if (value.size === 32) {
      return BitString.float32ToBytes(value.value);
    }

    throw new Error("Invalid size for float");
  }

  process_bitstring(value) {
    return value.value.value;
  }

  process_binary(value) {
    return BitString.toUTF8Array(value.value);
  }

  process_utf8(value) {
    return BitString.toUTF8Array(value.value);
  }

  process_utf16(value) {
    return BitString.toUTF16Array(value.value);
  }

  process_utf32(value) {
    return BitString.toUTF32Array(value.value);
  }

  process_signed(value) {
    return new Uint8Array([value])[0];
  }

  process_unsigned(value) {
    return value;
  }

  process_native(value) {
    return value;
  }

  process_big(value) {
    return value;
  }

  process_little(value) {
    return value.reverse();
  }

  process_size(value) {
    return value;
  }

  process_unit(value) {
    return value;
  }

  static integer(value) {
    return BitString.wrap(value, { "type": "integer", "unit": 1, "size": 8 });
  }

  static float(value) {
    return BitString.wrap(value, { "type": "float", "unit": 1, "size": 64 });
  }

  static bitstring(value) {
    return BitString.wrap(value, { "type": "bitstring", "unit": 1, "size": value.length });
  }

  static bits(value) {
    return BitString.bitstring(value);
  }

  static binary(value) {
    return BitString.wrap(value, { "type": "binary", "unit": 8, "size": value.length });
  }

  static bytes(value) {
    return BitString.binary(value);
  }

  static utf8(value) {
    return BitString.wrap(value, { "type": "utf8" });
  }

  static utf16(value) {
    return BitString.wrap(value, { "type": "utf16" });
  }

  static utf32(value) {
    return BitString.wrap(value, { "type": "utf32" });
  }

  static signed(value) {
    return BitString.wrap(value, {}, "signed");
  }

  static unsigned(value) {
    return BitString.wrap(value, {}, "unsigned");
  }

  static native(value) {
    return BitString.wrap(value, {}, "native");
  }

  static big(value) {
    return BitString.wrap(value, {}, "big");
  }

  static little(value) {
    return BitString.wrap(value, {}, "little");
  }

  static size(value, count) {
    return BitString.wrap(value, { "size": count });
  }

  static unit(value, count) {
    return BitString.wrap(value, { "unit": count });
  }

  static wrap(value, opt, new_attribute = null) {
    let the_value = value;

    if (!(value instanceof Object)) {
      the_value = { "value": value, "attributes": [] };
    }

    the_value = Object.assign(the_value, opt);

    if (new_attribute) {
      the_value.attributes.push(new_attribute);
    }

    return the_value;
  }

  static toUTF8Array(str) {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 128) {
        utf8.push(charcode);
      } else if (charcode < 2048) {
        utf8.push(192 | charcode >> 6, 128 | charcode & 63);
      } else if (charcode < 55296 || charcode >= 57344) {
        utf8.push(224 | charcode >> 12, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      }
      // surrogate pair
      else {
        i++;
        // UTF-16 encodes 0x10000-0x10FFFF by
        // subtracting 0x10000 and splitting the
        // 20 bits of 0x0-0xFFFFF into two halves
        charcode = 65536 + ((charcode & 1023) << 10 | str.charCodeAt(i) & 1023);
        utf8.push(240 | charcode >> 18, 128 | charcode >> 12 & 63, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      }
    }
    return utf8;
  }

  static toUTF16Array(str) {
    var utf16 = [];
    for (var i = 0; i < str.length; i++) {
      var codePoint = str.codePointAt(i);

      if (codePoint <= 255) {
        utf16.push(0);
        utf16.push(codePoint);
      } else {
        utf16.push(codePoint >> 8 & 255);
        utf16.push(codePoint & 255);
      }
    }
    return utf16;
  }

  static toUTF32Array(str) {
    var utf32 = [];
    for (var i = 0; i < str.length; i++) {
      var codePoint = str.codePointAt(i);

      if (codePoint <= 255) {
        utf32.push(0);
        utf32.push(0);
        utf32.push(0);
        utf32.push(codePoint);
      } else {
        utf32.push(0);
        utf32.push(0);
        utf32.push(codePoint >> 8 & 255);
        utf32.push(codePoint & 255);
      }
    }
    return utf32;
  }

  //http://stackoverflow.com/questions/2003493/javascript-float-from-to-bits
  static float32ToBytes(f) {
    var bytes = [];

    var buf = new ArrayBuffer(4);
    new Float32Array(buf)[0] = f;

    let intVersion = new Uint32Array(buf)[0];

    bytes.push(intVersion >> 24 & 255);
    bytes.push(intVersion >> 16 & 255);
    bytes.push(intVersion >> 8 & 255);
    bytes.push(intVersion & 255);

    return bytes;
  }

  static float64ToBytes(f) {
    var bytes = [];

    var buf = new ArrayBuffer(8);
    new Float64Array(buf)[0] = f;

    var intVersion1 = new Uint32Array(buf)[0];
    var intVersion2 = new Uint32Array(buf)[1];

    bytes.push(intVersion2 >> 24 & 255);
    bytes.push(intVersion2 >> 16 & 255);
    bytes.push(intVersion2 >> 8 & 255);
    bytes.push(intVersion2 & 255);

    bytes.push(intVersion1 >> 24 & 255);
    bytes.push(intVersion1 >> 16 & 255);
    bytes.push(intVersion1 >> 8 & 255);
    bytes.push(intVersion1 & 255);

    return bytes;
  }
}

let SpecialForms = {

  __DIR__: function () {
    if (__dirname) {
      return __dirname;
    }

    if (document.currentScript) {
      return document.currentScript.src;
    }

    return null;
  },

  atom: function (_value) {
    return Symbol.for(_value);
  },

  list: function (...args) {
    return Object.freeze(args);
  },

  bitstring: function (...args) {
    return new BitString(...args);
  },

  bound: function (_var) {
    return Patterns.bound(_var);
  },

  _case: function (condition, clauses) {
    return Patterns.defmatch(...clauses)(condition);
  },

  cond: function (clauses) {
    for (let clause of clauses) {
      if (clause[0]) {
        return clause[1]();
      }
    }

    throw new Error();
  },

  fn: function (clauses) {
    return Patterns.defmatch(clauses);
  },

  map: function (obj) {
    return Object.freeze(obj);
  },

  map_update: function (map, values) {
    return Object.freeze(Object.assign(Object.create(map.constructor.prototype), map, values));
  },

  _for: function (collections, fun, filter = () => true, into = [], previousValues = []) {
    let pattern = collections[0][0];
    let collection = collections[0][1];

    if (collections.length === 1) {

      for (let elem of collection) {
        let r = Patterns.match_no_throw(pattern, elem);
        let args = previousValues.concat(r);

        if (r && filter.apply(this, args)) {
          into = Enum.into([fun.apply(this, args)], into);
        }
      }

      return into;
    } else {
      let _into = [];

      for (let elem of collection) {
        let r = Patterns.match_no_throw(pattern, elem);
        if (r) {
          _into = Enum.into(this._for(collections.slice(1), fun, filter, _into, previousValues.concat(r)), into);
        }
      }

      return _into;
    }
  },

  receive: function (receive_fun, timeout_in_ms = null, timeout_fn = time => true) {
    if (timeout_in_ms == null || timeout_in_ms === System.for('infinity')) {
      while (true) {
        if (self.mailbox.length !== 0) {
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }
    } else if (timeout_in_ms === 0) {
      if (self.mailbox.length !== 0) {
        let message = self.mailbox[0];
        self.mailbox = self.mailbox.slice(1);
        return receive_fun(message);
      } else {
        return null;
      }
    } else {
      let now = Date.now();
      while (Date.now() < now + timeout_in_ms) {
        if (self.mailbox.length !== 0) {
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }

      return timeout_fn(timeout_in_ms);
    }
  },

  tuple: function (...args) {
    return new Tuple(...args);
  },

  _try: function (do_fun, rescue_function, catch_fun, else_function, after_function) {
    let result = null;

    try {
      result = do_fun();
    } catch (e) {
      let ex_result = null;

      if (rescue_function) {
        try {
          ex_result = rescue_function(e);
          return ex_result;
        } catch (ex) {
          if (ex instanceof Patterns.MatchError) {
            throw ex;
          }
        }
      }

      if (catch_fun) {
        try {
          ex_result = catch_fun(e);
          return ex_result;
        } catch (ex) {
          if (ex instanceof Patterns.MatchError) {
            throw ex;
          }
        }
      }

      throw e;
    } finally {
      if (after_function) {
        after_function();
      }
    }

    if (else_function) {
      try {
        return else_function(result);
      } catch (ex) {
        if (ex instanceof Patterns.MatchError) {
          throw new Error('No Match Found in Else');
        }

        throw ex;
      }
    } else {
      return result;
    }
  }

};

/* @flow */

let process_counter = -1;

class PID {
  constructor() {
    process_counter = process_counter + 1;
    this.id = process_counter;
  }

  toString() {
    return "PID#<0." + this.id + ".0>";
  }
}

class IntegerType {}
class FloatType {}

//https://github.com/airportyh/protomorphism
class Protocol {
  constructor(spec) {
    this.registry = new Map();
    this.fallback = null;

    for (let funName in spec) {
      this[funName] = createFun(funName).bind(this);
    }

    function createFun(funName) {

      return function (...args) {
        let thing = args[0];
        let fun = null;

        if (Number.isInteger(thing) && this.hasImplementation(IntegerType)) {
          fun = this.registry.get(IntegerType)[funName];
        } else if (typeof thing === "number" && !Number.isInteger(thing) && this.hasImplementation(FloatType)) {
          fun = this.registry.get(FloatType)[funName];
        } else if (this.hasImplementation(thing)) {
          fun = this.registry.get(thing.constructor)[funName];
        } else if (this.fallback) {
          fun = this.fallback[funName];
        }

        if (fun != null) {
          let retval = fun.apply(this, args);
          return retval;
        }

        throw new Error("No implementation found for " + thing);
      };
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
    return this.registry.has(thing.constructor);
  }
}

function tl(list) {
  return SpecialForms.list(...list.slice(1));
}

function hd(list) {
  return list[0];
}

function is_nil(x) {
  return x === null;
}

function is_atom(x) {
  return typeof x === 'symbol';
}

function is_binary(x) {
  return typeof x === 'string' || x instanceof String;
}

function is_boolean(x) {
  return typeof x === 'boolean' || x instanceof Boolean;
}

function is_function(x, arity = -1) {
  return typeof x === 'function' || x instanceof Function;
}

function is_float(x) {
  return is_number(x) && !Number.isInteger(x);
}

function is_integer(x) {
  return Number.isInteger(x);
}

function is_list(x) {
  return x instanceof Array;
}

function is_map(x) {
  return typeof x === 'object' || x instanceof Object;
}

function is_number(x) {
  return typeof x === 'number';
}

function is_tuple(x) {
  return x instanceof Tuple;
}

function _length(x) {
  return x.length;
}

function is_pid(x) {
  return x instanceof PID;
}

function is_port(x) {
  return false;
}

function is_reference(x) {
  return false;
}

function is_bitstring(x) {
  return is_binary(x) || x instanceof BitString;
}

function __in__(left, right) {
  for (let x of right) {
    if (match__qmark__(left, x)) {
      return true;
    }
  }

  return false;
}

function abs(number) {
  return Math.abs(number);
}

function round(number) {
  return Math.round(number);
}

function elem(tuple, index) {
  if (is_list(tuple)) {
    return tuple[index];
  }

  return tuple.get(index);
}

function rem(left, right) {
  return left % right;
}

function div(left, right) {
  return left / right;
}

function and(left, right) {
  return left && right;
}

function or(left, right) {
  return left || right;
}

function not(arg) {
  return !arg;
}

function apply(...args) {
  if (args.length === 3) {
    let mod = args[0];
    let func = args[1];
    let func_args = args[2];
    return mod[func].apply(null, func_args);
  } else {
    let func = args[0];
    let func_args = args[1];

    return func.apply(null, func_args);
  }
}

function to_string(arg) {
  if (is_tuple(arg)) {
    return Tuple.to_string(arg);
  }

  return arg.toString();
}

function match__qmark__(pattern, expr, guard = () => true) {
  return _Patterns.match_no_throw(pattern, expr, guard) != null;
}

function defstruct(defaults) {
  return class {
    constructor(update = {}) {
      let the_values = Object.assign(defaults, update);
      Object.assign(this, the_values);
    }

    static create(updates = {}) {
      let x = new this(updates);
      return Object.freeze(x);
    }
  };
}

function defexception(defaults) {
  return class extends Error {
    constructor(update = {}) {
      let message = update.message || '';
      super(message);

      let the_values = Object.assign(defaults, update);
      Object.assign(this, the_values);

      this.name = this.constructor.name;
      this.message = message;
      this[SpecialForms.atom('__exception__')] = true;
      Error.captureStackTrace(this, this.constructor.name);
    }

    static create(updates = {}) {
      let x = new this(updates);
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

var Kernel = {
  SpecialForms,
  tl,
  hd,
  is_nil,
  is_atom,
  is_binary,
  is_boolean,
  is_function,
  is_float,
  is_integer,
  is_list,
  is_map,
  is_number,
  is_tuple,
  length: _length,
  is_pid,
  is_port,
  is_reference,
  is_bitstring,
  in: __in__,
  abs,
  round,
  elem,
  rem,
  div,
  and,
  or,
  not,
  apply,
  to_string,
  match__qmark__,
  defstruct,
  defprotocol,
  defimpl
};

let Enum = {

  all__qmark__: function (collection, fun = x => x) {
    for (let elem of collection) {
      if (!fun(elem)) {
        return false;
      }
    }

    return true;
  },

  any__qmark__: function (collection, fun = x => x) {
    for (let elem of collection) {
      if (fun(elem)) {
        return true;
      }
    }

    return false;
  },

  at: function (collection, n, the_default = null) {
    if (n > this.count(collection) || n < 0) {
      return the_default;
    }

    return collection[n];
  },

  concat: function (...enumables) {
    return enumables[0].concat(enumables[1]);
  },

  count: function (collection, fun = null) {
    if (fun == null) {
      return collection.length;
    } else {
      return collection.filter(fun).length;
    }
  },

  drop: function (collection, count) {
    return collection.slice(count);
  },

  drop_while: function (collection, fun) {
    let count = 0;

    for (let elem of collection) {
      if (fun(elem)) {
        count = count + 1;
      } else {
        break;
      }
    }

    return collection.slice(count);
  },

  each: function (collection, fun) {
    for (let elem of collection) {
      fun(elem);
    }
  },

  empty__qmark__: function (collection) {
    return collection.length === 0;
  },

  fetch: function (collection, n) {
    if (Kernel.is_list(collection)) {
      if (n < this.count(collection) && n >= 0) {
        return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), collection[n]);
      } else {
        return Kernel.SpecialForms.atom("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function (collection, n) {
    if (Kernel.is_list(collection)) {
      if (n < this.count(collection) && n >= 0) {
        return collection[n];
      } else {
        throw new Error("out of bounds error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  filter: function (collection, fun) {
    let result = [];

    for (let elem of collection) {
      if (fun(elem)) {
        result.push(elem);
      }
    }

    return result;
  },

  filter_map: function (collection, filter, mapper) {
    return Enum.map(Enum.filter(collection, filter), mapper);
  },

  find: function (collection, if_none = null, fun) {
    for (let elem of collection) {
      if (fun(elem)) {
        return elem;
      }
    }

    return if_none;
  },

  into: function (collection, list) {
    return list.concat(collection);
  },

  map: function (collection, fun) {
    let result = [];

    for (let elem of collection) {
      result.push(fun(elem));
    }

    return result;
  },

  map_reduce: function (collection, acc, fun) {
    let mapped = Kernel.SpecialForms.list();
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = Kernel.elem(tuple, 1);
      mapped = Kernel.SpecialForms.list(...mapped.concat([Kernel.elem(tuple, 0)]));
    }

    return Kernel.SpecialForms.tuple(mapped, the_acc);
  },

  member: function (collection, value) {
    return collection.includes(value);
  },

  reduce: function (collection, acc, fun) {
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = Kernel.elem(tuple, 1);
    }

    return the_acc;
  },

  take: function (collection, count) {
    return collection.slice(0, count);
  },

  take_every: function (collection, nth) {
    let result = [];
    let index = 0;

    for (let elem of collection) {
      if (index % nth === 0) {
        result.push(elem);
      }
    }

    return Kernel.SpecialForms.list(...result);
  },

  take_while: function (collection, fun) {
    let count = 0;

    for (let elem of collection) {
      if (fun(elem)) {
        count = count + 1;
      } else {
        break;
      }
    }

    return collection.slice(0, count);
  },

  to_list: function (collection) {
    return collection;
  }
};

let Atom = {};

Atom.to_string = function (atom) {
  return Symbol.keyFor(atom);
};

Atom.to_char_list = function (atom) {
  return Atom.to_string(atom).split('');
};

let Integer = {

  is_even: function (n) {
    return n % 2 === 0;
  },

  is_odd: function (n) {
    return n % 2 !== 0;
  },

  parse: function (bin) {
    let result = parseInt(bin);

    if (isNaN(result)) {
      return Kernel.SpecialForms.atom("error");
    }

    let indexOfDot = bin.indexOf(".");

    if (indexOfDot >= 0) {
      return Kernel.SpecialForms.tuple(result, bin.substring(indexOfDot));
    }

    return Kernel.SpecialForms.tuple(result, "");
  },

  to_char_list: function (number, base = 10) {
    return number.toString(base).split("");
  },

  to_string: function (number, base = 10) {
    return number.toString(base);
  }
};

let _Chars = Kernel.defprotocol({
  to_string: function (thing) {}
});

Kernel.defimpl(_Chars, BitString, {
  to_string: function (thing) {
    if (Kernel.is_binary(thing)) {
      return thing;
    }

    return thing.toString();
  }
});

Kernel.defimpl(_Chars, Symbol, {
  to_string: function (thing) {
    if (nil) {
      return "";
    }

    return Atom.to_string(thing);
  }
});

Kernel.defimpl(_Chars, IntegerType, {
  to_string: function (thing) {
    return Integer.to_string(thing);
  }
});

Kernel.defimpl(_Chars, FloatType, {
  to_string: function (thing) {
    return thing.toString;
  }
});

Kernel.defimpl(_Chars, Array, {
  to_string: function (thing) {
    return thing.toString();
  }
});

Kernel.defimpl(_Chars, Tuple, {
  to_string: function (thing) {
    return Tuple.to_string(thing);
  }
});

Kernel.defimpl(_Chars, null, {
  to_string: function (thing) {
    return thing.toString();
  }
});

function to_atom(string) {
  return Symbol.for(string);
}

function to_existing_atom(string) {
  return Symbol.for(string);
}

function to_char_list(string) {
  return string.split('');
}

function to_float(string) {
  return parseFloat(string);
}

function to_integer(string, base = 10) {
  return parseInt(string, base);
}

function upcase(binary) {
  return binary.toUpperCase();
}

function downcase(binary) {
  return binary.toLowerCase();
}

function at(string, position) {
  if (position > string.length - 1) {
    return null;
  }

  return string[position];
}

function capitalize(string) {
  let returnString = '';

  for (let i = 0; i < string.length; i++) {
    if (i === 0) {
      returnString = returnString + string[i].toUpperCase();
    } else {
      returnString = returnString + string[i].toLowerCase();
    }
  }

  return returnString;
}

function codepoints(string) {
  return to_char_list(string).map(function (c) {
    return c.codePointAt(0);
  });
}

function contains__qm__(string, contains) {
  if (Array.isArray(contains)) {
    return contains.some(function (s) {
      return string.indexOf(s) > -1;
    });
  }

  return string.indexOf(contains) > -1;
}

function duplicate(subject, n) {
  return subject.repeat(n);
}

function ends_with__qm__(string, suffixes) {
  if (Array.isArray(suffixes)) {
    return suffixes.some(function (s) {
      return string.endsWith(s);
    });
  }

  return string.endsWith(suffixes);
}

function first(string) {
  if (!string) {
    return null;
  }

  return string[0];
}

function graphemes(string) {
  return string.split('');
}

function last(string) {
  if (!string) {
    return null;
  }

  return string[string.length - 1];
}

function length(string) {
  return string.length;
}

function match__qm__(string, regex) {
  return string.match(regex) != null;
}

function next_codepoint(string) {
  if (!string || string === '') {
    return null;
  }

  return Kernel.SpecialForms.tuple(string[0].codePointAt(0), string.substr(1));
}

function next_grapheme(string) {
  if (!string || string === '') {
    return null;
  }

  return Kernel.SpecialForms.tuple(string[0], string.substr(1));
}

function reverse(string) {
  let returnValue = '';

  for (var i = string.length - 1; i >= 0; i--) {
    returnValue = returnValue + string[i];
  };

  return returnValue;
}

function _split(string) {
  return string.split();
}

function starts_with__qm__(string, prefixes) {
  if (Array.isArray(prefixes)) {
    return prefixes.some(function (s) {
      return string.startsWith(s);
    });
  }

  return string.startsWith(prefixes);
}

function valid_character__qm__(codepoint) {
  try {
    return String.fromCodePoint(codepoint) != null;
  } catch (e) {
    return false;
  }
}

var _String = {
  at,
  capitalize,
  codepoints,
  contains__qm__,
  downcase,
  duplicate,
  ends_with__qm__,
  first,
  graphemes,
  last,
  length,
  match__qm__,
  next_codepoint,
  next_grapheme,
  reverse,
  split: _split,
  starts_with__qm__,
  to_atom,
  to_char_list,
  to_existing_atom,
  to_float,
  to_integer,
  upcase,
  valid_character__qm__,
  Chars: _Chars
};

let Chars = Kernel.defprotocol({
  to_char_list: function (thing) {}
});

Kernel.defimpl(Chars, Kernel.is_bitstring, {
  to_char_list: function (thing) {
    if (Kernel.is_binary(thing)) {
      return _String.to_char_list(thing);
    }

    return thing.toString();
  }
});

Kernel.defimpl(Chars, Kernel.is_atom, {
  to_char_list: function (thing) {
    return Atom.to_char_list(thing);
  }
});

Kernel.defimpl(Chars, Kernel.is_integer, {
  to_char_list: function (thing) {
    return Integer.to_char_list(thing);
  }
});

Kernel.defimpl(Chars, Kernel.is_list, {
  to_char_list: function (thing) {
    return thing;
  }
});

let List = {};

List.Chars = Chars;

List.delete = function (list, item) {
  let new_value = [];
  let value_found = false;

  for (let x of list) {
    if (x === item && value_found !== false) {
      new_value.push(x);
      value_found = true;
    } else if (x !== item) {
      new_value.push(x);
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.delete_at = function (list, index) {
  let new_value = [];

  for (let i = 0; i < list.length; i++) {
    if (i !== index) {
      new_value.push(list[i]);
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.duplicate = function (elem, n) {
  let new_value = [];

  for (var i = 0; i < n; i++) {
    new_value.push(elem);
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.first = function (list) {
  return list[0];
};

List.flatten = function (list, tail = Kernel.SpecialForms.list()) {
  let new_value = [];

  for (let x of list) {
    if (Kernel.is_list(x)) {
      new_value = new_value.concat(List.flatten(x));
    } else {
      new_value.push(x);
    }
  }

  new_value = new_value.concat(tail);

  return Kernel.SpecialForms.list(...new_value);
};

List.foldl = function (list, acc, func) {
  return list.reduce(func, acc);
};

List.foldr = function (list, acc, func) {
  let new_acc = acc;

  for (var i = list.length - 1; i >= 0; i--) {
    new_acc = func(list[i], new_acc);
  }

  return new_acc;
};

List.insert_at = function (list, index, value) {
  let new_value = [];

  for (let i = 0; i < list.length; i++) {
    if (i === index) {
      new_value.push(value);
      new_value.push(list[i]);
    } else {
      new_value.push(list[i]);
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.keydelete = function (list, key, position) {
  let new_list = [];

  for (let i = 0; i < list.length; i++) {
    if (!Kernel.match__qmark__(list[i][position], key)) {
      new_list.push(list[i]);
    }
  }

  return Kernel.SpecialForms.list(...new_list);
};

List.keyfind = function (list, key, position, _default = null) {

  for (let i = 0; i < list.length; i++) {
    if (Kernel.match__qmark__(list[i][position], key)) {
      return list[i];
    }
  }

  return _default;
};

List.keymember__qmark__ = function (list, key, position) {

  for (let i = 0; i < list.length; i++) {
    if (Kernel.match__qmark__(list[i][position], key)) {
      return true;
    }
  }

  return false;
};

List.keyreplace = function (list, key, position, new_tuple) {
  let new_list = [];

  for (let i = 0; i < list.length; i++) {
    if (!Kernel.match__qmark__(list[i][position], key)) {
      new_list.push(list[i]);
    } else {
      new_list.push(new_tuple);
    }
  }

  return Kernel.SpecialForms.list(...new_list);
};

List.keysort = function (list, position) {
  let new_list = list;

  new_list.sort(function (a, b) {
    if (position === 0) {
      if (a[position].value < b[position].value) {
        return -1;
      }

      if (a[position].value > b[position].value) {
        return 1;
      }

      return 0;
    } else {
      if (a[position] < b[position]) {
        return -1;
      }

      if (a[position] > b[position]) {
        return 1;
      }

      return 0;
    }
  });

  return Kernel.SpecialForms.list(...new_list);
};

List.keystore = function (list, key, position, new_tuple) {
  let new_list = [];
  let replaced = false;

  for (let i = 0; i < list.length; i++) {
    if (!Kernel.match__qmark__(list[i][position], key)) {
      new_list.push(list[i]);
    } else {
      new_list.push(new_tuple);
      replaced = true;
    }
  }

  if (!replaced) {
    new_list.push(new_tuple);
  }

  return Kernel.SpecialForms.list(...new_list);
};

List.last = function (list) {
  return list[list.length - 1];
};

List.replace_at = function (list, index, value) {
  let new_value = [];

  for (let i = 0; i < list.length; i++) {
    if (i === index) {
      new_value.push(value);
    } else {
      new_value.push(list[i]);
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.update_at = function (list, index, fun) {
  let new_value = [];

  for (let i = 0; i < list.count(); i++) {
    if (i === index) {
      new_value.push(fun(list.get(i)));
    } else {
      new_value.push(list.get(i));
    }
  }

  return new_value;
};

List.wrap = function (list) {
  if (Kernel.is_list(list)) {
    return list;
  } else if (list == null) {
    return Kernel.SpecialForms.list();
  } else {
    return Kernel.SpecialForms.list(list);
  }
};

List.zip = function (list_of_lists) {
  if (list_of_lists.length === 0) {
    return Kernel.SpecialForms.list();
  }

  let new_value = [];
  let smallest_length = list_of_lists[0];

  for (let x of list_of_lists) {
    if (x.length < smallest_length) {
      smallest_length = x.length;
    }
  }

  for (let i = 0; i < smallest_length; i++) {
    let current_value = [];
    for (let j = 0; j < list_of_lists.length; j++) {
      current_value.push(list_of_lists[j][i]);
    }

    new_value.push(Kernel.SpecialForms.tuple(...current_value));
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.to_tuple = function (list) {
  return Kernel.SpecialForms.tuple.apply(null, list);
};

List.append = function (list, value) {
  return Kernel.SpecialForms.list(...list.concat([value]));
};

List.prepend = function (list, value) {
  return Kernel.SpecialForms.list(...[value].concat(list));
};

List.concat = function (left, right) {
  return left.concat(right);
};

class Signal {

  constructor() {
    this.bindings = SpecialForms.list();
  }

  add(listener, context = this) {
    this.bindings = List.append(this.bindings, new SignalBinding(this, listener, context));
  }

  remove(listener) {
    this.bindings = Enum.filter(this.bindings, function (binding) {
      return binding.listener !== listener;
    });
  }

  dispatch(...params) {
    for (let binding of this.bindings) {
      binding.execute(...params);
    }
  }

  dispose() {
    for (let binding of this.bindings) {
      binding.dispose();
    }

    this.bindings = null;
  }
}

class SignalBinding {

  constructor(signal, listener, context) {
    this.listener = listener;
    this.signal = signal;
    this.context = context;
  }

  execute(...params) {
    this.listener.apply(this.context, params);
  }

  dispose() {
    this.listener = null;
    this.signal = null;
    this.context = null;
  }
}

function __update(map, key, value) {
  let m = new Map(map);
  m.set(key, value);
  return m;
}

function remove(map, key) {
  let m = new Map(map);
  m.delete(key);
  return m;
}

class MailBox {

  constructor(context = this) {
    this.signal = new Signal();
    this.signal.add((...params) => this.messages = this.messages.concat(params), context);
    this.messages = [];
  }

  receive(...messages) {
    this.signal.dispatch(...messages);
  }

  peek() {
    if (this.messages.length === 0) {
      return null;
    }

    return this.messages[0];
  }

  read() {
    let result = this.messages[0];
    this.messages = this.messages.slice(1);

    return result;
  }

  add_subscriber(fn, context = this) {
    this.signal.add(fn, context);
  }

  remove_subscriber(fn) {
    this.signal.remove(fn);
  }

  dispose() {
    this.signal.dispose();
    this.messages = null;
  }
}

class PostOffice {

  constructor() {
    this.mailboxes = new Map();
  }

  send(address, message) {
    this.mailboxes.get(address).receive(message);
  }

  receive(address) {
    return this.mailboxes.get(address).read();
  }

  peek(address) {
    return this.mailboxes.get(address).peek();
  }

  add_mailbox(address = Symbol(), context = this) {
    this.mailboxes = __update(this.mailboxes, address, new MailBox());
    return address;
  }

  remove_mailbox(address) {
    this.mailboxes.get(address).dispose();
    this.mailboxes = remove(this.mailboxes, address);
  }

  subscribe(address, subscribtion_fn, context = this) {
    this.mailboxes.get(address).add_subscriber(subscribtion_fn, context);
  }

  unsubscribe(address, subscribtion_fn) {
    this.mailboxes.get(address).remove_subscriber(subscribtion_fn);
  }
}

function call_property(item, property) {
  if (property in item) {
    item[property];
    if (item[property] instanceof Function) {
      return item[property]();
    } else {
      return item[property];
    }
  } else if (Symbol.for(property) in item) {
    let prop = Symbol.for(property);
    if (item[prop] instanceof Function) {
      return item[prop]();
    } else {
      return item[prop];
    }
  }

  throw new Error(`Property ${ property } not found in ${ item }`);
}

var JS = {
  call_property
};

let Range = function (_first, _last) {
  if (!(this instanceof Range)) {
    return new Range(_first, _last);
  }

  this.first = function () {
    return _first;
  };

  this.last = function () {
    return _last;
  };

  let _range = [];

  for (let i = _first; i <= _last; i++) {
    _range.push(i);
  }

  _range = Object.freeze(_range);

  this.value = function () {
    return _range;
  };

  this.length = function () {
    return _range.length;
  };

  return this;
};

Range.prototype[Symbol.iterator] = function () {
  return this.value()[Symbol.iterator]();
};

Range.new = function (first, last) {
  return Range(first, last);
};

Range.range__qmark__ = function (range) {
  return range instanceof Range;
};

let Keyword = {};

Keyword.has_key__qm__ = function (keywords, key) {
  for (let keyword of keywords) {
    if (Kernel.elem(keyword, 0) == key) {
      return true;
    }
  }

  return false;
};

Keyword.get = function (keywords, key, the_default = null) {
  for (let keyword of keywords) {
    if (Kernel.elem(keyword, 0) == key) {
      return Kernel.elem(keyword, 1);
    }
  }

  return the_default;
};

let Agent = {};

Agent.start = function (fun, options = []) {
  const name = Keyword.has_key__qm__(options, Kernel.SpecialForms.atom('name')) ? Keyword.get(options, Kernel.SpecialForms.atom('name')) : Symbol();

  self.post_office.add_mailbox(name);
  self.post_office.send(name, fun());

  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('ok'), name);
};

Agent.stop = function (agent, timeout = 5000) {
  self.post_office.remove_mailbox(agent);
  return Kernel.SpecialForms.atom('ok');
};

Agent.update = function (agent, fun, timeout = 5000) {

  const current_state = self.post_office.receive(agent);
  self.post_office.send(agent, fun(current_state));

  return Kernel.SpecialForms.atom('ok');
};

Agent.get = function (agent, fun, timeout = 5000) {
  return fun(self.post_office.peek(agent));
};

Agent.get_and_update = function (agent, fun, timeout = 5000) {

  const get_and_update_tuple = fun(self.post_office.receive(agent));
  self.post_office.send(agent, Kernel.elem(get_and_update_tuple, 1));

  return Kernel.elem(get_and_update_tuple, 0);
};

//https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_rewrite_the_DOMs_atob()_and_btoa()_using_JavaScript's_TypedArrays_and_UTF-8
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}

function encode64(data) {
  return b64EncodeUnicode(data);
}

function decode64(data) {
  try {
    return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('ok'), atob(data));
  } catch (e) {
    return Kernel.SpecialForms.atom('error');
  }
  return btoa(data);
}

function decode64__em__(data) {
  return atob(data);
}

var Base = {
  encode64,
  decode64,
  decode64__em__
};

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

var Bitwise = {
  bnot,
  band,
  bor,
  bsl,
  bsr,
  bxor
};

let Enumerable = Kernel.defprotocol({
  count: function (collection) {},
  member_qmark__: function (collection, value) {},
  reduce: function (collection, acc, fun) {}
});

let Collectable = Kernel.defprotocol({
  into: function (collectable) {}
});

let Inspect = Kernel.defprotocol({
  inspect: function (thing, opts) {}
});

function ___new__() {
  return SpecialForms.map({});
}

function keys(map) {
  return Object.keys(map);
}

function __size(map) {
  return keys(map).length;
}

function __to_list(map) {
  let map_keys = keys(map);
  let list = [];

  for (let key of map_keys) {
    list.push(SpecialForms.tuple(key, map[key]));
  }

  return SpecialForms.list(...list);
}

function values(map) {
  let map_keys = keys(map);
  let list = [];

  for (let key of map_keys) {
    list.push(map[key]);
  }

  return SpecialForms.list(...list);
}

function from_struct(struct) {
  let map = Object.assign({}, struct);
  delete map[Symbol.for("__struct__")];

  return SpecialForms.map(map);
}

function ____delete__(map, key) {
  let new_map = Object.assign({}, map);

  delete new_map[key];

  return SpecialForms.map(new_map);
}

function drop(map, keys) {
  let new_map = Object.assign({}, map);

  for (let key of keys) {
    delete new_map[key];
  }

  return SpecialForms.map(new_map);
}

function __equal__qmark__(map1, map2) {
  return map1 === map2;
}

function fetch__emark__(map, key) {
  if (key in map) {
    return map[key];
  }

  throw new Error("Key not found.");
}

function fetch(map, key) {
  if (key in map) {
    return SpecialForms.tuple(SpecialForms.atom("ok"), map[key]);
  }

  return SpecialForms.atom("error");
}

function has_key__qmark__(map, key) {
  return key in map;
}

function merge(map1, map2) {
  return SpecialForms.map_update(map1, map2);
}

function split(map, keys) {
  let split1 = {};
  let split2 = {};

  for (let key of Object.keys(map)) {
    if (keys.indexOf(key) > -1) {
      split1[key] = map[key];
    } else {
      split2[key] = map[key];
    }
  }

  return SpecialForms.tuple(SpecialForms.map(split1), SpecialForms.map(split2));
}

function take(map, keys) {
  let split1 = {};

  for (let key of Object.keys(map)) {
    if (keys.indexOf(key) > -1) {
      split1[key] = map[key];
    }
  }

  return SpecialForms.map(split1);
}

function drop(map, keys) {
  let split1 = {};

  for (let key of Object.keys(map)) {
    if (keys.indexOf(key) === -1) {
      split1[key] = map[key];
    }
  }

  return SpecialForms.map(split1);
}

function put_new(map, key, value) {
  if (key in map) {
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = value;

  return SpecialForms.map(new_map);
}

function put_new_lazy(map, key, fun) {
  if (key in map) {
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = fun();

  return SpecialForms.map(new_map);
}

function get_and_update(map, key, fun) {
  if (key in map) {
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = fun(map[key]);

  return SpecialForms.map(new_map);
}

function pop_lazy(map, key, fun) {
  if (!key in map) {
    return SpecialForms.tuple(fun(), map);
  }

  let new_map = Object.assign({}, map);
  let value = fun(new_map[key]);
  delete new_map[key];

  return SpecialForms.tuple(value, new_map);
}

function pop(map, key, _default = null) {
  if (!key in map) {
    return SpecialForms.tuple(_default, map);
  }

  let new_map = Object.assign({}, map);
  let value = new_map[key];
  delete new_map[key];

  return SpecialForms.tuple(value, new_map);
}

function get_lazy(map, key, fun) {
  if (!key in map) {
    return fun();
  }

  return fun(map[key]);
}

function get(map, key, _default = null) {
  if (!key in map) {
    return _default;
  }

  return map[key];
}

function __put(map, key, val) {
  let new_map = Object({}, map);
  new_map[key] = val;

  return SpecialForms.map(new_map);
}

function update__emark__(map, key, fun) {
  if (!key in map) {
    throw new Error("Key not found");
  }

  let new_map = Object({}, map);
  new_map[key] = fun(map[key]);

  return SpecialForms.map(new_map);
}

function _update(map, key, initial, fun) {
  let new_map = Object({}, map);

  if (!key in map) {
    new_map[key] = initial;
  } else {
    new_map[key] = fun(map[key]);
  }

  return SpecialForms.map(new_map);
}

var _Map = {
  new: ___new__,
  keys,
  size: __size,
  to_list: __to_list,
  values,
  from_struct,
  delete: ____delete__,
  drop,
  equal__qmark__: __equal__qmark__,
  fetch__emark__,
  fetch,
  has_key__qmark__,
  split,
  take,
  put_new,
  put_new_lazy,
  get_and_update,
  pop_lazy,
  pop,
  get_lazy,
  get,
  put: __put,
  update__emark__,
  update: _update
};

function __new__() {
  return SpecialForms.map({ [Symbol.for('__struct__')]: Symbol.for('MapSet'), set: SpecialForms.list() });
}

function _size(map) {
  return map.set.length;
}

function _to_list(map) {
  return map.set;
}

function ___delete__(set, term) {
  let new_list = List.delete(set.set, term);

  let new_map = Object.assign({}, set);
  new_map.set = new_list;
  return SpecialForms.map(new_map);
}

function _put(set, term) {
  if (set.set.indexOf(term) === -1) {
    let new_list = List.append(set.set, term);

    let new_map = Object.assign({}, set);
    new_map.set = new_list;
    return SpecialForms.map(new_map);
  }

  return set;
}

function _difference(set1, set2) {
  let new_map = Object.assign({}, set1);

  for (let val of set1.set) {
    if (_member__qmark__(set2, val)) {
      new_map.set = List.delete(new_map.set, val);
    }
  }

  return SpecialForms.map(new_map);
}

function _intersection(set1, set2) {
  let new_map = Object.assign({}, set1);

  for (let val of set1.set) {
    if (!_member__qmark__(set2, val)) {
      new_map.set = List.delete(new_map.set, val);
    }
  }

  return SpecialForms.map(new_map);
}

function _union(set1, set2) {
  let new_map = set1;

  for (let val of set2.set) {
    new_map = _put(new_map, val);
  }

  return SpecialForms.map(new_map);
}

function _disjoin__qmark__(set1, set2) {
  for (let val of set1.set) {
    if (_member__qmark__(set2, val)) {
      return false;
    }
  }

  return true;
}

function _member__qmark__(set, value) {
  return set.set.indexOf(value) >= 0;
}

function _equal__qmark__(set1, set2) {
  return set1.set === set2.set;
}

function _subset__qmark__(set1, set2) {
  for (let val of set1.set) {
    if (!_member__qmark__(set2, val)) {
      return false;
    }
  }

  return true;
}

var MapSet = {
  new: __new__,
  size: _size,
  to_list: _to_list,
  disjoin__qmark__: _disjoin__qmark__,
  delete: ___delete__,
  subset__qmark__: _subset__qmark__,
  equal__qmark__: _equal__qmark__,
  member__qmark__: _member__qmark__,
  put: _put,
  union: _union,
  intersection: _intersection,
  difference: _difference
};

function size(map) {
  return MapSet.size(map);
}

function to_list(map) {
  return MapSet.to_list(map);
}

function __delete__(set, term) {
  return MapSet.delete(set, term);
}

function put(set, term) {
  return MapSet.put(set, term);
}

function difference(set1, set2) {
  return MapSet.difference(set1, set2);
}

function intersection(set1, set2) {
  return MapSet.intersection(set1, set2);
}

function union(set1, set2) {
  return MapSet.union(set1, set2);
}

function disjoin__qmark__(set1, set2) {
  return MapSet.disjoin__qmark__(set1, set2);
}

function member__qmark__(set, value) {
  return MapSet.member__qmark__(set1, set2);
}

function equal__qmark__(set1, set2) {
  return MapSet.equal__qmark__(set1, set2);
}

function subset__qmark__(set1, set2) {
  return MapSet.subset__qmark__(set1, set2);
}

var _Set = {
  size,
  to_list,
  disjoin__qmark__,
  delete: __delete__,
  subset__qmark__,
  equal__qmark__,
  member__qmark__,
  put,
  union,
  intersection,
  difference
};

self.post_office = self.post_office || new PostOffice();

export { _Patterns as Patterns, BitString, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, Base, _String as String, Bitwise, Enumerable, Collectable, Inspect, _Map as Map, _Set as Set, MapSet, IntegerType, FloatType };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJlbGl4aXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIFBhdHRlcm5zID0ge1xuICBnZXQgZGVmYXVsdCAoKSB7IHJldHVybiBfUGF0dGVybnM7IH1cbn07XG5cbmNsYXNzIFR1cGxlIHtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgdGhpcy52YWx1ZXMgPSBPYmplY3QuZnJlZXplKGFyZ3MpO1xuICB9XG5cbiAgZ2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgfVxuXG4gIGNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5sZW5ndGg7XG4gIH1cblxuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXNbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgdmFyIGksXG4gICAgICAgIHMgPSBcIlwiO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHMgIT09IFwiXCIpIHtcbiAgICAgICAgcyArPSBcIiwgXCI7XG4gICAgICB9XG4gICAgICBzICs9IHRoaXMudmFsdWVzW2ldLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwie1wiICsgcyArIFwifVwiO1xuICB9XG5cbiAgc3RhdGljIHRvX3N0cmluZyh0dXBsZSkge1xuICAgIHJldHVybiB0dXBsZS50b1N0cmluZygpO1xuICB9XG5cbiAgc3RhdGljIGRlbGV0ZV9hdCh0dXBsZSwgaW5kZXgpIHtcbiAgICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHVwbGUuY291bnQoKTsgaSsrKSB7XG4gICAgICBpZiAoaSAhPT0gaW5kZXgpIHtcbiAgICAgICAgbmV3X2xpc3QucHVzaCh0dXBsZS5nZXQoaSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlLmFwcGx5KG51bGwsIG5ld19saXN0KTtcbiAgfVxuXG4gIHN0YXRpYyBkdXBsaWNhdGUoZGF0YSwgc2l6ZSkge1xuICAgIGxldCBhcnJheSA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IHNpemUgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgYXJyYXkucHVzaChkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZS5hcHBseShudWxsLCBhcnJheSk7XG4gIH1cblxuICBzdGF0aWMgaW5zZXJ0X2F0KHR1cGxlLCBpbmRleCwgdGVybSkge1xuICAgIGxldCBuZXdfdHVwbGUgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHR1cGxlLmNvdW50KCk7IGkrKykge1xuICAgICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICAgIG5ld190dXBsZS5wdXNoKHRlcm0pO1xuICAgICAgICBpKys7XG4gICAgICAgIG5ld190dXBsZS5wdXNoKHR1cGxlLmdldChpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdfdHVwbGUucHVzaCh0dXBsZS5nZXQoaSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlLmFwcGx5KG51bGwsIG5ld190dXBsZSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbV9saXN0KGxpc3QpIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZS5hcHBseShudWxsLCBsaXN0KTtcbiAgfVxuXG4gIHN0YXRpYyB0b19saXN0KHR1cGxlKSB7XG4gICAgbGV0IG5ld19saXN0ID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR1cGxlLmNvdW50KCk7IGkrKykge1xuICAgICAgbmV3X2xpc3QucHVzaCh0dXBsZS5nZXQoaSkpO1xuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xuICB9XG59XG5cbi8qIEBmbG93ICovXG5cbmNsYXNzIFZhcmlhYmxlIHtcblxuICBjb25zdHJ1Y3RvcihuYW1lID0gbnVsbCkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cbn1cblxuY2xhc3MgV2lsZGNhcmQge1xuICBjb25zdHJ1Y3RvcigpIHt9XG59XG5cbmNsYXNzIFN0YXJ0c1dpdGgge1xuXG4gIGNvbnN0cnVjdG9yKHByZWZpeCkge1xuICAgIHRoaXMucHJlZml4ID0gcHJlZml4O1xuICB9XG59XG5cbmNsYXNzIENhcHR1cmUge1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG59XG5cbmNsYXNzIEhlYWRUYWlsIHtcbiAgY29uc3RydWN0b3IoKSB7fVxufVxuXG5jbGFzcyBUeXBlIHtcblxuICBjb25zdHJ1Y3Rvcih0eXBlLCBvYmpQYXR0ZXJuID0ge30pIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMub2JqUGF0dGVybiA9IG9ialBhdHRlcm47XG4gIH1cbn1cblxuY2xhc3MgQm91bmQge1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhcmlhYmxlKG5hbWUgPSBudWxsKSB7XG4gIHJldHVybiBuZXcgVmFyaWFibGUobmFtZSk7XG59XG5cbmZ1bmN0aW9uIHdpbGRjYXJkKCkge1xuICByZXR1cm4gbmV3IFdpbGRjYXJkKCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0c1dpdGgocHJlZml4KSB7XG4gIHJldHVybiBuZXcgU3RhcnRzV2l0aChwcmVmaXgpO1xufVxuXG5mdW5jdGlvbiBjYXB0dXJlKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2FwdHVyZSh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGhlYWRUYWlsKCkge1xuICByZXR1cm4gbmV3IEhlYWRUYWlsKCk7XG59XG5cbmZ1bmN0aW9uIHR5cGUodHlwZSwgb2JqUGF0dGVybiA9IHt9KSB7XG4gIHJldHVybiBuZXcgVHlwZSh0eXBlLCBvYmpQYXR0ZXJuKTtcbn1cblxuZnVuY3Rpb24gYm91bmQodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBCb3VuZCh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIF9pc19udW1iZXIodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzX3N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbn1cblxuZnVuY3Rpb24gX2lzX3R1cGxlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFR1cGxlO1xufVxuXG5mdW5jdGlvbiBfaXNfYm9vbGVhbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XG59XG5cbmZ1bmN0aW9uIGlzX3N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3ltYm9sJztcbn1cblxuZnVuY3Rpb24gaXNfbnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzX3VuZGVmaW5lZCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJztcbn1cblxuZnVuY3Rpb24gX2lzX2Z1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59XG5cbmZ1bmN0aW9uIGlzX3ZhcmlhYmxlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFZhcmlhYmxlO1xufVxuXG5mdW5jdGlvbiBpc193aWxkY2FyZCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBXaWxkY2FyZDtcbn1cblxuZnVuY3Rpb24gaXNfaGVhZFRhaWwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgSGVhZFRhaWw7XG59XG5cbmZ1bmN0aW9uIGlzX2NhcHR1cmUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQ2FwdHVyZTtcbn1cblxuZnVuY3Rpb24gaXNfdHlwZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBUeXBlO1xufVxuXG5mdW5jdGlvbiBpc19zdGFydHNXaXRoKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFN0YXJ0c1dpdGg7XG59XG5cbmZ1bmN0aW9uIGlzX2JvdW5kKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kO1xufVxuXG5mdW5jdGlvbiBpc19vYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59XG5cbmZ1bmN0aW9uIGlzX2FycmF5KHZhbHVlKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxudmFyIENoZWNrcyA9IHtcbiAgaXNfbnVtYmVyOiBfaXNfbnVtYmVyLFxuICBpc19zdHJpbmcsXG4gIGlzX2Jvb2xlYW46IF9pc19ib29sZWFuLFxuICBpc19zeW1ib2wsXG4gIGlzX251bGwsXG4gIGlzX3VuZGVmaW5lZCxcbiAgaXNfZnVuY3Rpb246IF9pc19mdW5jdGlvbixcbiAgaXNfdmFyaWFibGUsXG4gIGlzX3dpbGRjYXJkLFxuICBpc19oZWFkVGFpbCxcbiAgaXNfY2FwdHVyZSxcbiAgaXNfdHlwZSxcbiAgaXNfc3RhcnRzV2l0aCxcbiAgaXNfYm91bmQsXG4gIGlzX29iamVjdCxcbiAgaXNfYXJyYXksXG4gIGlzX3R1cGxlOiBfaXNfdHVwbGVcbn07XG5cbmZ1bmN0aW9uIHJlc29sdmVUdXBsZShwYXR0ZXJuKSB7XG4gIGxldCBtYXRjaGVzID0gW107XG5cbiAgZm9yIChsZXQgZWxlbSBvZiBwYXR0ZXJuKSB7XG4gICAgbWF0Y2hlcy5wdXNoKGJ1aWxkTWF0Y2goZWxlbSkpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX3R1cGxlKHZhbHVlKSB8fCB2YWx1ZS5jb3VudCgpICE9IHBhdHRlcm4uY291bnQoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZS52YWx1ZXMuZXZlcnkoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgIHJldHVybiBtYXRjaGVzW2ldKHZhbHVlLmdldChpKSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTeW1ib2wocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19zeW1ib2wodmFsdWUpICYmIHZhbHVlID09PSBwYXR0ZXJuO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3RyaW5nKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfc3RyaW5nKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU51bWJlcihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX251bWJlcih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVCb29sZWFuKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfYm9vbGVhbih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVGdW5jdGlvbihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX2Z1bmN0aW9uKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU51bGwocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19udWxsKHZhbHVlKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUJvdW5kKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IHR5cGVvZiBwYXR0ZXJuLnZhbHVlICYmIHZhbHVlID09PSBwYXR0ZXJuLnZhbHVlKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlV2lsZGNhcmQoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVWYXJpYWJsZSgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGFyZ3MucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVIZWFkVGFpbCgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX2FycmF5KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZCA9IHZhbHVlWzBdO1xuICAgIGNvbnN0IHRhaWwgPSB2YWx1ZS5zbGljZSgxKTtcblxuICAgIGFyZ3MucHVzaChoZWFkKTtcbiAgICBhcmdzLnB1c2godGFpbCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUNhcHR1cmUocGF0dGVybikge1xuICBjb25zdCBtYXRjaGVzID0gYnVpbGRNYXRjaChwYXR0ZXJuLnZhbHVlKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKG1hdGNoZXModmFsdWUsIGFyZ3MpKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3RhcnRzV2l0aChwYXR0ZXJuKSB7XG4gIGNvbnN0IHByZWZpeCA9IHBhdHRlcm4ucHJlZml4O1xuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAoQ2hlY2tzLmlzX3N0cmluZyh2YWx1ZSkgJiYgdmFsdWUuc3RhcnRzV2l0aChwcmVmaXgpKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUuc3Vic3RyaW5nKHByZWZpeC5sZW5ndGgpKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVR5cGUocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgcGF0dGVybi50eXBlKSB7XG4gICAgICBjb25zdCBtYXRjaGVzID0gYnVpbGRNYXRjaChwYXR0ZXJuLm9ialBhdHRlcm4pO1xuICAgICAgcmV0dXJuIG1hdGNoZXModmFsdWUsIGFyZ3MpICYmIGFyZ3MucHVzaCh2YWx1ZSkgPiAwO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUFycmF5KHBhdHRlcm4pIHtcbiAgY29uc3QgbWF0Y2hlcyA9IHBhdHRlcm4ubWFwKHggPT4gYnVpbGRNYXRjaCh4KSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX2FycmF5KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggIT0gcGF0dGVybi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWUuZXZlcnkoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgIHJldHVybiBtYXRjaGVzW2ldKHZhbHVlW2ldLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU9iamVjdChwYXR0ZXJuKSB7XG4gIGxldCBtYXRjaGVzID0ge307XG5cbiAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHBhdHRlcm4pKSB7XG4gICAgbWF0Y2hlc1trZXldID0gYnVpbGRNYXRjaChwYXR0ZXJuW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX29iamVjdCh2YWx1ZSkgfHwgcGF0dGVybi5sZW5ndGggPiB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocGF0dGVybikpIHtcbiAgICAgIGlmICghKGtleSBpbiB2YWx1ZSkgfHwgIW1hdGNoZXNba2V5XSh2YWx1ZVtrZXldLCBhcmdzKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVOb01hdGNoKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxudmFyIFJlc29sdmVycyA9IHtcbiAgcmVzb2x2ZUJvdW5kLFxuICByZXNvbHZlV2lsZGNhcmQsXG4gIHJlc29sdmVWYXJpYWJsZSxcbiAgcmVzb2x2ZUhlYWRUYWlsLFxuICByZXNvbHZlQ2FwdHVyZSxcbiAgcmVzb2x2ZVN0YXJ0c1dpdGgsXG4gIHJlc29sdmVUeXBlLFxuICByZXNvbHZlQXJyYXksXG4gIHJlc29sdmVPYmplY3QsXG4gIHJlc29sdmVOb01hdGNoLFxuICByZXNvbHZlU3ltYm9sLFxuICByZXNvbHZlU3RyaW5nLFxuICByZXNvbHZlTnVtYmVyLFxuICByZXNvbHZlQm9vbGVhbixcbiAgcmVzb2x2ZUZ1bmN0aW9uLFxuICByZXNvbHZlTnVsbCxcbiAgcmVzb2x2ZVR1cGxlXG59O1xuXG5mdW5jdGlvbiBidWlsZE1hdGNoKHBhdHRlcm4pIHtcblxuICBpZiAoQ2hlY2tzLmlzX3R1cGxlKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlVHVwbGUocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3ZhcmlhYmxlKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlVmFyaWFibGUocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3dpbGRjYXJkKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlV2lsZGNhcmQocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3VuZGVmaW5lZChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVdpbGRjYXJkKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19oZWFkVGFpbChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUhlYWRUYWlsKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19zdGFydHNXaXRoKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlU3RhcnRzV2l0aChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfY2FwdHVyZShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUNhcHR1cmUocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2JvdW5kKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlQm91bmQocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3R5cGUocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVUeXBlKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19hcnJheShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUFycmF5KHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19udW1iZXIocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVOdW1iZXIocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3N0cmluZyhwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVN0cmluZyhwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfYm9vbGVhbihwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUJvb2xlYW4ocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3N5bWJvbChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVN5bWJvbChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfbnVsbChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZU51bGwocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX29iamVjdChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZU9iamVjdChwYXR0ZXJuKTtcbiAgfVxuXG4gIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZU5vTWF0Y2goKTtcbn1cblxuY2xhc3MgTWF0Y2hFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoYXJnKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3ltYm9sJykge1xuICAgICAgdGhpcy5tZXNzYWdlID0gJ05vIG1hdGNoIGZvcjogJyArIGFyZy50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG4gICAgICBsZXQgbWFwcGVkVmFsdWVzID0gYXJnLm1hcCh4ID0+IHgudG9TdHJpbmcoKSk7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSAnTm8gbWF0Y2ggZm9yOiAnICsgbWFwcGVkVmFsdWVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSAnTm8gbWF0Y2ggZm9yOiAnICsgYXJnO1xuICAgIH1cblxuICAgIHRoaXMuc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICB0aGlzLm5hbWUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cblxuY2xhc3MgQ2FzZSB7XG5cbiAgY29uc3RydWN0b3IocGF0dGVybiwgZm4sIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICAgIHRoaXMucGF0dGVybiA9IGJ1aWxkTWF0Y2gocGF0dGVybik7XG4gICAgdGhpcy5mbiA9IGZuO1xuICAgIHRoaXMuZ3VhcmQgPSBndWFyZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlX2Nhc2UocGF0dGVybiwgZm4sIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICByZXR1cm4gbmV3IENhc2UocGF0dGVybiwgZm4sIGd1YXJkKTtcbn1cblxuZnVuY3Rpb24gZGVmbWF0Y2goLi4uY2FzZXMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgZm9yIChsZXQgcHJvY2Vzc2VkQ2FzZSBvZiBjYXNlcykge1xuICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgaWYgKHByb2Nlc3NlZENhc2UucGF0dGVybihhcmdzLCByZXN1bHQpICYmIHByb2Nlc3NlZENhc2UuZ3VhcmQuYXBwbHkodGhpcywgcmVzdWx0KSkge1xuICAgICAgICByZXR1cm4gcHJvY2Vzc2VkQ2FzZS5mbi5hcHBseSh0aGlzLCByZXN1bHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBNYXRjaEVycm9yKGFyZ3MpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBtYXRjaChwYXR0ZXJuLCBleHByLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgbGV0IHJlc3VsdCA9IFtdO1xuICBsZXQgcHJvY2Vzc2VkUGF0dGVybiA9IGJ1aWxkTWF0Y2gocGF0dGVybik7XG4gIGlmIChwcm9jZXNzZWRQYXR0ZXJuKGV4cHIsIHJlc3VsdCkgJiYgZ3VhcmQuYXBwbHkodGhpcywgcmVzdWx0KSkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IE1hdGNoRXJyb3IoZXhwcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZXhwciwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG1hdGNoKHBhdHRlcm4sIGV4cHIsIGd1YXJkKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgTWF0Y2hFcnJvcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXR0ZXJuTWFwKGNvbGxlY3Rpb24sIHBhdHRlcm4sIGZ1biwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIGxldCByZXQgPSBbXTtcblxuICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3VsdCA9IGZ1bi5hcHBseSh0aGlzLCBtYXRjaChwYXR0ZXJuLCBlbGVtLCBndWFyZCkpO1xuICAgICAgcmV0ID0gcmV0LmNvbmNhdChyZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBNYXRjaEVycm9yKSkge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXQ7XG59XG5cbnZhciBfUGF0dGVybnMgPSB7XG4gIGRlZm1hdGNoLCBtYXRjaCwgTWF0Y2hFcnJvciwgbWF0Y2hfbm9fdGhyb3csIHBhdHRlcm5NYXAsXG4gIHZhcmlhYmxlLCB3aWxkY2FyZCwgc3RhcnRzV2l0aCxcbiAgY2FwdHVyZSwgaGVhZFRhaWwsIHR5cGUsIGJvdW5kLCBDYXNlLCBtYWtlX2Nhc2Vcbn07XG5cbmNsYXNzIEJpdFN0cmluZyB7XG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICB0aGlzLnJhd192YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKGFyZ3MpO1xuICAgIH07XG5cbiAgICB0aGlzLnZhbHVlID0gT2JqZWN0LmZyZWV6ZSh0aGlzLnByb2Nlc3MoYXJncykpO1xuICB9XG5cbiAgZ2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVbaW5kZXhdO1xuICB9XG5cbiAgY291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUubGVuZ3RoO1xuICB9XG5cbiAgW1N5bWJvbC5pdGVyYXRvcl0oKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgdmFyIGksXG4gICAgICAgIHMgPSBcIlwiO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmNvdW50KCk7IGkrKykge1xuICAgICAgaWYgKHMgIT09IFwiXCIpIHtcbiAgICAgICAgcyArPSBcIiwgXCI7XG4gICAgICB9XG4gICAgICBzICs9IHRoaXNbaV0udG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gXCI8PFwiICsgcyArIFwiPj5cIjtcbiAgfVxuXG4gIHByb2Nlc3MoKSB7XG4gICAgbGV0IHByb2Nlc3NlZF92YWx1ZXMgPSBbXTtcblxuICAgIHZhciBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnJhd192YWx1ZSgpLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgcHJvY2Vzc2VkX3ZhbHVlID0gdGhpc1tcInByb2Nlc3NfXCIgKyB0aGlzLnJhd192YWx1ZSgpW2ldLnR5cGVdKHRoaXMucmF3X3ZhbHVlKClbaV0pO1xuXG4gICAgICBmb3IgKGxldCBhdHRyIG9mIHRoaXMucmF3X3ZhbHVlKClbaV0uYXR0cmlidXRlcykge1xuICAgICAgICBwcm9jZXNzZWRfdmFsdWUgPSB0aGlzW1wicHJvY2Vzc19cIiArIGF0dHJdKHByb2Nlc3NlZF92YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHByb2Nlc3NlZF92YWx1ZXMgPSBwcm9jZXNzZWRfdmFsdWVzLmNvbmNhdChwcm9jZXNzZWRfdmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzZWRfdmFsdWVzO1xuICB9XG5cbiAgcHJvY2Vzc19pbnRlZ2VyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc19mbG9hdCh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZS5zaXplID09PSA2NCkge1xuICAgICAgcmV0dXJuIEJpdFN0cmluZy5mbG9hdDY0VG9CeXRlcyh2YWx1ZS52YWx1ZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZS5zaXplID09PSAzMikge1xuICAgICAgcmV0dXJuIEJpdFN0cmluZy5mbG9hdDMyVG9CeXRlcyh2YWx1ZS52YWx1ZSk7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzaXplIGZvciBmbG9hdFwiKTtcbiAgfVxuXG4gIHByb2Nlc3NfYml0c3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnZhbHVlLnZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc19iaW5hcnkodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLnRvVVRGOEFycmF5KHZhbHVlLnZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3NfdXRmOCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcudG9VVEY4QXJyYXkodmFsdWUudmFsdWUpO1xuICB9XG5cbiAgcHJvY2Vzc191dGYxNih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcudG9VVEYxNkFycmF5KHZhbHVlLnZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3NfdXRmMzIodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLnRvVVRGMzJBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3NpZ25lZCh2YWx1ZSkge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShbdmFsdWVdKVswXTtcbiAgfVxuXG4gIHByb2Nlc3NfdW5zaWduZWQodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX25hdGl2ZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfYmlnKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc19saXR0bGUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUucmV2ZXJzZSgpO1xuICB9XG5cbiAgcHJvY2Vzc19zaXplKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc191bml0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgc3RhdGljIGludGVnZXIodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwiaW50ZWdlclwiLCBcInVuaXRcIjogMSwgXCJzaXplXCI6IDggfSk7XG4gIH1cblxuICBzdGF0aWMgZmxvYXQodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwiZmxvYXRcIiwgXCJ1bml0XCI6IDEsIFwic2l6ZVwiOiA2NCB9KTtcbiAgfVxuXG4gIHN0YXRpYyBiaXRzdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwiYml0c3RyaW5nXCIsIFwidW5pdFwiOiAxLCBcInNpemVcIjogdmFsdWUubGVuZ3RoIH0pO1xuICB9XG5cbiAgc3RhdGljIGJpdHModmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLmJpdHN0cmluZyh2YWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgYmluYXJ5KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImJpbmFyeVwiLCBcInVuaXRcIjogOCwgXCJzaXplXCI6IHZhbHVlLmxlbmd0aCB9KTtcbiAgfVxuXG4gIHN0YXRpYyBieXRlcyh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcuYmluYXJ5KHZhbHVlKTtcbiAgfVxuXG4gIHN0YXRpYyB1dGY4KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcInV0ZjhcIiB9KTtcbiAgfVxuXG4gIHN0YXRpYyB1dGYxNih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJ1dGYxNlwiIH0pO1xuICB9XG5cbiAgc3RhdGljIHV0ZjMyKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcInV0ZjMyXCIgfSk7XG4gIH1cblxuICBzdGF0aWMgc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJzaWduZWRcIik7XG4gIH1cblxuICBzdGF0aWMgdW5zaWduZWQodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcInVuc2lnbmVkXCIpO1xuICB9XG5cbiAgc3RhdGljIG5hdGl2ZSh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwge30sIFwibmF0aXZlXCIpO1xuICB9XG5cbiAgc3RhdGljIGJpZyh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwge30sIFwiYmlnXCIpO1xuICB9XG5cbiAgc3RhdGljIGxpdHRsZSh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwge30sIFwibGl0dGxlXCIpO1xuICB9XG5cbiAgc3RhdGljIHNpemUodmFsdWUsIGNvdW50KSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwic2l6ZVwiOiBjb3VudCB9KTtcbiAgfVxuXG4gIHN0YXRpYyB1bml0KHZhbHVlLCBjb3VudCkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInVuaXRcIjogY291bnQgfSk7XG4gIH1cblxuICBzdGF0aWMgd3JhcCh2YWx1ZSwgb3B0LCBuZXdfYXR0cmlidXRlID0gbnVsbCkge1xuICAgIGxldCB0aGVfdmFsdWUgPSB2YWx1ZTtcblxuICAgIGlmICghKHZhbHVlIGluc3RhbmNlb2YgT2JqZWN0KSkge1xuICAgICAgdGhlX3ZhbHVlID0geyBcInZhbHVlXCI6IHZhbHVlLCBcImF0dHJpYnV0ZXNcIjogW10gfTtcbiAgICB9XG5cbiAgICB0aGVfdmFsdWUgPSBPYmplY3QuYXNzaWduKHRoZV92YWx1ZSwgb3B0KTtcblxuICAgIGlmIChuZXdfYXR0cmlidXRlKSB7XG4gICAgICB0aGVfdmFsdWUuYXR0cmlidXRlcy5wdXNoKG5ld19hdHRyaWJ1dGUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGVfdmFsdWU7XG4gIH1cblxuICBzdGF0aWMgdG9VVEY4QXJyYXkoc3RyKSB7XG4gICAgdmFyIHV0ZjggPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoYXJjb2RlID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY2hhcmNvZGUgPCAxMjgpIHtcbiAgICAgICAgdXRmOC5wdXNoKGNoYXJjb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hhcmNvZGUgPCAyMDQ4KSB7XG4gICAgICAgIHV0ZjgucHVzaCgxOTIgfCBjaGFyY29kZSA+PiA2LCAxMjggfCBjaGFyY29kZSAmIDYzKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hhcmNvZGUgPCA1NTI5NiB8fCBjaGFyY29kZSA+PSA1NzM0NCkge1xuICAgICAgICB1dGY4LnB1c2goMjI0IHwgY2hhcmNvZGUgPj4gMTIsIDEyOCB8IGNoYXJjb2RlID4+IDYgJiA2MywgMTI4IHwgY2hhcmNvZGUgJiA2Myk7XG4gICAgICB9XG4gICAgICAvLyBzdXJyb2dhdGUgcGFpclxuICAgICAgZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgLy8gVVRGLTE2IGVuY29kZXMgMHgxMDAwMC0weDEwRkZGRiBieVxuICAgICAgICAvLyBzdWJ0cmFjdGluZyAweDEwMDAwIGFuZCBzcGxpdHRpbmcgdGhlXG4gICAgICAgIC8vIDIwIGJpdHMgb2YgMHgwLTB4RkZGRkYgaW50byB0d28gaGFsdmVzXG4gICAgICAgIGNoYXJjb2RlID0gNjU1MzYgKyAoKGNoYXJjb2RlICYgMTAyMykgPDwgMTAgfCBzdHIuY2hhckNvZGVBdChpKSAmIDEwMjMpO1xuICAgICAgICB1dGY4LnB1c2goMjQwIHwgY2hhcmNvZGUgPj4gMTgsIDEyOCB8IGNoYXJjb2RlID4+IDEyICYgNjMsIDEyOCB8IGNoYXJjb2RlID4+IDYgJiA2MywgMTI4IHwgY2hhcmNvZGUgJiA2Myk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1dGY4O1xuICB9XG5cbiAgc3RhdGljIHRvVVRGMTZBcnJheShzdHIpIHtcbiAgICB2YXIgdXRmMTYgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNvZGVQb2ludCA9IHN0ci5jb2RlUG9pbnRBdChpKTtcblxuICAgICAgaWYgKGNvZGVQb2ludCA8PSAyNTUpIHtcbiAgICAgICAgdXRmMTYucHVzaCgwKTtcbiAgICAgICAgdXRmMTYucHVzaChjb2RlUG9pbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXRmMTYucHVzaChjb2RlUG9pbnQgPj4gOCAmIDI1NSk7XG4gICAgICAgIHV0ZjE2LnB1c2goY29kZVBvaW50ICYgMjU1KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHV0ZjE2O1xuICB9XG5cbiAgc3RhdGljIHRvVVRGMzJBcnJheShzdHIpIHtcbiAgICB2YXIgdXRmMzIgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNvZGVQb2ludCA9IHN0ci5jb2RlUG9pbnRBdChpKTtcblxuICAgICAgaWYgKGNvZGVQb2ludCA8PSAyNTUpIHtcbiAgICAgICAgdXRmMzIucHVzaCgwKTtcbiAgICAgICAgdXRmMzIucHVzaCgwKTtcbiAgICAgICAgdXRmMzIucHVzaCgwKTtcbiAgICAgICAgdXRmMzIucHVzaChjb2RlUG9pbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXRmMzIucHVzaCgwKTtcbiAgICAgICAgdXRmMzIucHVzaCgwKTtcbiAgICAgICAgdXRmMzIucHVzaChjb2RlUG9pbnQgPj4gOCAmIDI1NSk7XG4gICAgICAgIHV0ZjMyLnB1c2goY29kZVBvaW50ICYgMjU1KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHV0ZjMyO1xuICB9XG5cbiAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwMDM0OTMvamF2YXNjcmlwdC1mbG9hdC1mcm9tLXRvLWJpdHNcbiAgc3RhdGljIGZsb2F0MzJUb0J5dGVzKGYpIHtcbiAgICB2YXIgYnl0ZXMgPSBbXTtcblxuICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoNCk7XG4gICAgbmV3IEZsb2F0MzJBcnJheShidWYpWzBdID0gZjtcblxuICAgIGxldCBpbnRWZXJzaW9uID0gbmV3IFVpbnQzMkFycmF5KGJ1ZilbMF07XG5cbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gPj4gMjQgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbiA+PiAxNiAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uID4+IDggJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbiAmIDI1NSk7XG5cbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBzdGF0aWMgZmxvYXQ2NFRvQnl0ZXMoZikge1xuICAgIHZhciBieXRlcyA9IFtdO1xuXG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcig4KTtcbiAgICBuZXcgRmxvYXQ2NEFycmF5KGJ1ZilbMF0gPSBmO1xuXG4gICAgdmFyIGludFZlcnNpb24xID0gbmV3IFVpbnQzMkFycmF5KGJ1ZilbMF07XG4gICAgdmFyIGludFZlcnNpb24yID0gbmV3IFVpbnQzMkFycmF5KGJ1ZilbMV07XG5cbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24yID4+IDI0ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24yID4+IDE2ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24yID4+IDggJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjIgJiAyNTUpO1xuXG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMSA+PiAyNCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMSA+PiAxNiAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMSA+PiA4ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24xICYgMjU1KTtcblxuICAgIHJldHVybiBieXRlcztcbiAgfVxufVxuXG5sZXQgU3BlY2lhbEZvcm1zID0ge1xuXG4gIF9fRElSX186IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoX19kaXJuYW1lKSB7XG4gICAgICByZXR1cm4gX19kaXJuYW1lO1xuICAgIH1cblxuICAgIGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0KSB7XG4gICAgICByZXR1cm4gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgYXRvbTogZnVuY3Rpb24gKF92YWx1ZSkge1xuICAgIHJldHVybiBTeW1ib2wuZm9yKF92YWx1ZSk7XG4gIH0sXG5cbiAgbGlzdDogZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShhcmdzKTtcbiAgfSxcblxuICBiaXRzdHJpbmc6IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBCaXRTdHJpbmcoLi4uYXJncyk7XG4gIH0sXG5cbiAgYm91bmQ6IGZ1bmN0aW9uIChfdmFyKSB7XG4gICAgcmV0dXJuIFBhdHRlcm5zLmJvdW5kKF92YXIpO1xuICB9LFxuXG4gIF9jYXNlOiBmdW5jdGlvbiAoY29uZGl0aW9uLCBjbGF1c2VzKSB7XG4gICAgcmV0dXJuIFBhdHRlcm5zLmRlZm1hdGNoKC4uLmNsYXVzZXMpKGNvbmRpdGlvbik7XG4gIH0sXG5cbiAgY29uZDogZnVuY3Rpb24gKGNsYXVzZXMpIHtcbiAgICBmb3IgKGxldCBjbGF1c2Ugb2YgY2xhdXNlcykge1xuICAgICAgaWYgKGNsYXVzZVswXSkge1xuICAgICAgICByZXR1cm4gY2xhdXNlWzFdKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gIH0sXG5cbiAgZm46IGZ1bmN0aW9uIChjbGF1c2VzKSB7XG4gICAgcmV0dXJuIFBhdHRlcm5zLmRlZm1hdGNoKGNsYXVzZXMpO1xuICB9LFxuXG4gIG1hcDogZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBPYmplY3QuZnJlZXplKG9iaik7XG4gIH0sXG5cbiAgbWFwX3VwZGF0ZTogZnVuY3Rpb24gKG1hcCwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcmVlemUoT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG1hcC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpLCBtYXAsIHZhbHVlcykpO1xuICB9LFxuXG4gIF9mb3I6IGZ1bmN0aW9uIChjb2xsZWN0aW9ucywgZnVuLCBmaWx0ZXIgPSAoKSA9PiB0cnVlLCBpbnRvID0gW10sIHByZXZpb3VzVmFsdWVzID0gW10pIHtcbiAgICBsZXQgcGF0dGVybiA9IGNvbGxlY3Rpb25zWzBdWzBdO1xuICAgIGxldCBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnNbMF1bMV07XG5cbiAgICBpZiAoY29sbGVjdGlvbnMubGVuZ3RoID09PSAxKSB7XG5cbiAgICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgICBsZXQgciA9IFBhdHRlcm5zLm1hdGNoX25vX3Rocm93KHBhdHRlcm4sIGVsZW0pO1xuICAgICAgICBsZXQgYXJncyA9IHByZXZpb3VzVmFsdWVzLmNvbmNhdChyKTtcblxuICAgICAgICBpZiAociAmJiBmaWx0ZXIuYXBwbHkodGhpcywgYXJncykpIHtcbiAgICAgICAgICBpbnRvID0gRW51bS5pbnRvKFtmdW4uYXBwbHkodGhpcywgYXJncyldLCBpbnRvKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaW50bztcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IF9pbnRvID0gW107XG5cbiAgICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgICBsZXQgciA9IFBhdHRlcm5zLm1hdGNoX25vX3Rocm93KHBhdHRlcm4sIGVsZW0pO1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgIF9pbnRvID0gRW51bS5pbnRvKHRoaXMuX2Zvcihjb2xsZWN0aW9ucy5zbGljZSgxKSwgZnVuLCBmaWx0ZXIsIF9pbnRvLCBwcmV2aW91c1ZhbHVlcy5jb25jYXQocikpLCBpbnRvKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gX2ludG87XG4gICAgfVxuICB9LFxuXG4gIHJlY2VpdmU6IGZ1bmN0aW9uIChyZWNlaXZlX2Z1biwgdGltZW91dF9pbl9tcyA9IG51bGwsIHRpbWVvdXRfZm4gPSB0aW1lID0+IHRydWUpIHtcbiAgICBpZiAodGltZW91dF9pbl9tcyA9PSBudWxsIHx8IHRpbWVvdXRfaW5fbXMgPT09IFN5c3RlbS5mb3IoJ2luZmluaXR5JykpIHtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGlmIChzZWxmLm1haWxib3gubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgbGV0IG1lc3NhZ2UgPSBzZWxmLm1haWxib3hbMF07XG4gICAgICAgICAgc2VsZi5tYWlsYm94ID0gc2VsZi5tYWlsYm94LnNsaWNlKDEpO1xuICAgICAgICAgIHJldHVybiByZWNlaXZlX2Z1bihtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGltZW91dF9pbl9tcyA9PT0gMCkge1xuICAgICAgaWYgKHNlbGYubWFpbGJveC5sZW5ndGggIT09IDApIHtcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSBzZWxmLm1haWxib3hbMF07XG4gICAgICAgIHNlbGYubWFpbGJveCA9IHNlbGYubWFpbGJveC5zbGljZSgxKTtcbiAgICAgICAgcmV0dXJuIHJlY2VpdmVfZnVuKG1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgd2hpbGUgKERhdGUubm93KCkgPCBub3cgKyB0aW1lb3V0X2luX21zKSB7XG4gICAgICAgIGlmIChzZWxmLm1haWxib3gubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgbGV0IG1lc3NhZ2UgPSBzZWxmLm1haWxib3hbMF07XG4gICAgICAgICAgc2VsZi5tYWlsYm94ID0gc2VsZi5tYWlsYm94LnNsaWNlKDEpO1xuICAgICAgICAgIHJldHVybiByZWNlaXZlX2Z1bihtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGltZW91dF9mbih0aW1lb3V0X2luX21zKTtcbiAgICB9XG4gIH0sXG5cbiAgdHVwbGU6IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBUdXBsZSguLi5hcmdzKTtcbiAgfSxcblxuICBfdHJ5OiBmdW5jdGlvbiAoZG9fZnVuLCByZXNjdWVfZnVuY3Rpb24sIGNhdGNoX2Z1biwgZWxzZV9mdW5jdGlvbiwgYWZ0ZXJfZnVuY3Rpb24pIHtcbiAgICBsZXQgcmVzdWx0ID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBkb19mdW4oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsZXQgZXhfcmVzdWx0ID0gbnVsbDtcblxuICAgICAgaWYgKHJlc2N1ZV9mdW5jdGlvbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV4X3Jlc3VsdCA9IHJlc2N1ZV9mdW5jdGlvbihlKTtcbiAgICAgICAgICByZXR1cm4gZXhfcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGlmIChleCBpbnN0YW5jZW9mIFBhdHRlcm5zLk1hdGNoRXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2F0Y2hfZnVuKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXhfcmVzdWx0ID0gY2F0Y2hfZnVuKGUpO1xuICAgICAgICAgIHJldHVybiBleF9yZXN1bHQ7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgaWYgKGV4IGluc3RhbmNlb2YgUGF0dGVybnMuTWF0Y2hFcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRocm93IGU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChhZnRlcl9mdW5jdGlvbikge1xuICAgICAgICBhZnRlcl9mdW5jdGlvbigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbHNlX2Z1bmN0aW9uKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gZWxzZV9mdW5jdGlvbihyZXN1bHQpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgaWYgKGV4IGluc3RhbmNlb2YgUGF0dGVybnMuTWF0Y2hFcnJvcikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gTWF0Y2ggRm91bmQgaW4gRWxzZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgZXg7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbn07XG5cbi8qIEBmbG93ICovXG5cbmxldCBwcm9jZXNzX2NvdW50ZXIgPSAtMTtcblxuY2xhc3MgUElEIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgcHJvY2Vzc19jb3VudGVyID0gcHJvY2Vzc19jb3VudGVyICsgMTtcbiAgICB0aGlzLmlkID0gcHJvY2Vzc19jb3VudGVyO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIFwiUElEIzwwLlwiICsgdGhpcy5pZCArIFwiLjA+XCI7XG4gIH1cbn1cblxuY2xhc3MgSW50ZWdlclR5cGUge31cbmNsYXNzIEZsb2F0VHlwZSB7fVxuXG4vL2h0dHBzOi8vZ2l0aHViLmNvbS9haXJwb3J0eWgvcHJvdG9tb3JwaGlzbVxuY2xhc3MgUHJvdG9jb2wge1xuICBjb25zdHJ1Y3RvcihzcGVjKSB7XG4gICAgdGhpcy5yZWdpc3RyeSA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmZhbGxiYWNrID0gbnVsbDtcblxuICAgIGZvciAobGV0IGZ1bk5hbWUgaW4gc3BlYykge1xuICAgICAgdGhpc1tmdW5OYW1lXSA9IGNyZWF0ZUZ1bihmdW5OYW1lKS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUZ1bihmdW5OYW1lKSB7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBsZXQgdGhpbmcgPSBhcmdzWzBdO1xuICAgICAgICBsZXQgZnVuID0gbnVsbDtcblxuICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcih0aGluZykgJiYgdGhpcy5oYXNJbXBsZW1lbnRhdGlvbihJbnRlZ2VyVHlwZSkpIHtcbiAgICAgICAgICBmdW4gPSB0aGlzLnJlZ2lzdHJ5LmdldChJbnRlZ2VyVHlwZSlbZnVuTmFtZV07XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaW5nID09PSBcIm51bWJlclwiICYmICFOdW1iZXIuaXNJbnRlZ2VyKHRoaW5nKSAmJiB0aGlzLmhhc0ltcGxlbWVudGF0aW9uKEZsb2F0VHlwZSkpIHtcbiAgICAgICAgICBmdW4gPSB0aGlzLnJlZ2lzdHJ5LmdldChGbG9hdFR5cGUpW2Z1bk5hbWVdO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaGFzSW1wbGVtZW50YXRpb24odGhpbmcpKSB7XG4gICAgICAgICAgZnVuID0gdGhpcy5yZWdpc3RyeS5nZXQodGhpbmcuY29uc3RydWN0b3IpW2Z1bk5hbWVdO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZmFsbGJhY2spIHtcbiAgICAgICAgICBmdW4gPSB0aGlzLmZhbGxiYWNrW2Z1bk5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZ1biAhPSBudWxsKSB7XG4gICAgICAgICAgbGV0IHJldHZhbCA9IGZ1bi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gaW1wbGVtZW50YXRpb24gZm91bmQgZm9yIFwiICsgdGhpbmcpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBpbXBsZW1lbnRhdGlvbih0eXBlLCBpbXBsZW1lbnRhdGlvbikge1xuICAgIGlmICh0eXBlID09PSBudWxsKSB7XG4gICAgICB0aGlzLmZhbGxiYWNrID0gaW1wbGVtZW50YXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVnaXN0cnkuc2V0KHR5cGUsIGltcGxlbWVudGF0aW9uKTtcbiAgICB9XG4gIH1cblxuICBoYXNJbXBsZW1lbnRhdGlvbih0aGluZykge1xuICAgIHJldHVybiB0aGlzLnJlZ2lzdHJ5Lmhhcyh0aGluZy5jb25zdHJ1Y3Rvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGwobGlzdCkge1xuICByZXR1cm4gU3BlY2lhbEZvcm1zLmxpc3QoLi4ubGlzdC5zbGljZSgxKSk7XG59XG5cbmZ1bmN0aW9uIGhkKGxpc3QpIHtcbiAgcmV0dXJuIGxpc3RbMF07XG59XG5cbmZ1bmN0aW9uIGlzX25pbCh4KSB7XG4gIHJldHVybiB4ID09PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc19hdG9tKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnc3ltYm9sJztcbn1cblxuZnVuY3Rpb24gaXNfYmluYXJ5KHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnc3RyaW5nJyB8fCB4IGluc3RhbmNlb2YgU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBpc19ib29sZWFuKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnYm9vbGVhbicgfHwgeCBpbnN0YW5jZW9mIEJvb2xlYW47XG59XG5cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHgsIGFyaXR5ID0gLTEpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8IHggaW5zdGFuY2VvZiBGdW5jdGlvbjtcbn1cblxuZnVuY3Rpb24gaXNfZmxvYXQoeCkge1xuICByZXR1cm4gaXNfbnVtYmVyKHgpICYmICFOdW1iZXIuaXNJbnRlZ2VyKHgpO1xufVxuXG5mdW5jdGlvbiBpc19pbnRlZ2VyKHgpIHtcbiAgcmV0dXJuIE51bWJlci5pc0ludGVnZXIoeCk7XG59XG5cbmZ1bmN0aW9uIGlzX2xpc3QoeCkge1xuICByZXR1cm4geCBpbnN0YW5jZW9mIEFycmF5O1xufVxuXG5mdW5jdGlvbiBpc19tYXAoeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnIHx8IHggaW5zdGFuY2VvZiBPYmplY3Q7XG59XG5cbmZ1bmN0aW9uIGlzX251bWJlcih4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzX3R1cGxlKHgpIHtcbiAgcmV0dXJuIHggaW5zdGFuY2VvZiBUdXBsZTtcbn1cblxuZnVuY3Rpb24gX2xlbmd0aCh4KSB7XG4gIHJldHVybiB4Lmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gaXNfcGlkKHgpIHtcbiAgcmV0dXJuIHggaW5zdGFuY2VvZiBQSUQ7XG59XG5cbmZ1bmN0aW9uIGlzX3BvcnQoeCkge1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzX3JlZmVyZW5jZSh4KSB7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNfYml0c3RyaW5nKHgpIHtcbiAgcmV0dXJuIGlzX2JpbmFyeSh4KSB8fCB4IGluc3RhbmNlb2YgQml0U3RyaW5nO1xufVxuXG5mdW5jdGlvbiBfX2luX18obGVmdCwgcmlnaHQpIHtcbiAgZm9yIChsZXQgeCBvZiByaWdodCkge1xuICAgIGlmIChtYXRjaF9fcW1hcmtfXyhsZWZ0LCB4KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBhYnMobnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLmFicyhudW1iZXIpO1xufVxuXG5mdW5jdGlvbiByb3VuZChudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyKTtcbn1cblxuZnVuY3Rpb24gZWxlbSh0dXBsZSwgaW5kZXgpIHtcbiAgaWYgKGlzX2xpc3QodHVwbGUpKSB7XG4gICAgcmV0dXJuIHR1cGxlW2luZGV4XTtcbiAgfVxuXG4gIHJldHVybiB0dXBsZS5nZXQoaW5kZXgpO1xufVxuXG5mdW5jdGlvbiByZW0obGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgJSByaWdodDtcbn1cblxuZnVuY3Rpb24gZGl2KGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0IC8gcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGFuZChsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCAmJiByaWdodDtcbn1cblxuZnVuY3Rpb24gb3IobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgfHwgcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIG5vdChhcmcpIHtcbiAgcmV0dXJuICFhcmc7XG59XG5cbmZ1bmN0aW9uIGFwcGx5KC4uLmFyZ3MpIHtcbiAgaWYgKGFyZ3MubGVuZ3RoID09PSAzKSB7XG4gICAgbGV0IG1vZCA9IGFyZ3NbMF07XG4gICAgbGV0IGZ1bmMgPSBhcmdzWzFdO1xuICAgIGxldCBmdW5jX2FyZ3MgPSBhcmdzWzJdO1xuICAgIHJldHVybiBtb2RbZnVuY10uYXBwbHkobnVsbCwgZnVuY19hcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgZnVuYyA9IGFyZ3NbMF07XG4gICAgbGV0IGZ1bmNfYXJncyA9IGFyZ3NbMV07XG5cbiAgICByZXR1cm4gZnVuYy5hcHBseShudWxsLCBmdW5jX2FyZ3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvX3N0cmluZyhhcmcpIHtcbiAgaWYgKGlzX3R1cGxlKGFyZykpIHtcbiAgICByZXR1cm4gVHVwbGUudG9fc3RyaW5nKGFyZyk7XG4gIH1cblxuICByZXR1cm4gYXJnLnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoX19xbWFya19fKHBhdHRlcm4sIGV4cHIsIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICByZXR1cm4gX1BhdHRlcm5zLm1hdGNoX25vX3Rocm93KHBhdHRlcm4sIGV4cHIsIGd1YXJkKSAhPSBudWxsO1xufVxuXG5mdW5jdGlvbiBkZWZzdHJ1Y3QoZGVmYXVsdHMpIHtcbiAgcmV0dXJuIGNsYXNzIHtcbiAgICBjb25zdHJ1Y3Rvcih1cGRhdGUgPSB7fSkge1xuICAgICAgbGV0IHRoZV92YWx1ZXMgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRzLCB1cGRhdGUpO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCB0aGVfdmFsdWVzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlKHVwZGF0ZXMgPSB7fSkge1xuICAgICAgbGV0IHggPSBuZXcgdGhpcyh1cGRhdGVzKTtcbiAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHgpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVmZXhjZXB0aW9uKGRlZmF1bHRzKSB7XG4gIHJldHVybiBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcih1cGRhdGUgPSB7fSkge1xuICAgICAgbGV0IG1lc3NhZ2UgPSB1cGRhdGUubWVzc2FnZSB8fCAnJztcbiAgICAgIHN1cGVyKG1lc3NhZ2UpO1xuXG4gICAgICBsZXQgdGhlX3ZhbHVlcyA9IE9iamVjdC5hc3NpZ24oZGVmYXVsdHMsIHVwZGF0ZSk7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHRoZV92YWx1ZXMpO1xuXG4gICAgICB0aGlzLm5hbWUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgdGhpc1tTcGVjaWFsRm9ybXMuYXRvbSgnX19leGNlcHRpb25fXycpXSA9IHRydWU7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yLm5hbWUpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGUodXBkYXRlcyA9IHt9KSB7XG4gICAgICBsZXQgeCA9IG5ldyB0aGlzKHVwZGF0ZXMpO1xuICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWZwcm90b2NvbChzcGVjKSB7XG4gIHJldHVybiBuZXcgUHJvdG9jb2woc3BlYyk7XG59XG5cbmZ1bmN0aW9uIGRlZmltcGwocHJvdG9jb2wsIHR5cGUsIGltcGwpIHtcbiAgcHJvdG9jb2wuaW1wbGVtZW50YXRpb24odHlwZSwgaW1wbCk7XG59XG5cbnZhciBLZXJuZWwgPSB7XG4gIFNwZWNpYWxGb3JtcyxcbiAgdGwsXG4gIGhkLFxuICBpc19uaWwsXG4gIGlzX2F0b20sXG4gIGlzX2JpbmFyeSxcbiAgaXNfYm9vbGVhbixcbiAgaXNfZnVuY3Rpb24sXG4gIGlzX2Zsb2F0LFxuICBpc19pbnRlZ2VyLFxuICBpc19saXN0LFxuICBpc19tYXAsXG4gIGlzX251bWJlcixcbiAgaXNfdHVwbGUsXG4gIGxlbmd0aDogX2xlbmd0aCxcbiAgaXNfcGlkLFxuICBpc19wb3J0LFxuICBpc19yZWZlcmVuY2UsXG4gIGlzX2JpdHN0cmluZyxcbiAgaW46IF9faW5fXyxcbiAgYWJzLFxuICByb3VuZCxcbiAgZWxlbSxcbiAgcmVtLFxuICBkaXYsXG4gIGFuZCxcbiAgb3IsXG4gIG5vdCxcbiAgYXBwbHksXG4gIHRvX3N0cmluZyxcbiAgbWF0Y2hfX3FtYXJrX18sXG4gIGRlZnN0cnVjdCxcbiAgZGVmcHJvdG9jb2wsXG4gIGRlZmltcGxcbn07XG5cbmxldCBFbnVtID0ge1xuXG4gIGFsbF9fcW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1biA9IHggPT4geCkge1xuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKCFmdW4oZWxlbSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9LFxuXG4gIGFueV9fcW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1biA9IHggPT4geCkge1xuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgYXQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBuLCB0aGVfZGVmYXVsdCA9IG51bGwpIHtcbiAgICBpZiAobiA+IHRoaXMuY291bnQoY29sbGVjdGlvbikgfHwgbiA8IDApIHtcbiAgICAgIHJldHVybiB0aGVfZGVmYXVsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gY29sbGVjdGlvbltuXTtcbiAgfSxcblxuICBjb25jYXQ6IGZ1bmN0aW9uICguLi5lbnVtYWJsZXMpIHtcbiAgICByZXR1cm4gZW51bWFibGVzWzBdLmNvbmNhdChlbnVtYWJsZXNbMV0pO1xuICB9LFxuXG4gIGNvdW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuID0gbnVsbCkge1xuICAgIGlmIChmdW4gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb24ubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbi5maWx0ZXIoZnVuKS5sZW5ndGg7XG4gICAgfVxuICB9LFxuXG4gIGRyb3A6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb3VudCkge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLnNsaWNlKGNvdW50KTtcbiAgfSxcblxuICBkcm9wX3doaWxlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgbGV0IGNvdW50ID0gMDtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICBjb3VudCA9IGNvdW50ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uLnNsaWNlKGNvdW50KTtcbiAgfSxcblxuICBlYWNoOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBmdW4oZWxlbSk7XG4gICAgfVxuICB9LFxuXG4gIGVtcHR5X19xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLmxlbmd0aCA9PT0gMDtcbiAgfSxcblxuICBmZXRjaDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4pIHtcbiAgICBpZiAoS2VybmVsLmlzX2xpc3QoY29sbGVjdGlvbikpIHtcbiAgICAgIGlmIChuIDwgdGhpcy5jb3VudChjb2xsZWN0aW9uKSAmJiBuID49IDApIHtcbiAgICAgICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUoS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKFwib2tcIiksIGNvbGxlY3Rpb25bbl0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbShcImVycm9yXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcImNvbGxlY3Rpb24gaXMgbm90IGFuIEVudW1lcmFibGVcIik7XG4gIH0sXG5cbiAgZmV0Y2hfX2VtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBuKSB7XG4gICAgaWYgKEtlcm5lbC5pc19saXN0KGNvbGxlY3Rpb24pKSB7XG4gICAgICBpZiAobiA8IHRoaXMuY291bnQoY29sbGVjdGlvbikgJiYgbiA+PSAwKSB7XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uW25dO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib3V0IG9mIGJvdW5kcyBlcnJvclwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb2xsZWN0aW9uIGlzIG5vdCBhbiBFbnVtZXJhYmxlXCIpO1xuICB9LFxuXG4gIGZpbHRlcjogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1bikge1xuICAgIGxldCByZXN1bHQgPSBbXTtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICByZXN1bHQucHVzaChlbGVtKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIGZpbHRlcl9tYXA6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmaWx0ZXIsIG1hcHBlcikge1xuICAgIHJldHVybiBFbnVtLm1hcChFbnVtLmZpbHRlcihjb2xsZWN0aW9uLCBmaWx0ZXIpLCBtYXBwZXIpO1xuICB9LFxuXG4gIGZpbmQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBpZl9ub25lID0gbnVsbCwgZnVuKSB7XG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIHJldHVybiBlbGVtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpZl9ub25lO1xuICB9LFxuXG4gIGludG86IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBsaXN0KSB7XG4gICAgcmV0dXJuIGxpc3QuY29uY2F0KGNvbGxlY3Rpb24pO1xuICB9LFxuXG4gIG1hcDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1bikge1xuICAgIGxldCByZXN1bHQgPSBbXTtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgcmVzdWx0LnB1c2goZnVuKGVsZW0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIG1hcF9yZWR1Y2U6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBhY2MsIGZ1bikge1xuICAgIGxldCBtYXBwZWQgPSBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoKTtcbiAgICBsZXQgdGhlX2FjYyA9IGFjYztcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudChjb2xsZWN0aW9uKTsgaSsrKSB7XG4gICAgICBsZXQgdHVwbGUgPSBmdW4oY29sbGVjdGlvbltpXSwgdGhlX2FjYyk7XG5cbiAgICAgIHRoZV9hY2MgPSBLZXJuZWwuZWxlbSh0dXBsZSwgMSk7XG4gICAgICBtYXBwZWQgPSBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubWFwcGVkLmNvbmNhdChbS2VybmVsLmVsZW0odHVwbGUsIDApXSkpO1xuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKG1hcHBlZCwgdGhlX2FjYyk7XG4gIH0sXG5cbiAgbWVtYmVyOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgdmFsdWUpIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5pbmNsdWRlcyh2YWx1ZSk7XG4gIH0sXG5cbiAgcmVkdWNlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgYWNjLCBmdW4pIHtcbiAgICBsZXQgdGhlX2FjYyA9IGFjYztcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudChjb2xsZWN0aW9uKTsgaSsrKSB7XG4gICAgICBsZXQgdHVwbGUgPSBmdW4oY29sbGVjdGlvbltpXSwgdGhlX2FjYyk7XG5cbiAgICAgIHRoZV9hY2MgPSBLZXJuZWwuZWxlbSh0dXBsZSwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoZV9hY2M7XG4gIH0sXG5cbiAgdGFrZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvdW50KSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoMCwgY291bnQpO1xuICB9LFxuXG4gIHRha2VfZXZlcnk6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBudGgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGluZGV4ICUgbnRoID09PSAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGVsZW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ucmVzdWx0KTtcbiAgfSxcblxuICB0YWtlX3doaWxlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgbGV0IGNvdW50ID0gMDtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICBjb3VudCA9IGNvdW50ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uLnNsaWNlKDAsIGNvdW50KTtcbiAgfSxcblxuICB0b19saXN0OiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG59O1xuXG5sZXQgQXRvbSA9IHt9O1xuXG5BdG9tLnRvX3N0cmluZyA9IGZ1bmN0aW9uIChhdG9tKSB7XG4gIHJldHVybiBTeW1ib2wua2V5Rm9yKGF0b20pO1xufTtcblxuQXRvbS50b19jaGFyX2xpc3QgPSBmdW5jdGlvbiAoYXRvbSkge1xuICByZXR1cm4gQXRvbS50b19zdHJpbmcoYXRvbSkuc3BsaXQoJycpO1xufTtcblxubGV0IEludGVnZXIgPSB7XG5cbiAgaXNfZXZlbjogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gbiAlIDIgPT09IDA7XG4gIH0sXG5cbiAgaXNfb2RkOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBuICUgMiAhPT0gMDtcbiAgfSxcblxuICBwYXJzZTogZnVuY3Rpb24gKGJpbikge1xuICAgIGxldCByZXN1bHQgPSBwYXJzZUludChiaW4pO1xuXG4gICAgaWYgKGlzTmFOKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oXCJlcnJvclwiKTtcbiAgICB9XG5cbiAgICBsZXQgaW5kZXhPZkRvdCA9IGJpbi5pbmRleE9mKFwiLlwiKTtcblxuICAgIGlmIChpbmRleE9mRG90ID49IDApIHtcbiAgICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKHJlc3VsdCwgYmluLnN1YnN0cmluZyhpbmRleE9mRG90KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUocmVzdWx0LCBcIlwiKTtcbiAgfSxcblxuICB0b19jaGFyX2xpc3Q6IGZ1bmN0aW9uIChudW1iZXIsIGJhc2UgPSAxMCkge1xuICAgIHJldHVybiBudW1iZXIudG9TdHJpbmcoYmFzZSkuc3BsaXQoXCJcIik7XG4gIH0sXG5cbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAobnVtYmVyLCBiYXNlID0gMTApIHtcbiAgICByZXR1cm4gbnVtYmVyLnRvU3RyaW5nKGJhc2UpO1xuICB9XG59O1xuXG5sZXQgX0NoYXJzID0gS2VybmVsLmRlZnByb3RvY29sKHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHt9XG59KTtcblxuS2VybmVsLmRlZmltcGwoX0NoYXJzLCBCaXRTdHJpbmcsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICBpZiAoS2VybmVsLmlzX2JpbmFyeSh0aGluZykpIHtcbiAgICAgIHJldHVybiB0aGluZztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpbmcudG9TdHJpbmcoKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKF9DaGFycywgU3ltYm9sLCB7XG4gIHRvX3N0cmluZzogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgaWYgKG5pbCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIEF0b20udG9fc3RyaW5nKHRoaW5nKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKF9DaGFycywgSW50ZWdlclR5cGUsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gSW50ZWdlci50b19zdHJpbmcodGhpbmcpO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoX0NoYXJzLCBGbG9hdFR5cGUsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gdGhpbmcudG9TdHJpbmc7XG4gIH1cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChfQ2hhcnMsIEFycmF5LCB7XG4gIHRvX3N0cmluZzogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgcmV0dXJuIHRoaW5nLnRvU3RyaW5nKCk7XG4gIH1cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChfQ2hhcnMsIFR1cGxlLCB7XG4gIHRvX3N0cmluZzogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgcmV0dXJuIFR1cGxlLnRvX3N0cmluZyh0aGluZyk7XG4gIH1cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChfQ2hhcnMsIG51bGwsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gdGhpbmcudG9TdHJpbmcoKTtcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIHRvX2F0b20oc3RyaW5nKSB7XG4gIHJldHVybiBTeW1ib2wuZm9yKHN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIHRvX2V4aXN0aW5nX2F0b20oc3RyaW5nKSB7XG4gIHJldHVybiBTeW1ib2wuZm9yKHN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIHRvX2NoYXJfbGlzdChzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5zcGxpdCgnJyk7XG59XG5cbmZ1bmN0aW9uIHRvX2Zsb2F0KHN0cmluZykge1xuICByZXR1cm4gcGFyc2VGbG9hdChzdHJpbmcpO1xufVxuXG5mdW5jdGlvbiB0b19pbnRlZ2VyKHN0cmluZywgYmFzZSA9IDEwKSB7XG4gIHJldHVybiBwYXJzZUludChzdHJpbmcsIGJhc2UpO1xufVxuXG5mdW5jdGlvbiB1cGNhc2UoYmluYXJ5KSB7XG4gIHJldHVybiBiaW5hcnkudG9VcHBlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gZG93bmNhc2UoYmluYXJ5KSB7XG4gIHJldHVybiBiaW5hcnkudG9Mb3dlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gYXQoc3RyaW5nLCBwb3NpdGlvbikge1xuICBpZiAocG9zaXRpb24gPiBzdHJpbmcubGVuZ3RoIC0gMSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHN0cmluZ1twb3NpdGlvbl07XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nKSB7XG4gIGxldCByZXR1cm5TdHJpbmcgPSAnJztcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpID09PSAwKSB7XG4gICAgICByZXR1cm5TdHJpbmcgPSByZXR1cm5TdHJpbmcgKyBzdHJpbmdbaV0udG9VcHBlckNhc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuU3RyaW5nID0gcmV0dXJuU3RyaW5nICsgc3RyaW5nW2ldLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldHVyblN0cmluZztcbn1cblxuZnVuY3Rpb24gY29kZXBvaW50cyhzdHJpbmcpIHtcbiAgcmV0dXJuIHRvX2NoYXJfbGlzdChzdHJpbmcpLm1hcChmdW5jdGlvbiAoYykge1xuICAgIHJldHVybiBjLmNvZGVQb2ludEF0KDApO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udGFpbnNfX3FtX18oc3RyaW5nLCBjb250YWlucykge1xuICBpZiAoQXJyYXkuaXNBcnJheShjb250YWlucykpIHtcbiAgICByZXR1cm4gY29udGFpbnMuc29tZShmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIHN0cmluZy5pbmRleE9mKHMpID4gLTE7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gc3RyaW5nLmluZGV4T2YoY29udGFpbnMpID4gLTE7XG59XG5cbmZ1bmN0aW9uIGR1cGxpY2F0ZShzdWJqZWN0LCBuKSB7XG4gIHJldHVybiBzdWJqZWN0LnJlcGVhdChuKTtcbn1cblxuZnVuY3Rpb24gZW5kc193aXRoX19xbV9fKHN0cmluZywgc3VmZml4ZXMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoc3VmZml4ZXMpKSB7XG4gICAgcmV0dXJuIHN1ZmZpeGVzLnNvbWUoZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBzdHJpbmcuZW5kc1dpdGgocyk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gc3RyaW5nLmVuZHNXaXRoKHN1ZmZpeGVzKTtcbn1cblxuZnVuY3Rpb24gZmlyc3Qoc3RyaW5nKSB7XG4gIGlmICghc3RyaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gc3RyaW5nWzBdO1xufVxuXG5mdW5jdGlvbiBncmFwaGVtZXMoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuc3BsaXQoJycpO1xufVxuXG5mdW5jdGlvbiBsYXN0KHN0cmluZykge1xuICBpZiAoIXN0cmluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHN0cmluZ1tzdHJpbmcubGVuZ3RoIC0gMV07XG59XG5cbmZ1bmN0aW9uIGxlbmd0aChzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIG1hdGNoX19xbV9fKHN0cmluZywgcmVnZXgpIHtcbiAgcmV0dXJuIHN0cmluZy5tYXRjaChyZWdleCkgIT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gbmV4dF9jb2RlcG9pbnQoc3RyaW5nKSB7XG4gIGlmICghc3RyaW5nIHx8IHN0cmluZyA9PT0gJycpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKHN0cmluZ1swXS5jb2RlUG9pbnRBdCgwKSwgc3RyaW5nLnN1YnN0cigxKSk7XG59XG5cbmZ1bmN0aW9uIG5leHRfZ3JhcGhlbWUoc3RyaW5nKSB7XG4gIGlmICghc3RyaW5nIHx8IHN0cmluZyA9PT0gJycpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKHN0cmluZ1swXSwgc3RyaW5nLnN1YnN0cigxKSk7XG59XG5cbmZ1bmN0aW9uIHJldmVyc2Uoc3RyaW5nKSB7XG4gIGxldCByZXR1cm5WYWx1ZSA9ICcnO1xuXG4gIGZvciAodmFyIGkgPSBzdHJpbmcubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICByZXR1cm5WYWx1ZSA9IHJldHVyblZhbHVlICsgc3RyaW5nW2ldO1xuICB9O1xuXG4gIHJldHVybiByZXR1cm5WYWx1ZTtcbn1cblxuZnVuY3Rpb24gX3NwbGl0KHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnNwbGl0KCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0c193aXRoX19xbV9fKHN0cmluZywgcHJlZml4ZXMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkocHJlZml4ZXMpKSB7XG4gICAgcmV0dXJuIHByZWZpeGVzLnNvbWUoZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aChzKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aChwcmVmaXhlcyk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkX2NoYXJhY3Rlcl9fcW1fXyhjb2RlcG9pbnQpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21Db2RlUG9pbnQoY29kZXBvaW50KSAhPSBudWxsO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbnZhciBfU3RyaW5nID0ge1xuICBhdCxcbiAgY2FwaXRhbGl6ZSxcbiAgY29kZXBvaW50cyxcbiAgY29udGFpbnNfX3FtX18sXG4gIGRvd25jYXNlLFxuICBkdXBsaWNhdGUsXG4gIGVuZHNfd2l0aF9fcW1fXyxcbiAgZmlyc3QsXG4gIGdyYXBoZW1lcyxcbiAgbGFzdCxcbiAgbGVuZ3RoLFxuICBtYXRjaF9fcW1fXyxcbiAgbmV4dF9jb2RlcG9pbnQsXG4gIG5leHRfZ3JhcGhlbWUsXG4gIHJldmVyc2UsXG4gIHNwbGl0OiBfc3BsaXQsXG4gIHN0YXJ0c193aXRoX19xbV9fLFxuICB0b19hdG9tLFxuICB0b19jaGFyX2xpc3QsXG4gIHRvX2V4aXN0aW5nX2F0b20sXG4gIHRvX2Zsb2F0LFxuICB0b19pbnRlZ2VyLFxuICB1cGNhc2UsXG4gIHZhbGlkX2NoYXJhY3Rlcl9fcW1fXyxcbiAgQ2hhcnM6IF9DaGFyc1xufTtcblxubGV0IENoYXJzID0gS2VybmVsLmRlZnByb3RvY29sKHtcbiAgdG9fY2hhcl9saXN0OiBmdW5jdGlvbiAodGhpbmcpIHt9XG59KTtcblxuS2VybmVsLmRlZmltcGwoQ2hhcnMsIEtlcm5lbC5pc19iaXRzdHJpbmcsIHtcbiAgdG9fY2hhcl9saXN0OiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICBpZiAoS2VybmVsLmlzX2JpbmFyeSh0aGluZykpIHtcbiAgICAgIHJldHVybiBfU3RyaW5nLnRvX2NoYXJfbGlzdCh0aGluZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaW5nLnRvU3RyaW5nKCk7XG4gIH1cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChDaGFycywgS2VybmVsLmlzX2F0b20sIHtcbiAgdG9fY2hhcl9saXN0OiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gQXRvbS50b19jaGFyX2xpc3QodGhpbmcpO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoQ2hhcnMsIEtlcm5lbC5pc19pbnRlZ2VyLCB7XG4gIHRvX2NoYXJfbGlzdDogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgcmV0dXJuIEludGVnZXIudG9fY2hhcl9saXN0KHRoaW5nKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKENoYXJzLCBLZXJuZWwuaXNfbGlzdCwge1xuICB0b19jaGFyX2xpc3Q6IGZ1bmN0aW9uICh0aGluZykge1xuICAgIHJldHVybiB0aGluZztcbiAgfVxufSk7XG5cbmxldCBMaXN0ID0ge307XG5cbkxpc3QuQ2hhcnMgPSBDaGFycztcblxuTGlzdC5kZWxldGUgPSBmdW5jdGlvbiAobGlzdCwgaXRlbSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG4gIGxldCB2YWx1ZV9mb3VuZCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IHggb2YgbGlzdCkge1xuICAgIGlmICh4ID09PSBpdGVtICYmIHZhbHVlX2ZvdW5kICE9PSBmYWxzZSkge1xuICAgICAgbmV3X3ZhbHVlLnB1c2goeCk7XG4gICAgICB2YWx1ZV9mb3VuZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh4ICE9PSBpdGVtKSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh4KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmRlbGV0ZV9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgIT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmR1cGxpY2F0ZSA9IGZ1bmN0aW9uIChlbGVtLCBuKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgIG5ld192YWx1ZS5wdXNoKGVsZW0pO1xuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC5maXJzdCA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gIHJldHVybiBsaXN0WzBdO1xufTtcblxuTGlzdC5mbGF0dGVuID0gZnVuY3Rpb24gKGxpc3QsIHRhaWwgPSBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoKSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgeCBvZiBsaXN0KSB7XG4gICAgaWYgKEtlcm5lbC5pc19saXN0KHgpKSB7XG4gICAgICBuZXdfdmFsdWUgPSBuZXdfdmFsdWUuY29uY2F0KExpc3QuZmxhdHRlbih4KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKHgpO1xuICAgIH1cbiAgfVxuXG4gIG5ld192YWx1ZSA9IG5ld192YWx1ZS5jb25jYXQodGFpbCk7XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC5mb2xkbCA9IGZ1bmN0aW9uIChsaXN0LCBhY2MsIGZ1bmMpIHtcbiAgcmV0dXJuIGxpc3QucmVkdWNlKGZ1bmMsIGFjYyk7XG59O1xuXG5MaXN0LmZvbGRyID0gZnVuY3Rpb24gKGxpc3QsIGFjYywgZnVuYykge1xuICBsZXQgbmV3X2FjYyA9IGFjYztcblxuICBmb3IgKHZhciBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIG5ld19hY2MgPSBmdW5jKGxpc3RbaV0sIG5ld19hY2MpO1xuICB9XG5cbiAgcmV0dXJuIG5ld19hY2M7XG59O1xuXG5MaXN0Lmluc2VydF9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCwgdmFsdWUpIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpID09PSBpbmRleCkge1xuICAgICAgbmV3X3ZhbHVlLnB1c2godmFsdWUpO1xuICAgICAgbmV3X3ZhbHVlLnB1c2gobGlzdFtpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGxpc3RbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3Qua2V5ZGVsZXRlID0gZnVuY3Rpb24gKGxpc3QsIGtleSwgcG9zaXRpb24pIHtcbiAgbGV0IG5ld19saXN0ID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIG5ld19saXN0LnB1c2gobGlzdFtpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0LmtleWZpbmQgPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbiwgX2RlZmF1bHQgPSBudWxsKSB7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgcmV0dXJuIGxpc3RbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIF9kZWZhdWx0O1xufTtcblxuTGlzdC5rZXltZW1iZXJfX3FtYXJrX18gPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbikge1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbkxpc3Qua2V5cmVwbGFjZSA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uLCBuZXdfdHVwbGUpIHtcbiAgbGV0IG5ld19saXN0ID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIG5ld19saXN0LnB1c2gobGlzdFtpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld19saXN0LnB1c2gobmV3X3R1cGxlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld19saXN0KTtcbn07XG5cbkxpc3Qua2V5c29ydCA9IGZ1bmN0aW9uIChsaXN0LCBwb3NpdGlvbikge1xuICBsZXQgbmV3X2xpc3QgPSBsaXN0O1xuXG4gIG5ld19saXN0LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBpZiAocG9zaXRpb24gPT09IDApIHtcbiAgICAgIGlmIChhW3Bvc2l0aW9uXS52YWx1ZSA8IGJbcG9zaXRpb25dLnZhbHVlKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFbcG9zaXRpb25dLnZhbHVlID4gYltwb3NpdGlvbl0udmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYVtwb3NpdGlvbl0gPCBiW3Bvc2l0aW9uXSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG5cbiAgICAgIGlmIChhW3Bvc2l0aW9uXSA+IGJbcG9zaXRpb25dKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xufTtcblxuTGlzdC5rZXlzdG9yZSA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uLCBuZXdfdHVwbGUpIHtcbiAgbGV0IG5ld19saXN0ID0gW107XG4gIGxldCByZXBsYWNlZCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmICghS2VybmVsLm1hdGNoX19xbWFya19fKGxpc3RbaV1bcG9zaXRpb25dLCBrZXkpKSB7XG4gICAgICBuZXdfbGlzdC5wdXNoKGxpc3RbaV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfbGlzdC5wdXNoKG5ld190dXBsZSk7XG4gICAgICByZXBsYWNlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFyZXBsYWNlZCkge1xuICAgIG5ld19saXN0LnB1c2gobmV3X3R1cGxlKTtcbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xufTtcblxuTGlzdC5sYXN0ID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIGxpc3RbbGlzdC5sZW5ndGggLSAxXTtcbn07XG5cbkxpc3QucmVwbGFjZV9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCwgdmFsdWUpIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpID09PSBpbmRleCkge1xuICAgICAgbmV3X3ZhbHVlLnB1c2godmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LnVwZGF0ZV9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCwgZnVuKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QuY291bnQoKTsgaSsrKSB7XG4gICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChmdW4obGlzdC5nZXQoaSkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3X3ZhbHVlLnB1c2gobGlzdC5nZXQoaSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXdfdmFsdWU7XG59O1xuXG5MaXN0LndyYXAgPSBmdW5jdGlvbiAobGlzdCkge1xuICBpZiAoS2VybmVsLmlzX2xpc3QobGlzdCkpIHtcbiAgICByZXR1cm4gbGlzdDtcbiAgfSBlbHNlIGlmIChsaXN0ID09IG51bGwpIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdChsaXN0KTtcbiAgfVxufTtcblxuTGlzdC56aXAgPSBmdW5jdGlvbiAobGlzdF9vZl9saXN0cykge1xuICBpZiAobGlzdF9vZl9saXN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KCk7XG4gIH1cblxuICBsZXQgbmV3X3ZhbHVlID0gW107XG4gIGxldCBzbWFsbGVzdF9sZW5ndGggPSBsaXN0X29mX2xpc3RzWzBdO1xuXG4gIGZvciAobGV0IHggb2YgbGlzdF9vZl9saXN0cykge1xuICAgIGlmICh4Lmxlbmd0aCA8IHNtYWxsZXN0X2xlbmd0aCkge1xuICAgICAgc21hbGxlc3RfbGVuZ3RoID0geC5sZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzbWFsbGVzdF9sZW5ndGg7IGkrKykge1xuICAgIGxldCBjdXJyZW50X3ZhbHVlID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBsaXN0X29mX2xpc3RzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjdXJyZW50X3ZhbHVlLnB1c2gobGlzdF9vZl9saXN0c1tqXVtpXSk7XG4gICAgfVxuXG4gICAgbmV3X3ZhbHVlLnB1c2goS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZSguLi5jdXJyZW50X3ZhbHVlKSk7XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LnRvX3R1cGxlID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUuYXBwbHkobnVsbCwgbGlzdCk7XG59O1xuXG5MaXN0LmFwcGVuZCA9IGZ1bmN0aW9uIChsaXN0LCB2YWx1ZSkge1xuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLmxpc3QuY29uY2F0KFt2YWx1ZV0pKTtcbn07XG5cbkxpc3QucHJlcGVuZCA9IGZ1bmN0aW9uIChsaXN0LCB2YWx1ZSkge1xuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLlt2YWx1ZV0uY29uY2F0KGxpc3QpKTtcbn07XG5cbkxpc3QuY29uY2F0ID0gZnVuY3Rpb24gKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0LmNvbmNhdChyaWdodCk7XG59O1xuXG5jbGFzcyBTaWduYWwge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuYmluZGluZ3MgPSBTcGVjaWFsRm9ybXMubGlzdCgpO1xuICB9XG5cbiAgYWRkKGxpc3RlbmVyLCBjb250ZXh0ID0gdGhpcykge1xuICAgIHRoaXMuYmluZGluZ3MgPSBMaXN0LmFwcGVuZCh0aGlzLmJpbmRpbmdzLCBuZXcgU2lnbmFsQmluZGluZyh0aGlzLCBsaXN0ZW5lciwgY29udGV4dCkpO1xuICB9XG5cbiAgcmVtb3ZlKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5iaW5kaW5ncyA9IEVudW0uZmlsdGVyKHRoaXMuYmluZGluZ3MsIGZ1bmN0aW9uIChiaW5kaW5nKSB7XG4gICAgICByZXR1cm4gYmluZGluZy5saXN0ZW5lciAhPT0gbGlzdGVuZXI7XG4gICAgfSk7XG4gIH1cblxuICBkaXNwYXRjaCguLi5wYXJhbXMpIHtcbiAgICBmb3IgKGxldCBiaW5kaW5nIG9mIHRoaXMuYmluZGluZ3MpIHtcbiAgICAgIGJpbmRpbmcuZXhlY3V0ZSguLi5wYXJhbXMpO1xuICAgIH1cbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgZm9yIChsZXQgYmluZGluZyBvZiB0aGlzLmJpbmRpbmdzKSB7XG4gICAgICBiaW5kaW5nLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLmJpbmRpbmdzID0gbnVsbDtcbiAgfVxufVxuXG5jbGFzcyBTaWduYWxCaW5kaW5nIHtcblxuICBjb25zdHJ1Y3RvcihzaWduYWwsIGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgdGhpcy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICAgIHRoaXMuc2lnbmFsID0gc2lnbmFsO1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIH1cblxuICBleGVjdXRlKC4uLnBhcmFtcykge1xuICAgIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy5jb250ZXh0LCBwYXJhbXMpO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmxpc3RlbmVyID0gbnVsbDtcbiAgICB0aGlzLnNpZ25hbCA9IG51bGw7XG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBfX3VwZGF0ZShtYXAsIGtleSwgdmFsdWUpIHtcbiAgbGV0IG0gPSBuZXcgTWFwKG1hcCk7XG4gIG0uc2V0KGtleSwgdmFsdWUpO1xuICByZXR1cm4gbTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlKG1hcCwga2V5KSB7XG4gIGxldCBtID0gbmV3IE1hcChtYXApO1xuICBtLmRlbGV0ZShrZXkpO1xuICByZXR1cm4gbTtcbn1cblxuY2xhc3MgTWFpbEJveCB7XG5cbiAgY29uc3RydWN0b3IoY29udGV4dCA9IHRoaXMpIHtcbiAgICB0aGlzLnNpZ25hbCA9IG5ldyBTaWduYWwoKTtcbiAgICB0aGlzLnNpZ25hbC5hZGQoKC4uLnBhcmFtcykgPT4gdGhpcy5tZXNzYWdlcyA9IHRoaXMubWVzc2FnZXMuY29uY2F0KHBhcmFtcyksIGNvbnRleHQpO1xuICAgIHRoaXMubWVzc2FnZXMgPSBbXTtcbiAgfVxuXG4gIHJlY2VpdmUoLi4ubWVzc2FnZXMpIHtcbiAgICB0aGlzLnNpZ25hbC5kaXNwYXRjaCguLi5tZXNzYWdlcyk7XG4gIH1cblxuICBwZWVrKCkge1xuICAgIGlmICh0aGlzLm1lc3NhZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWVzc2FnZXNbMF07XG4gIH1cblxuICByZWFkKCkge1xuICAgIGxldCByZXN1bHQgPSB0aGlzLm1lc3NhZ2VzWzBdO1xuICAgIHRoaXMubWVzc2FnZXMgPSB0aGlzLm1lc3NhZ2VzLnNsaWNlKDEpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFkZF9zdWJzY3JpYmVyKGZuLCBjb250ZXh0ID0gdGhpcykge1xuICAgIHRoaXMuc2lnbmFsLmFkZChmbiwgY29udGV4dCk7XG4gIH1cblxuICByZW1vdmVfc3Vic2NyaWJlcihmbikge1xuICAgIHRoaXMuc2lnbmFsLnJlbW92ZShmbik7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc2lnbmFsLmRpc3Bvc2UoKTtcbiAgICB0aGlzLm1lc3NhZ2VzID0gbnVsbDtcbiAgfVxufVxuXG5jbGFzcyBQb3N0T2ZmaWNlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm1haWxib3hlcyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIHNlbmQoYWRkcmVzcywgbWVzc2FnZSkge1xuICAgIHRoaXMubWFpbGJveGVzLmdldChhZGRyZXNzKS5yZWNlaXZlKG1lc3NhZ2UpO1xuICB9XG5cbiAgcmVjZWl2ZShhZGRyZXNzKSB7XG4gICAgcmV0dXJuIHRoaXMubWFpbGJveGVzLmdldChhZGRyZXNzKS5yZWFkKCk7XG4gIH1cblxuICBwZWVrKGFkZHJlc3MpIHtcbiAgICByZXR1cm4gdGhpcy5tYWlsYm94ZXMuZ2V0KGFkZHJlc3MpLnBlZWsoKTtcbiAgfVxuXG4gIGFkZF9tYWlsYm94KGFkZHJlc3MgPSBTeW1ib2woKSwgY29udGV4dCA9IHRoaXMpIHtcbiAgICB0aGlzLm1haWxib3hlcyA9IF9fdXBkYXRlKHRoaXMubWFpbGJveGVzLCBhZGRyZXNzLCBuZXcgTWFpbEJveCgpKTtcbiAgICByZXR1cm4gYWRkcmVzcztcbiAgfVxuXG4gIHJlbW92ZV9tYWlsYm94KGFkZHJlc3MpIHtcbiAgICB0aGlzLm1haWxib3hlcy5nZXQoYWRkcmVzcykuZGlzcG9zZSgpO1xuICAgIHRoaXMubWFpbGJveGVzID0gcmVtb3ZlKHRoaXMubWFpbGJveGVzLCBhZGRyZXNzKTtcbiAgfVxuXG4gIHN1YnNjcmliZShhZGRyZXNzLCBzdWJzY3JpYnRpb25fZm4sIGNvbnRleHQgPSB0aGlzKSB7XG4gICAgdGhpcy5tYWlsYm94ZXMuZ2V0KGFkZHJlc3MpLmFkZF9zdWJzY3JpYmVyKHN1YnNjcmlidGlvbl9mbiwgY29udGV4dCk7XG4gIH1cblxuICB1bnN1YnNjcmliZShhZGRyZXNzLCBzdWJzY3JpYnRpb25fZm4pIHtcbiAgICB0aGlzLm1haWxib3hlcy5nZXQoYWRkcmVzcykucmVtb3ZlX3N1YnNjcmliZXIoc3Vic2NyaWJ0aW9uX2ZuKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsX3Byb3BlcnR5KGl0ZW0sIHByb3BlcnR5KSB7XG4gIGlmIChwcm9wZXJ0eSBpbiBpdGVtKSB7XG4gICAgaXRlbVtwcm9wZXJ0eV07XG4gICAgaWYgKGl0ZW1bcHJvcGVydHldIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BlcnR5XSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaXRlbVtwcm9wZXJ0eV07XG4gICAgfVxuICB9IGVsc2UgaWYgKFN5bWJvbC5mb3IocHJvcGVydHkpIGluIGl0ZW0pIHtcbiAgICBsZXQgcHJvcCA9IFN5bWJvbC5mb3IocHJvcGVydHkpO1xuICAgIGlmIChpdGVtW3Byb3BdIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BdKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BdO1xuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihgUHJvcGVydHkgJHsgcHJvcGVydHkgfSBub3QgZm91bmQgaW4gJHsgaXRlbSB9YCk7XG59XG5cbnZhciBKUyA9IHtcbiAgY2FsbF9wcm9wZXJ0eVxufTtcblxubGV0IFJhbmdlID0gZnVuY3Rpb24gKF9maXJzdCwgX2xhc3QpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJhbmdlKSkge1xuICAgIHJldHVybiBuZXcgUmFuZ2UoX2ZpcnN0LCBfbGFzdCk7XG4gIH1cblxuICB0aGlzLmZpcnN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZmlyc3Q7XG4gIH07XG5cbiAgdGhpcy5sYXN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfbGFzdDtcbiAgfTtcblxuICBsZXQgX3JhbmdlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IF9maXJzdDsgaSA8PSBfbGFzdDsgaSsrKSB7XG4gICAgX3JhbmdlLnB1c2goaSk7XG4gIH1cblxuICBfcmFuZ2UgPSBPYmplY3QuZnJlZXplKF9yYW5nZSk7XG5cbiAgdGhpcy52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX3JhbmdlO1xuICB9O1xuXG4gIHRoaXMubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfcmFuZ2UubGVuZ3RoO1xuICB9O1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuUmFuZ2UucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlKClbU3ltYm9sLml0ZXJhdG9yXSgpO1xufTtcblxuUmFuZ2UubmV3ID0gZnVuY3Rpb24gKGZpcnN0LCBsYXN0KSB7XG4gIHJldHVybiBSYW5nZShmaXJzdCwgbGFzdCk7XG59O1xuXG5SYW5nZS5yYW5nZV9fcW1hcmtfXyA9IGZ1bmN0aW9uIChyYW5nZSkge1xuICByZXR1cm4gcmFuZ2UgaW5zdGFuY2VvZiBSYW5nZTtcbn07XG5cbmxldCBLZXl3b3JkID0ge307XG5cbktleXdvcmQuaGFzX2tleV9fcW1fXyA9IGZ1bmN0aW9uIChrZXl3b3Jkcywga2V5KSB7XG4gIGZvciAobGV0IGtleXdvcmQgb2Yga2V5d29yZHMpIHtcbiAgICBpZiAoS2VybmVsLmVsZW0oa2V5d29yZCwgMCkgPT0ga2V5KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5LZXl3b3JkLmdldCA9IGZ1bmN0aW9uIChrZXl3b3Jkcywga2V5LCB0aGVfZGVmYXVsdCA9IG51bGwpIHtcbiAgZm9yIChsZXQga2V5d29yZCBvZiBrZXl3b3Jkcykge1xuICAgIGlmIChLZXJuZWwuZWxlbShrZXl3b3JkLCAwKSA9PSBrZXkpIHtcbiAgICAgIHJldHVybiBLZXJuZWwuZWxlbShrZXl3b3JkLCAxKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhlX2RlZmF1bHQ7XG59O1xuXG5sZXQgQWdlbnQgPSB7fTtcblxuQWdlbnQuc3RhcnQgPSBmdW5jdGlvbiAoZnVuLCBvcHRpb25zID0gW10pIHtcbiAgY29uc3QgbmFtZSA9IEtleXdvcmQuaGFzX2tleV9fcW1fXyhvcHRpb25zLCBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ25hbWUnKSkgPyBLZXl3b3JkLmdldChvcHRpb25zLCBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ25hbWUnKSkgOiBTeW1ib2woKTtcblxuICBzZWxmLnBvc3Rfb2ZmaWNlLmFkZF9tYWlsYm94KG5hbWUpO1xuICBzZWxmLnBvc3Rfb2ZmaWNlLnNlbmQobmFtZSwgZnVuKCkpO1xuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnb2snKSwgbmFtZSk7XG59O1xuXG5BZ2VudC5zdG9wID0gZnVuY3Rpb24gKGFnZW50LCB0aW1lb3V0ID0gNTAwMCkge1xuICBzZWxmLnBvc3Rfb2ZmaWNlLnJlbW92ZV9tYWlsYm94KGFnZW50KTtcbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnb2snKTtcbn07XG5cbkFnZW50LnVwZGF0ZSA9IGZ1bmN0aW9uIChhZ2VudCwgZnVuLCB0aW1lb3V0ID0gNTAwMCkge1xuXG4gIGNvbnN0IGN1cnJlbnRfc3RhdGUgPSBzZWxmLnBvc3Rfb2ZmaWNlLnJlY2VpdmUoYWdlbnQpO1xuICBzZWxmLnBvc3Rfb2ZmaWNlLnNlbmQoYWdlbnQsIGZ1bihjdXJyZW50X3N0YXRlKSk7XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnb2snKTtcbn07XG5cbkFnZW50LmdldCA9IGZ1bmN0aW9uIChhZ2VudCwgZnVuLCB0aW1lb3V0ID0gNTAwMCkge1xuICByZXR1cm4gZnVuKHNlbGYucG9zdF9vZmZpY2UucGVlayhhZ2VudCkpO1xufTtcblxuQWdlbnQuZ2V0X2FuZF91cGRhdGUgPSBmdW5jdGlvbiAoYWdlbnQsIGZ1biwgdGltZW91dCA9IDUwMDApIHtcblxuICBjb25zdCBnZXRfYW5kX3VwZGF0ZV90dXBsZSA9IGZ1bihzZWxmLnBvc3Rfb2ZmaWNlLnJlY2VpdmUoYWdlbnQpKTtcbiAgc2VsZi5wb3N0X29mZmljZS5zZW5kKGFnZW50LCBLZXJuZWwuZWxlbShnZXRfYW5kX3VwZGF0ZV90dXBsZSwgMSkpO1xuXG4gIHJldHVybiBLZXJuZWwuZWxlbShnZXRfYW5kX3VwZGF0ZV90dXBsZSwgMCk7XG59O1xuXG4vL2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3dCYXNlNjQvQmFzZTY0X2VuY29kaW5nX2FuZF9kZWNvZGluZyNTb2x1dGlvbl8yXyVFMiU4MCU5M19yZXdyaXRlX3RoZV9ET01zX2F0b2IoKV9hbmRfYnRvYSgpX3VzaW5nX0phdmFTY3JpcHQnc19UeXBlZEFycmF5c19hbmRfVVRGLThcbmZ1bmN0aW9uIGI2NEVuY29kZVVuaWNvZGUoc3RyKSB7XG4gIHJldHVybiBidG9hKGVuY29kZVVSSUNvbXBvbmVudChzdHIpLnJlcGxhY2UoLyUoWzAtOUEtRl17Mn0pL2csIGZ1bmN0aW9uIChtYXRjaCwgcDEpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgnMHgnICsgcDEpO1xuICB9KSk7XG59XG5cbmZ1bmN0aW9uIGVuY29kZTY0KGRhdGEpIHtcbiAgcmV0dXJuIGI2NEVuY29kZVVuaWNvZGUoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZTY0KGRhdGEpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ29rJyksIGF0b2IoZGF0YSkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnZXJyb3InKTtcbiAgfVxuICByZXR1cm4gYnRvYShkYXRhKTtcbn1cblxuZnVuY3Rpb24gZGVjb2RlNjRfX2VtX18oZGF0YSkge1xuICByZXR1cm4gYXRvYihkYXRhKTtcbn1cblxudmFyIEJhc2UgPSB7XG4gIGVuY29kZTY0LFxuICBkZWNvZGU2NCxcbiAgZGVjb2RlNjRfX2VtX19cbn07XG5cbmZ1bmN0aW9uIGJub3QoZXhwcikge1xuICByZXR1cm4gfmV4cHI7XG59XG5cbmZ1bmN0aW9uIGJhbmQobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgJiByaWdodDtcbn1cblxuZnVuY3Rpb24gYm9yKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0IHwgcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGJzbChsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCA8PCByaWdodDtcbn1cblxuZnVuY3Rpb24gYnNyKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0ID4+IHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBieG9yKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0IF4gcmlnaHQ7XG59XG5cbnZhciBCaXR3aXNlID0ge1xuICBibm90LFxuICBiYW5kLFxuICBib3IsXG4gIGJzbCxcbiAgYnNyLFxuICBieG9yXG59O1xuXG5sZXQgRW51bWVyYWJsZSA9IEtlcm5lbC5kZWZwcm90b2NvbCh7XG4gIGNvdW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbikge30sXG4gIG1lbWJlcl9xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgdmFsdWUpIHt9LFxuICByZWR1Y2U6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBhY2MsIGZ1bikge31cbn0pO1xuXG5sZXQgQ29sbGVjdGFibGUgPSBLZXJuZWwuZGVmcHJvdG9jb2woe1xuICBpbnRvOiBmdW5jdGlvbiAoY29sbGVjdGFibGUpIHt9XG59KTtcblxubGV0IEluc3BlY3QgPSBLZXJuZWwuZGVmcHJvdG9jb2woe1xuICBpbnNwZWN0OiBmdW5jdGlvbiAodGhpbmcsIG9wdHMpIHt9XG59KTtcblxuZnVuY3Rpb24gX19fbmV3X18oKSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKHt9KTtcbn1cblxuZnVuY3Rpb24ga2V5cyhtYXApIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1hcCk7XG59XG5cbmZ1bmN0aW9uIF9fc2l6ZShtYXApIHtcbiAgcmV0dXJuIGtleXMobWFwKS5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIF9fdG9fbGlzdChtYXApIHtcbiAgbGV0IG1hcF9rZXlzID0ga2V5cyhtYXApO1xuICBsZXQgbGlzdCA9IFtdO1xuXG4gIGZvciAobGV0IGtleSBvZiBtYXBfa2V5cykge1xuICAgIGxpc3QucHVzaChTcGVjaWFsRm9ybXMudHVwbGUoa2V5LCBtYXBba2V5XSkpO1xuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5saXN0KC4uLmxpc3QpO1xufVxuXG5mdW5jdGlvbiB2YWx1ZXMobWFwKSB7XG4gIGxldCBtYXBfa2V5cyA9IGtleXMobWFwKTtcbiAgbGV0IGxpc3QgPSBbXTtcblxuICBmb3IgKGxldCBrZXkgb2YgbWFwX2tleXMpIHtcbiAgICBsaXN0LnB1c2gobWFwW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5saXN0KC4uLmxpc3QpO1xufVxuXG5mdW5jdGlvbiBmcm9tX3N0cnVjdChzdHJ1Y3QpIHtcbiAgbGV0IG1hcCA9IE9iamVjdC5hc3NpZ24oe30sIHN0cnVjdCk7XG4gIGRlbGV0ZSBtYXBbU3ltYm9sLmZvcihcIl9fc3RydWN0X19cIildO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG1hcCk7XG59XG5cbmZ1bmN0aW9uIF9fX19kZWxldGVfXyhtYXAsIGtleSkge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG5cbiAgZGVsZXRlIG5ld19tYXBba2V5XTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gZHJvcChtYXAsIGtleXMpIHtcbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuXG4gIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XG4gICAgZGVsZXRlIG5ld19tYXBba2V5XTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBfX2VxdWFsX19xbWFya19fKG1hcDEsIG1hcDIpIHtcbiAgcmV0dXJuIG1hcDEgPT09IG1hcDI7XG59XG5cbmZ1bmN0aW9uIGZldGNoX19lbWFya19fKG1hcCwga2V5KSB7XG4gIGlmIChrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIG1hcFtrZXldO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKFwiS2V5IG5vdCBmb3VuZC5cIik7XG59XG5cbmZ1bmN0aW9uIGZldGNoKG1hcCwga2V5KSB7XG4gIGlmIChrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIFNwZWNpYWxGb3Jtcy50dXBsZShTcGVjaWFsRm9ybXMuYXRvbShcIm9rXCIpLCBtYXBba2V5XSk7XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLmF0b20oXCJlcnJvclwiKTtcbn1cblxuZnVuY3Rpb24gaGFzX2tleV9fcW1hcmtfXyhtYXAsIGtleSkge1xuICByZXR1cm4ga2V5IGluIG1hcDtcbn1cblxuZnVuY3Rpb24gbWVyZ2UobWFwMSwgbWFwMikge1xuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcF91cGRhdGUobWFwMSwgbWFwMik7XG59XG5cbmZ1bmN0aW9uIHNwbGl0KG1hcCwga2V5cykge1xuICBsZXQgc3BsaXQxID0ge307XG4gIGxldCBzcGxpdDIgPSB7fTtcblxuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMobWFwKSkge1xuICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA+IC0xKSB7XG4gICAgICBzcGxpdDFba2V5XSA9IG1hcFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcGxpdDJba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMudHVwbGUoU3BlY2lhbEZvcm1zLm1hcChzcGxpdDEpLCBTcGVjaWFsRm9ybXMubWFwKHNwbGl0MikpO1xufVxuXG5mdW5jdGlvbiB0YWtlKG1hcCwga2V5cykge1xuICBsZXQgc3BsaXQxID0ge307XG5cbiAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKG1hcCkpIHtcbiAgICBpZiAoa2V5cy5pbmRleE9mKGtleSkgPiAtMSkge1xuICAgICAgc3BsaXQxW2tleV0gPSBtYXBba2V5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChzcGxpdDEpO1xufVxuXG5mdW5jdGlvbiBkcm9wKG1hcCwga2V5cykge1xuICBsZXQgc3BsaXQxID0ge307XG5cbiAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKG1hcCkpIHtcbiAgICBpZiAoa2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSB7XG4gICAgICBzcGxpdDFba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKHNwbGl0MSk7XG59XG5cbmZ1bmN0aW9uIHB1dF9uZXcobWFwLCBrZXksIHZhbHVlKSB7XG4gIGlmIChrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgbWFwKTtcbiAgbmV3X21hcFtrZXldID0gdmFsdWU7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHB1dF9uZXdfbGF6eShtYXAsIGtleSwgZnVuKSB7XG4gIGlmIChrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgbWFwKTtcbiAgbmV3X21hcFtrZXldID0gZnVuKCk7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIGdldF9hbmRfdXBkYXRlKG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSBmdW4obWFwW2tleV0pO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBwb3BfbGF6eShtYXAsIGtleSwgZnVuKSB7XG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIHJldHVybiBTcGVjaWFsRm9ybXMudHVwbGUoZnVuKCksIG1hcCk7XG4gIH1cblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG4gIGxldCB2YWx1ZSA9IGZ1bihuZXdfbWFwW2tleV0pO1xuICBkZWxldGUgbmV3X21hcFtrZXldO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMudHVwbGUodmFsdWUsIG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBwb3AobWFwLCBrZXksIF9kZWZhdWx0ID0gbnVsbCkge1xuICBpZiAoIWtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gU3BlY2lhbEZvcm1zLnR1cGxlKF9kZWZhdWx0LCBtYXApO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBsZXQgdmFsdWUgPSBuZXdfbWFwW2tleV07XG4gIGRlbGV0ZSBuZXdfbWFwW2tleV07XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy50dXBsZSh2YWx1ZSwgbmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIGdldF9sYXp5KG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKCFrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIGZ1bigpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bihtYXBba2V5XSk7XG59XG5cbmZ1bmN0aW9uIGdldChtYXAsIGtleSwgX2RlZmF1bHQgPSBudWxsKSB7XG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIHJldHVybiBfZGVmYXVsdDtcbiAgfVxuXG4gIHJldHVybiBtYXBba2V5XTtcbn1cblxuZnVuY3Rpb24gX19wdXQobWFwLCBrZXksIHZhbCkge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdCh7fSwgbWFwKTtcbiAgbmV3X21hcFtrZXldID0gdmFsO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVfX2VtYXJrX18obWFwLCBrZXksIGZ1bikge1xuICBpZiAoIWtleSBpbiBtYXApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJLZXkgbm90IGZvdW5kXCIpO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3Qoe30sIG1hcCk7XG4gIG5ld19tYXBba2V5XSA9IGZ1bihtYXBba2V5XSk7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIF91cGRhdGUobWFwLCBrZXksIGluaXRpYWwsIGZ1bikge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdCh7fSwgbWFwKTtcblxuICBpZiAoIWtleSBpbiBtYXApIHtcbiAgICBuZXdfbWFwW2tleV0gPSBpbml0aWFsO1xuICB9IGVsc2Uge1xuICAgIG5ld19tYXBba2V5XSA9IGZ1bihtYXBba2V5XSk7XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxudmFyIF9NYXAgPSB7XG4gIG5ldzogX19fbmV3X18sXG4gIGtleXMsXG4gIHNpemU6IF9fc2l6ZSxcbiAgdG9fbGlzdDogX190b19saXN0LFxuICB2YWx1ZXMsXG4gIGZyb21fc3RydWN0LFxuICBkZWxldGU6IF9fX19kZWxldGVfXyxcbiAgZHJvcCxcbiAgZXF1YWxfX3FtYXJrX186IF9fZXF1YWxfX3FtYXJrX18sXG4gIGZldGNoX19lbWFya19fLFxuICBmZXRjaCxcbiAgaGFzX2tleV9fcW1hcmtfXyxcbiAgc3BsaXQsXG4gIHRha2UsXG4gIHB1dF9uZXcsXG4gIHB1dF9uZXdfbGF6eSxcbiAgZ2V0X2FuZF91cGRhdGUsXG4gIHBvcF9sYXp5LFxuICBwb3AsXG4gIGdldF9sYXp5LFxuICBnZXQsXG4gIHB1dDogX19wdXQsXG4gIHVwZGF0ZV9fZW1hcmtfXyxcbiAgdXBkYXRlOiBfdXBkYXRlXG59O1xuXG5mdW5jdGlvbiBfX25ld19fKCkge1xuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcCh7IFtTeW1ib2wuZm9yKCdfX3N0cnVjdF9fJyldOiBTeW1ib2wuZm9yKCdNYXBTZXQnKSwgc2V0OiBTcGVjaWFsRm9ybXMubGlzdCgpIH0pO1xufVxuXG5mdW5jdGlvbiBfc2l6ZShtYXApIHtcbiAgcmV0dXJuIG1hcC5zZXQubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBfdG9fbGlzdChtYXApIHtcbiAgcmV0dXJuIG1hcC5zZXQ7XG59XG5cbmZ1bmN0aW9uIF9fX2RlbGV0ZV9fKHNldCwgdGVybSkge1xuICBsZXQgbmV3X2xpc3QgPSBMaXN0LmRlbGV0ZShzZXQuc2V0LCB0ZXJtKTtcblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIHNldCk7XG4gIG5ld19tYXAuc2V0ID0gbmV3X2xpc3Q7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBfcHV0KHNldCwgdGVybSkge1xuICBpZiAoc2V0LnNldC5pbmRleE9mKHRlcm0pID09PSAtMSkge1xuICAgIGxldCBuZXdfbGlzdCA9IExpc3QuYXBwZW5kKHNldC5zZXQsIHRlcm0pO1xuXG4gICAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBzZXQpO1xuICAgIG5ld19tYXAuc2V0ID0gbmV3X2xpc3Q7XG4gICAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG4gIH1cblxuICByZXR1cm4gc2V0O1xufVxuXG5mdW5jdGlvbiBfZGlmZmVyZW5jZShzZXQxLCBzZXQyKSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgc2V0MSk7XG5cbiAgZm9yIChsZXQgdmFsIG9mIHNldDEuc2V0KSB7XG4gICAgaWYgKF9tZW1iZXJfX3FtYXJrX18oc2V0MiwgdmFsKSkge1xuICAgICAgbmV3X21hcC5zZXQgPSBMaXN0LmRlbGV0ZShuZXdfbWFwLnNldCwgdmFsKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gX2ludGVyc2VjdGlvbihzZXQxLCBzZXQyKSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgc2V0MSk7XG5cbiAgZm9yIChsZXQgdmFsIG9mIHNldDEuc2V0KSB7XG4gICAgaWYgKCFfbWVtYmVyX19xbWFya19fKHNldDIsIHZhbCkpIHtcbiAgICAgIG5ld19tYXAuc2V0ID0gTGlzdC5kZWxldGUobmV3X21hcC5zZXQsIHZhbCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIF91bmlvbihzZXQxLCBzZXQyKSB7XG4gIGxldCBuZXdfbWFwID0gc2V0MTtcblxuICBmb3IgKGxldCB2YWwgb2Ygc2V0Mi5zZXQpIHtcbiAgICBuZXdfbWFwID0gX3B1dChuZXdfbWFwLCB2YWwpO1xuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIF9kaXNqb2luX19xbWFya19fKHNldDEsIHNldDIpIHtcbiAgZm9yIChsZXQgdmFsIG9mIHNldDEuc2V0KSB7XG4gICAgaWYgKF9tZW1iZXJfX3FtYXJrX18oc2V0MiwgdmFsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBfbWVtYmVyX19xbWFya19fKHNldCwgdmFsdWUpIHtcbiAgcmV0dXJuIHNldC5zZXQuaW5kZXhPZih2YWx1ZSkgPj0gMDtcbn1cblxuZnVuY3Rpb24gX2VxdWFsX19xbWFya19fKHNldDEsIHNldDIpIHtcbiAgcmV0dXJuIHNldDEuc2V0ID09PSBzZXQyLnNldDtcbn1cblxuZnVuY3Rpb24gX3N1YnNldF9fcW1hcmtfXyhzZXQxLCBzZXQyKSB7XG4gIGZvciAobGV0IHZhbCBvZiBzZXQxLnNldCkge1xuICAgIGlmICghX21lbWJlcl9fcW1hcmtfXyhzZXQyLCB2YWwpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbnZhciBNYXBTZXQgPSB7XG4gIG5ldzogX19uZXdfXyxcbiAgc2l6ZTogX3NpemUsXG4gIHRvX2xpc3Q6IF90b19saXN0LFxuICBkaXNqb2luX19xbWFya19fOiBfZGlzam9pbl9fcW1hcmtfXyxcbiAgZGVsZXRlOiBfX19kZWxldGVfXyxcbiAgc3Vic2V0X19xbWFya19fOiBfc3Vic2V0X19xbWFya19fLFxuICBlcXVhbF9fcW1hcmtfXzogX2VxdWFsX19xbWFya19fLFxuICBtZW1iZXJfX3FtYXJrX186IF9tZW1iZXJfX3FtYXJrX18sXG4gIHB1dDogX3B1dCxcbiAgdW5pb246IF91bmlvbixcbiAgaW50ZXJzZWN0aW9uOiBfaW50ZXJzZWN0aW9uLFxuICBkaWZmZXJlbmNlOiBfZGlmZmVyZW5jZVxufTtcblxuZnVuY3Rpb24gc2l6ZShtYXApIHtcbiAgcmV0dXJuIE1hcFNldC5zaXplKG1hcCk7XG59XG5cbmZ1bmN0aW9uIHRvX2xpc3QobWFwKSB7XG4gIHJldHVybiBNYXBTZXQudG9fbGlzdChtYXApO1xufVxuXG5mdW5jdGlvbiBfX2RlbGV0ZV9fKHNldCwgdGVybSkge1xuICByZXR1cm4gTWFwU2V0LmRlbGV0ZShzZXQsIHRlcm0pO1xufVxuXG5mdW5jdGlvbiBwdXQoc2V0LCB0ZXJtKSB7XG4gIHJldHVybiBNYXBTZXQucHV0KHNldCwgdGVybSk7XG59XG5cbmZ1bmN0aW9uIGRpZmZlcmVuY2Uoc2V0MSwgc2V0Mikge1xuICByZXR1cm4gTWFwU2V0LmRpZmZlcmVuY2Uoc2V0MSwgc2V0Mik7XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdGlvbihzZXQxLCBzZXQyKSB7XG4gIHJldHVybiBNYXBTZXQuaW50ZXJzZWN0aW9uKHNldDEsIHNldDIpO1xufVxuXG5mdW5jdGlvbiB1bmlvbihzZXQxLCBzZXQyKSB7XG4gIHJldHVybiBNYXBTZXQudW5pb24oc2V0MSwgc2V0Mik7XG59XG5cbmZ1bmN0aW9uIGRpc2pvaW5fX3FtYXJrX18oc2V0MSwgc2V0Mikge1xuICByZXR1cm4gTWFwU2V0LmRpc2pvaW5fX3FtYXJrX18oc2V0MSwgc2V0Mik7XG59XG5cbmZ1bmN0aW9uIG1lbWJlcl9fcW1hcmtfXyhzZXQsIHZhbHVlKSB7XG4gIHJldHVybiBNYXBTZXQubWVtYmVyX19xbWFya19fKHNldDEsIHNldDIpO1xufVxuXG5mdW5jdGlvbiBlcXVhbF9fcW1hcmtfXyhzZXQxLCBzZXQyKSB7XG4gIHJldHVybiBNYXBTZXQuZXF1YWxfX3FtYXJrX18oc2V0MSwgc2V0Mik7XG59XG5cbmZ1bmN0aW9uIHN1YnNldF9fcW1hcmtfXyhzZXQxLCBzZXQyKSB7XG4gIHJldHVybiBNYXBTZXQuc3Vic2V0X19xbWFya19fKHNldDEsIHNldDIpO1xufVxuXG52YXIgX1NldCA9IHtcbiAgc2l6ZSxcbiAgdG9fbGlzdCxcbiAgZGlzam9pbl9fcW1hcmtfXyxcbiAgZGVsZXRlOiBfX2RlbGV0ZV9fLFxuICBzdWJzZXRfX3FtYXJrX18sXG4gIGVxdWFsX19xbWFya19fLFxuICBtZW1iZXJfX3FtYXJrX18sXG4gIHB1dCxcbiAgdW5pb24sXG4gIGludGVyc2VjdGlvbixcbiAgZGlmZmVyZW5jZVxufTtcblxuc2VsZi5wb3N0X29mZmljZSA9IHNlbGYucG9zdF9vZmZpY2UgfHwgbmV3IFBvc3RPZmZpY2UoKTtcblxuZXhwb3J0IHsgX1BhdHRlcm5zIGFzIFBhdHRlcm5zLCBCaXRTdHJpbmcsIEtlcm5lbCwgQXRvbSwgRW51bSwgSW50ZWdlciwgSlMsIExpc3QsIFJhbmdlLCBUdXBsZSwgQWdlbnQsIEtleXdvcmQsIEJhc2UsIF9TdHJpbmcgYXMgU3RyaW5nLCBCaXR3aXNlLCBFbnVtZXJhYmxlLCBDb2xsZWN0YWJsZSwgSW5zcGVjdCwgX01hcCBhcyBNYXAsIF9TZXQgYXMgU2V0LCBNYXBTZXQsIEludGVnZXJUeXBlLCBGbG9hdFR5cGUgfTsiXSwiZmlsZSI6ImVsaXhpci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9