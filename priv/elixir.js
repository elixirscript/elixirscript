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

let virtualDom = (function (e) {
    return e();
})(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw (f.code = "MODULE_NOT_FOUND", f);
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, l, l.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    })({
        1: [function (require, module, exports) {

            var createElement = require("./vdom/create-element.js");

            module.exports = createElement;
        }, { "./vdom/create-element.js": 15 }], 2: [function (require, module, exports) {
            var diff = require("./vtree/diff.js");

            module.exports = diff;
        }, { "./vtree/diff.js": 35 }], 3: [function (require, module, exports) {
            var h = require("./virtual-hyperscript/index.js");

            module.exports = h;
        }, { "./virtual-hyperscript/index.js": 22 }], 4: [function (require, module, exports) {
            var diff = require("./diff.js");
            var patch = require("./patch.js");
            var h = require("./h.js");
            var create = require("./create-element.js");
            var VNode = require("./vnode/vnode.js");
            var VText = require("./vnode/vtext.js");

            module.exports = {
                diff: diff,
                patch: patch,
                h: h,
                create: create,
                VNode: VNode,
                VText: VText
            };
        }, { "./create-element.js": 1, "./diff.js": 2, "./h.js": 3, "./patch.js": 13, "./vnode/vnode.js": 31, "./vnode/vtext.js": 33 }], 5: [function (require, module, exports) {
            /*!
             * Cross-Browser Split 1.1.1
             * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
             * Available under the MIT License
             * ECMAScript compliant, uniform cross-browser split method
             */

            /**
             * Splits a string into an array of strings using a regex or string separator. Matches of the
             * separator are not included in the result array. However, if `separator` is a regex that contains
             * capturing groups, backreferences are spliced into the result each time `separator` is matched.
             * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
             * cross-browser.
             * @param {String} str String to split.
             * @param {RegExp|String} separator Regex or string to use for separating the string.
             * @param {Number} [limit] Maximum number of items to include in the result array.
             * @returns {Array} Array of substrings.
             * @example
             *
             * // Basic use
             * split('a b c d', ' ');
             * // -> ['a', 'b', 'c', 'd']
             *
             * // With limit
             * split('a b c d', ' ', 2);
             * // -> ['a', 'b']
             *
             * // Backreferences in result array
             * split('..word1 word2..', /([a-z]+)(\d+)/i);
             * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
             */
            module.exports = (function split(undef) {

                var nativeSplit = String.prototype.split,
                    compliantExecNpcg = /()??/.exec("")[1] === undef,

                // NPCG: nonparticipating capturing group
                self;

                self = function (str, separator, limit) {
                    // If `separator` is not a regex, use `nativeSplit`
                    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
                        return nativeSplit.call(str, separator, limit);
                    }
                    var output = [],
                        flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + (separator.sticky ? "y" : ""),

                    // Firefox 3+
                    lastLastIndex = 0,

                    // Make `global` and avoid `lastIndex` issues by working with a copy
                    separator = new RegExp(separator.source, flags + "g"),
                        separator2,
                        match,
                        lastIndex,
                        lastLength;
                    str += ""; // Type-convert
                    if (!compliantExecNpcg) {
                        // Doesn't need flags gy, but they don't hurt
                        separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
                    }
                    /* Values for `limit`, per the spec:
                     * If undefined: 4294967295 // Math.pow(2, 32) - 1
                     * If 0, Infinity, or NaN: 0
                     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
                     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
                     * If other: Type-convert, then use the above rules
                     */
                    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
                    limit >>> 0; // ToUint32(limit)
                    while (match = separator.exec(str)) {
                        // `separator.lastIndex` is not reliable cross-browser
                        lastIndex = match.index + match[0].length;
                        if (lastIndex > lastLastIndex) {
                            output.push(str.slice(lastLastIndex, match.index));
                            // Fix browsers whose `exec` methods don't consistently return `undefined` for
                            // nonparticipating capturing groups
                            if (!compliantExecNpcg && match.length > 1) {
                                match[0].replace(separator2, function () {
                                    for (var i = 1; i < arguments.length - 2; i++) {
                                        if (arguments[i] === undef) {
                                            match[i] = undef;
                                        }
                                    }
                                });
                            }
                            if (match.length > 1 && match.index < str.length) {
                                Array.prototype.push.apply(output, match.slice(1));
                            }
                            lastLength = match[0].length;
                            lastLastIndex = lastIndex;
                            if (output.length >= limit) {
                                break;
                            }
                        }
                        if (separator.lastIndex === match.index) {
                            separator.lastIndex++; // Avoid an infinite loop
                        }
                    }
                    if (lastLastIndex === str.length) {
                        if (lastLength || !separator.test("")) {
                            output.push("");
                        }
                    } else {
                        output.push(str.slice(lastLastIndex));
                    }
                    return output.length > limit ? output.slice(0, limit) : output;
                };

                return self;
            })();
        }, {}], 6: [function (require, module, exports) {}, {}], 7: [function (require, module, exports) {
            "use strict";

            var OneVersionConstraint = require("individual/one-version");

            var MY_VERSION = "7";
            OneVersionConstraint("ev-store", MY_VERSION);

            var hashKey = "__EV_STORE_KEY@" + MY_VERSION;

            module.exports = EvStore;

            function EvStore(elem) {
                var hash = elem[hashKey];

                if (!hash) {
                    hash = elem[hashKey] = {};
                }

                return hash;
            }
        }, { "individual/one-version": 9 }], 8: [function (require, module, exports) {
            (function (global) {
                "use strict";

                /*global window, global*/

                var root = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};

                module.exports = Individual;

                function Individual(key, value) {
                    if (key in root) {
                        return root[key];
                    }

                    root[key] = value;

                    return value;
                }
            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, {}], 9: [function (require, module, exports) {
            "use strict";

            var Individual = require("./index.js");

            module.exports = OneVersion;

            function OneVersion(moduleName, version, defaultValue) {
                var key = "__INDIVIDUAL_ONE_VERSION_" + moduleName;
                var enforceKey = key + "_ENFORCE_SINGLETON";

                var versionValue = Individual(enforceKey, version);

                if (versionValue !== version) {
                    throw new Error("Can only have one copy of " + moduleName + ".\n" + "You already have version " + versionValue + " installed.\n" + "This means you cannot install version " + version);
                }

                return Individual(key, defaultValue);
            }
        }, { "./index.js": 8 }], 10: [function (require, module, exports) {
            (function (global) {
                var topLevel = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : {};
                var minDoc = require("min-document");

                if (typeof document !== "undefined") {
                    module.exports = document;
                } else {
                    var doccy = topLevel["__GLOBAL_DOCUMENT_CACHE@4"];

                    if (!doccy) {
                        doccy = topLevel["__GLOBAL_DOCUMENT_CACHE@4"] = minDoc;
                    }

                    module.exports = doccy;
                }
            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, { "min-document": 6 }], 11: [function (require, module, exports) {
            "use strict";

            module.exports = function isObject(x) {
                return typeof x === "object" && x !== null;
            };
        }, {}], 12: [function (require, module, exports) {
            var nativeIsArray = Array.isArray;
            var toString = Object.prototype.toString;

            module.exports = nativeIsArray || isArray;

            function isArray(obj) {
                return toString.call(obj) === "[object Array]";
            }
        }, {}], 13: [function (require, module, exports) {
            var patch = require("./vdom/patch.js");

            module.exports = patch;
        }, { "./vdom/patch.js": 18 }], 14: [function (require, module, exports) {
            var isObject = require("is-object");
            var isHook = require("../vnode/is-vhook.js");

            module.exports = applyProperties;

            function applyProperties(node, props, previous) {
                for (var propName in props) {
                    var propValue = props[propName];

                    if (propValue === undefined) {
                        removeProperty(node, propName, propValue, previous);
                    } else if (isHook(propValue)) {
                        removeProperty(node, propName, propValue, previous);
                        if (propValue.hook) {
                            propValue.hook(node, propName, previous ? previous[propName] : undefined);
                        }
                    } else {
                        if (isObject(propValue)) {
                            patchObject(node, props, previous, propName, propValue);
                        } else {
                            node[propName] = propValue;
                        }
                    }
                }
            }

            function removeProperty(node, propName, propValue, previous) {
                if (previous) {
                    var previousValue = previous[propName];

                    if (!isHook(previousValue)) {
                        if (propName === "attributes") {
                            for (var attrName in previousValue) {
                                node.removeAttribute(attrName);
                            }
                        } else if (propName === "style") {
                            for (var i in previousValue) {
                                node.style[i] = "";
                            }
                        } else if (typeof previousValue === "string") {
                            node[propName] = "";
                        } else {
                            node[propName] = null;
                        }
                    } else if (previousValue.unhook) {
                        previousValue.unhook(node, propName, propValue);
                    }
                }
            }

            function patchObject(node, props, previous, propName, propValue) {
                var previousValue = previous ? previous[propName] : undefined;

                // Set attributes
                if (propName === "attributes") {
                    for (var attrName in propValue) {
                        var attrValue = propValue[attrName];

                        if (attrValue === undefined) {
                            node.removeAttribute(attrName);
                        } else {
                            node.setAttribute(attrName, attrValue);
                        }
                    }

                    return;
                }

                if (previousValue && isObject(previousValue) && getPrototype(previousValue) !== getPrototype(propValue)) {
                    node[propName] = propValue;
                    return;
                }

                if (!isObject(node[propName])) {
                    node[propName] = {};
                }

                var replacer = propName === "style" ? "" : undefined;

                for (var k in propValue) {
                    var value = propValue[k];
                    node[propName][k] = value === undefined ? replacer : value;
                }
            }

            function getPrototype(value) {
                if (Object.getPrototypeOf) {
                    return Object.getPrototypeOf(value);
                } else if (value.__proto__) {
                    return value.__proto__;
                } else if (value.constructor) {
                    return value.constructor.prototype;
                }
            }
        }, { "../vnode/is-vhook.js": 26, "is-object": 11 }], 15: [function (require, module, exports) {
            var document = require("global/document");

            var applyProperties = require("./apply-properties");

            var isVNode = require("../vnode/is-vnode.js");
            var isVText = require("../vnode/is-vtext.js");
            var isWidget = require("../vnode/is-widget.js");
            var handleThunk = require("../vnode/handle-thunk.js");

            module.exports = createElement;

            function createElement(vnode, opts) {
                var doc = opts ? opts.document || document : document;
                var warn = opts ? opts.warn : null;

                vnode = handleThunk(vnode).a;

                if (isWidget(vnode)) {
                    return vnode.init();
                } else if (isVText(vnode)) {
                    return doc.createTextNode(vnode.text);
                } else if (!isVNode(vnode)) {
                    if (warn) {
                        warn("Item is not a valid virtual dom node", vnode);
                    }
                    return null;
                }

                var node = vnode.namespace === null ? doc.createElement(vnode.tagName) : doc.createElementNS(vnode.namespace, vnode.tagName);

                var props = vnode.properties;
                applyProperties(node, props);

                var children = vnode.children;

                for (var i = 0; i < children.length; i++) {
                    var childNode = createElement(children[i], opts);
                    if (childNode) {
                        node.appendChild(childNode);
                    }
                }

                return node;
            }
        }, { "../vnode/handle-thunk.js": 24, "../vnode/is-vnode.js": 27, "../vnode/is-vtext.js": 28, "../vnode/is-widget.js": 29, "./apply-properties": 14, "global/document": 10 }], 16: [function (require, module, exports) {
            // Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
            // We don't want to read all of the DOM nodes in the tree so we use
            // the in-order tree indexing to eliminate recursion down certain branches.
            // We only recurse into a DOM node if we know that it contains a child of
            // interest.

            var noChild = {};

            module.exports = domIndex;

            function domIndex(rootNode, tree, indices, nodes) {
                if (!indices || indices.length === 0) {
                    return {};
                } else {
                    indices.sort(ascending);
                    return recurse(rootNode, tree, indices, nodes, 0);
                }
            }

            function recurse(rootNode, tree, indices, nodes, rootIndex) {
                nodes = nodes || {};

                if (rootNode) {
                    if (indexInRange(indices, rootIndex, rootIndex)) {
                        nodes[rootIndex] = rootNode;
                    }

                    var vChildren = tree.children;

                    if (vChildren) {

                        var childNodes = rootNode.childNodes;

                        for (var i = 0; i < tree.children.length; i++) {
                            rootIndex += 1;

                            var vChild = vChildren[i] || noChild;
                            var nextIndex = rootIndex + (vChild.count || 0);

                            // skip recursion down the tree if there are no nodes down here
                            if (indexInRange(indices, rootIndex, nextIndex)) {
                                recurse(childNodes[i], vChild, indices, nodes, rootIndex);
                            }

                            rootIndex = nextIndex;
                        }
                    }
                }

                return nodes;
            }

            // Binary search for an index in the interval [left, right]
            function indexInRange(indices, left, right) {
                if (indices.length === 0) {
                    return false;
                }

                var minIndex = 0;
                var maxIndex = indices.length - 1;
                var currentIndex;
                var currentItem;

                while (minIndex <= maxIndex) {
                    currentIndex = (maxIndex + minIndex) / 2 >> 0;
                    currentItem = indices[currentIndex];

                    if (minIndex === maxIndex) {
                        return currentItem >= left && currentItem <= right;
                    } else if (currentItem < left) {
                        minIndex = currentIndex + 1;
                    } else if (currentItem > right) {
                        maxIndex = currentIndex - 1;
                    } else {
                        return true;
                    }
                }

                return false;
            }

            function ascending(a, b) {
                return a > b ? 1 : -1;
            }
        }, {}], 17: [function (require, module, exports) {
            var applyProperties = require("./apply-properties");

            var isWidget = require("../vnode/is-widget.js");
            var VPatch = require("../vnode/vpatch.js");

            var updateWidget = require("./update-widget");

            module.exports = applyPatch;

            function applyPatch(vpatch, domNode, renderOptions) {
                var type = vpatch.type;
                var vNode = vpatch.vNode;
                var patch = vpatch.patch;

                switch (type) {
                    case VPatch.REMOVE:
                        return removeNode(domNode, vNode);
                    case VPatch.INSERT:
                        return insertNode(domNode, patch, renderOptions);
                    case VPatch.VTEXT:
                        return stringPatch(domNode, vNode, patch, renderOptions);
                    case VPatch.WIDGET:
                        return widgetPatch(domNode, vNode, patch, renderOptions);
                    case VPatch.VNODE:
                        return vNodePatch(domNode, vNode, patch, renderOptions);
                    case VPatch.ORDER:
                        reorderChildren(domNode, patch);
                        return domNode;
                    case VPatch.PROPS:
                        applyProperties(domNode, patch, vNode.properties);
                        return domNode;
                    case VPatch.THUNK:
                        return replaceRoot(domNode, renderOptions.patch(domNode, patch, renderOptions));
                    default:
                        return domNode;
                }
            }

            function removeNode(domNode, vNode) {
                var parentNode = domNode.parentNode;

                if (parentNode) {
                    parentNode.removeChild(domNode);
                }

                destroyWidget(domNode, vNode);

                return null;
            }

            function insertNode(parentNode, vNode, renderOptions) {
                var newNode = renderOptions.render(vNode, renderOptions);

                if (parentNode) {
                    parentNode.appendChild(newNode);
                }

                return parentNode;
            }

            function stringPatch(domNode, leftVNode, vText, renderOptions) {
                var newNode;

                if (domNode.nodeType === 3) {
                    domNode.replaceData(0, domNode.length, vText.text);
                    newNode = domNode;
                } else {
                    var parentNode = domNode.parentNode;
                    newNode = renderOptions.render(vText, renderOptions);

                    if (parentNode && newNode !== domNode) {
                        parentNode.replaceChild(newNode, domNode);
                    }
                }

                return newNode;
            }

            function widgetPatch(domNode, leftVNode, widget, renderOptions) {
                var updating = updateWidget(leftVNode, widget);
                var newNode;

                if (updating) {
                    newNode = widget.update(leftVNode, domNode) || domNode;
                } else {
                    newNode = renderOptions.render(widget, renderOptions);
                }

                var parentNode = domNode.parentNode;

                if (parentNode && newNode !== domNode) {
                    parentNode.replaceChild(newNode, domNode);
                }

                if (!updating) {
                    destroyWidget(domNode, leftVNode);
                }

                return newNode;
            }

            function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
                var parentNode = domNode.parentNode;
                var newNode = renderOptions.render(vNode, renderOptions);

                if (parentNode && newNode !== domNode) {
                    parentNode.replaceChild(newNode, domNode);
                }

                return newNode;
            }

            function destroyWidget(domNode, w) {
                if (typeof w.destroy === "function" && isWidget(w)) {
                    w.destroy(domNode);
                }
            }

            function reorderChildren(domNode, moves) {
                var childNodes = domNode.childNodes;
                var keyMap = {};
                var node;
                var remove;
                var insert;

                for (var i = 0; i < moves.removes.length; i++) {
                    remove = moves.removes[i];
                    node = childNodes[remove.from];
                    if (remove.key) {
                        keyMap[remove.key] = node;
                    }
                    domNode.removeChild(node);
                }

                var length = childNodes.length;
                for (var j = 0; j < moves.inserts.length; j++) {
                    insert = moves.inserts[j];
                    node = keyMap[insert.key];
                    // this is the weirdest bug i've ever seen in webkit
                    domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to]);
                }
            }

            function replaceRoot(oldRoot, newRoot) {
                if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
                    oldRoot.parentNode.replaceChild(newRoot, oldRoot);
                }

                return newRoot;
            }
        }, { "../vnode/is-widget.js": 29, "../vnode/vpatch.js": 32, "./apply-properties": 14, "./update-widget": 19 }], 18: [function (require, module, exports) {
            var document = require("global/document");
            var isArray = require("x-is-array");

            var render = require("./create-element");
            var domIndex = require("./dom-index");
            var patchOp = require("./patch-op");
            module.exports = patch;

            function patch(rootNode, patches, renderOptions) {
                renderOptions = renderOptions || {};
                renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch ? renderOptions.patch : patchRecursive;
                renderOptions.render = renderOptions.render || render;

                return renderOptions.patch(rootNode, patches, renderOptions);
            }

            function patchRecursive(rootNode, patches, renderOptions) {
                var indices = patchIndices(patches);

                if (indices.length === 0) {
                    return rootNode;
                }

                var index = domIndex(rootNode, patches.a, indices);
                var ownerDocument = rootNode.ownerDocument;

                if (!renderOptions.document && ownerDocument !== document) {
                    renderOptions.document = ownerDocument;
                }

                for (var i = 0; i < indices.length; i++) {
                    var nodeIndex = indices[i];
                    rootNode = applyPatch(rootNode, index[nodeIndex], patches[nodeIndex], renderOptions);
                }

                return rootNode;
            }

            function applyPatch(rootNode, domNode, patchList, renderOptions) {
                if (!domNode) {
                    return rootNode;
                }

                var newNode;

                if (isArray(patchList)) {
                    for (var i = 0; i < patchList.length; i++) {
                        newNode = patchOp(patchList[i], domNode, renderOptions);

                        if (domNode === rootNode) {
                            rootNode = newNode;
                        }
                    }
                } else {
                    newNode = patchOp(patchList, domNode, renderOptions);

                    if (domNode === rootNode) {
                        rootNode = newNode;
                    }
                }

                return rootNode;
            }

            function patchIndices(patches) {
                var indices = [];

                for (var key in patches) {
                    if (key !== "a") {
                        indices.push(Number(key));
                    }
                }

                return indices;
            }
        }, { "./create-element": 15, "./dom-index": 16, "./patch-op": 17, "global/document": 10, "x-is-array": 12 }], 19: [function (require, module, exports) {
            var isWidget = require("../vnode/is-widget.js");

            module.exports = updateWidget;

            function updateWidget(a, b) {
                if (isWidget(a) && isWidget(b)) {
                    if ("name" in a && "name" in b) {
                        return a.id === b.id;
                    } else {
                        return a.init === b.init;
                    }
                }

                return false;
            }
        }, { "../vnode/is-widget.js": 29 }], 20: [function (require, module, exports) {
            "use strict";

            var EvStore = require("ev-store");

            module.exports = EvHook;

            function EvHook(value) {
                if (!(this instanceof EvHook)) {
                    return new EvHook(value);
                }

                this.value = value;
            }

            EvHook.prototype.hook = function (node, propertyName) {
                var es = EvStore(node);
                var propName = propertyName.substr(3);

                es[propName] = this.value;
            };

            EvHook.prototype.unhook = function (node, propertyName) {
                var es = EvStore(node);
                var propName = propertyName.substr(3);

                es[propName] = undefined;
            };
        }, { "ev-store": 7 }], 21: [function (require, module, exports) {
            "use strict";

            module.exports = SoftSetHook;

            function SoftSetHook(value) {
                if (!(this instanceof SoftSetHook)) {
                    return new SoftSetHook(value);
                }

                this.value = value;
            }

            SoftSetHook.prototype.hook = function (node, propertyName) {
                if (node[propertyName] !== this.value) {
                    node[propertyName] = this.value;
                }
            };
        }, {}], 22: [function (require, module, exports) {
            "use strict";

            var isArray = require("x-is-array");

            var VNode = require("../vnode/vnode.js");
            var VText = require("../vnode/vtext.js");
            var isVNode = require("../vnode/is-vnode");
            var isVText = require("../vnode/is-vtext");
            var isWidget = require("../vnode/is-widget");
            var isHook = require("../vnode/is-vhook");
            var isVThunk = require("../vnode/is-thunk");

            var parseTag = require("./parse-tag.js");
            var softSetHook = require("./hooks/soft-set-hook.js");
            var evHook = require("./hooks/ev-hook.js");

            module.exports = h;

            function h(tagName, properties, children) {
                var childNodes = [];
                var tag, props, key, namespace;

                if (!children && isChildren(properties)) {
                    children = properties;
                    props = {};
                }

                props = props || properties || {};
                tag = parseTag(tagName, props);

                // support keys
                if (props.hasOwnProperty("key")) {
                    key = props.key;
                    props.key = undefined;
                }

                // support namespace
                if (props.hasOwnProperty("namespace")) {
                    namespace = props.namespace;
                    props.namespace = undefined;
                }

                // fix cursor bug
                if (tag === "INPUT" && !namespace && props.hasOwnProperty("value") && props.value !== undefined && !isHook(props.value)) {
                    props.value = softSetHook(props.value);
                }

                transformProperties(props);

                if (children !== undefined && children !== null) {
                    addChild(children, childNodes, tag, props);
                }

                return new VNode(tag, props, childNodes, key, namespace);
            }

            function addChild(c, childNodes, tag, props) {
                if (typeof c === "string") {
                    childNodes.push(new VText(c));
                } else if (typeof c === "number") {
                    childNodes.push(new VText(String(c)));
                } else if (isChild(c)) {
                    childNodes.push(c);
                } else if (isArray(c)) {
                    for (var i = 0; i < c.length; i++) {
                        addChild(c[i], childNodes, tag, props);
                    }
                } else if (c === null || c === undefined) {
                    return;
                } else {
                    throw UnexpectedVirtualElement({
                        foreignObject: c,
                        parentVnode: {
                            tagName: tag,
                            properties: props
                        }
                    });
                }
            }

            function transformProperties(props) {
                for (var propName in props) {
                    if (props.hasOwnProperty(propName)) {
                        var value = props[propName];

                        if (isHook(value)) {
                            continue;
                        }

                        if (propName.substr(0, 3) === "ev-") {
                            // add ev-foo support
                            props[propName] = evHook(value);
                        }
                    }
                }
            }

            function isChild(x) {
                return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
            }

            function isChildren(x) {
                return typeof x === "string" || isArray(x) || isChild(x);
            }

            function UnexpectedVirtualElement(data) {
                var err = new Error();

                err.type = "virtual-hyperscript.unexpected.virtual-element";
                err.message = "Unexpected virtual child passed to h().\n" + "Expected a VNode / Vthunk / VWidget / string but:\n" + "got:\n" + errorString(data.foreignObject) + ".\n" + "The parent vnode is:\n" + errorString(data.parentVnode);
                "\n" + "Suggested fix: change your `h(..., [ ... ])` callsite.";
                err.foreignObject = data.foreignObject;
                err.parentVnode = data.parentVnode;

                return err;
            }

            function errorString(obj) {
                try {
                    return JSON.stringify(obj, null, "    ");
                } catch (e) {
                    return String(obj);
                }
            }
        }, { "../vnode/is-thunk": 25, "../vnode/is-vhook": 26, "../vnode/is-vnode": 27, "../vnode/is-vtext": 28, "../vnode/is-widget": 29, "../vnode/vnode.js": 31, "../vnode/vtext.js": 33, "./hooks/ev-hook.js": 20, "./hooks/soft-set-hook.js": 21, "./parse-tag.js": 23, "x-is-array": 12 }], 23: [function (require, module, exports) {
            "use strict";

            var split = require("browser-split");

            var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
            var notClassId = /^\.|#/;

            module.exports = parseTag;

            function parseTag(tag, props) {
                if (!tag) {
                    return "DIV";
                }

                var noId = !props.hasOwnProperty("id");

                var tagParts = split(tag, classIdSplit);
                var tagName = null;

                if (notClassId.test(tagParts[1])) {
                    tagName = "DIV";
                }

                var classes, part, type, i;

                for (i = 0; i < tagParts.length; i++) {
                    part = tagParts[i];

                    if (!part) {
                        continue;
                    }

                    type = part.charAt(0);

                    if (!tagName) {
                        tagName = part;
                    } else if (type === ".") {
                        classes = classes || [];
                        classes.push(part.substring(1, part.length));
                    } else if (type === "#" && noId) {
                        props.id = part.substring(1, part.length);
                    }
                }

                if (classes) {
                    if (props.className) {
                        classes.push(props.className);
                    }

                    props.className = classes.join(" ");
                }

                return props.namespace ? tagName : tagName.toUpperCase();
            }
        }, { "browser-split": 5 }], 24: [function (require, module, exports) {
            var isVNode = require("./is-vnode");
            var isVText = require("./is-vtext");
            var isWidget = require("./is-widget");
            var isThunk = require("./is-thunk");

            module.exports = handleThunk;

            function handleThunk(a, b) {
                var renderedA = a;
                var renderedB = b;

                if (isThunk(b)) {
                    renderedB = renderThunk(b, a);
                }

                if (isThunk(a)) {
                    renderedA = renderThunk(a, null);
                }

                return {
                    a: renderedA,
                    b: renderedB
                };
            }

            function renderThunk(thunk, previous) {
                var renderedThunk = thunk.vnode;

                if (!renderedThunk) {
                    renderedThunk = thunk.vnode = thunk.render(previous);
                }

                if (!(isVNode(renderedThunk) || isVText(renderedThunk) || isWidget(renderedThunk))) {
                    throw new Error("thunk did not return a valid node");
                }

                return renderedThunk;
            }
        }, { "./is-thunk": 25, "./is-vnode": 27, "./is-vtext": 28, "./is-widget": 29 }], 25: [function (require, module, exports) {
            module.exports = isThunk;

            function isThunk(t) {
                return t && t.type === "Thunk";
            }
        }, {}], 26: [function (require, module, exports) {
            module.exports = isHook;

            function isHook(hook) {
                return hook && (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") || typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"));
            }
        }, {}], 27: [function (require, module, exports) {
            var version = require("./version");

            module.exports = isVirtualNode;

            function isVirtualNode(x) {
                return x && x.type === "VirtualNode" && x.version === version;
            }
        }, { "./version": 30 }], 28: [function (require, module, exports) {
            var version = require("./version");

            module.exports = isVirtualText;

            function isVirtualText(x) {
                return x && x.type === "VirtualText" && x.version === version;
            }
        }, { "./version": 30 }], 29: [function (require, module, exports) {
            module.exports = isWidget;

            function isWidget(w) {
                return w && w.type === "Widget";
            }
        }, {}], 30: [function (require, module, exports) {
            module.exports = "2";
        }, {}], 31: [function (require, module, exports) {
            var version = require("./version");
            var isVNode = require("./is-vnode");
            var isWidget = require("./is-widget");
            var isThunk = require("./is-thunk");
            var isVHook = require("./is-vhook");

            module.exports = VirtualNode;

            var noProperties = {};
            var noChildren = [];

            function VirtualNode(tagName, properties, children, key, namespace) {
                this.tagName = tagName;
                this.properties = properties || noProperties;
                this.children = children || noChildren;
                this.key = key != null ? String(key) : undefined;
                this.namespace = typeof namespace === "string" ? namespace : null;

                var count = children && children.length || 0;
                var descendants = 0;
                var hasWidgets = false;
                var hasThunks = false;
                var descendantHooks = false;
                var hooks;

                for (var propName in properties) {
                    if (properties.hasOwnProperty(propName)) {
                        var property = properties[propName];
                        if (isVHook(property) && property.unhook) {
                            if (!hooks) {
                                hooks = {};
                            }

                            hooks[propName] = property;
                        }
                    }
                }

                for (var i = 0; i < count; i++) {
                    var child = children[i];
                    if (isVNode(child)) {
                        descendants += child.count || 0;

                        if (!hasWidgets && child.hasWidgets) {
                            hasWidgets = true;
                        }

                        if (!hasThunks && child.hasThunks) {
                            hasThunks = true;
                        }

                        if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                            descendantHooks = true;
                        }
                    } else if (!hasWidgets && isWidget(child)) {
                        if (typeof child.destroy === "function") {
                            hasWidgets = true;
                        }
                    } else if (!hasThunks && isThunk(child)) {
                        hasThunks = true;
                    }
                }

                this.count = count + descendants;
                this.hasWidgets = hasWidgets;
                this.hasThunks = hasThunks;
                this.hooks = hooks;
                this.descendantHooks = descendantHooks;
            }

            VirtualNode.prototype.version = version;
            VirtualNode.prototype.type = "VirtualNode";
        }, { "./is-thunk": 25, "./is-vhook": 26, "./is-vnode": 27, "./is-widget": 29, "./version": 30 }], 32: [function (require, module, exports) {
            var version = require("./version");

            VirtualPatch.NONE = 0;
            VirtualPatch.VTEXT = 1;
            VirtualPatch.VNODE = 2;
            VirtualPatch.WIDGET = 3;
            VirtualPatch.PROPS = 4;
            VirtualPatch.ORDER = 5;
            VirtualPatch.INSERT = 6;
            VirtualPatch.REMOVE = 7;
            VirtualPatch.THUNK = 8;

            module.exports = VirtualPatch;

            function VirtualPatch(type, vNode, patch) {
                this.type = Number(type);
                this.vNode = vNode;
                this.patch = patch;
            }

            VirtualPatch.prototype.version = version;
            VirtualPatch.prototype.type = "VirtualPatch";
        }, { "./version": 30 }], 33: [function (require, module, exports) {
            var version = require("./version");

            module.exports = VirtualText;

            function VirtualText(text) {
                this.text = String(text);
            }

            VirtualText.prototype.version = version;
            VirtualText.prototype.type = "VirtualText";
        }, { "./version": 30 }], 34: [function (require, module, exports) {
            var isObject = require("is-object");
            var isHook = require("../vnode/is-vhook");

            module.exports = diffProps;

            function diffProps(a, b) {
                var diff;

                for (var aKey in a) {
                    if (!(aKey in b)) {
                        diff = diff || {};
                        diff[aKey] = undefined;
                    }

                    var aValue = a[aKey];
                    var bValue = b[aKey];

                    if (aValue === bValue) {
                        continue;
                    } else if (isObject(aValue) && isObject(bValue)) {
                        if (getPrototype(bValue) !== getPrototype(aValue)) {
                            diff = diff || {};
                            diff[aKey] = bValue;
                        } else if (isHook(bValue)) {
                            diff = diff || {};
                            diff[aKey] = bValue;
                        } else {
                            var objectDiff = diffProps(aValue, bValue);
                            if (objectDiff) {
                                diff = diff || {};
                                diff[aKey] = objectDiff;
                            }
                        }
                    } else {
                        diff = diff || {};
                        diff[aKey] = bValue;
                    }
                }

                for (var bKey in b) {
                    if (!(bKey in a)) {
                        diff = diff || {};
                        diff[bKey] = b[bKey];
                    }
                }

                return diff;
            }

            function getPrototype(value) {
                if (Object.getPrototypeOf) {
                    return Object.getPrototypeOf(value);
                } else if (value.__proto__) {
                    return value.__proto__;
                } else if (value.constructor) {
                    return value.constructor.prototype;
                }
            }
        }, { "../vnode/is-vhook": 26, "is-object": 11 }], 35: [function (require, module, exports) {
            var isArray = require("x-is-array");

            var VPatch = require("../vnode/vpatch");
            var isVNode = require("../vnode/is-vnode");
            var isVText = require("../vnode/is-vtext");
            var isWidget = require("../vnode/is-widget");
            var isThunk = require("../vnode/is-thunk");
            var handleThunk = require("../vnode/handle-thunk");

            var diffProps = require("./diff-props");

            module.exports = diff;

            function diff(a, b) {
                var patch = { a: a };
                walk(a, b, patch, 0);
                return patch;
            }

            function walk(a, b, patch, index) {
                if (a === b) {
                    return;
                }

                var apply = patch[index];
                var applyClear = false;

                if (isThunk(a) || isThunk(b)) {
                    thunks(a, b, patch, index);
                } else if (b == null) {

                    // If a is a widget we will add a remove patch for it
                    // Otherwise any child widgets/hooks must be destroyed.
                    // This prevents adding two remove patches for a widget.
                    if (!isWidget(a)) {
                        clearState(a, patch, index);
                        apply = patch[index];
                    }

                    apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b));
                } else if (isVNode(b)) {
                    if (isVNode(a)) {
                        if (a.tagName === b.tagName && a.namespace === b.namespace && a.key === b.key) {
                            var propsPatch = diffProps(a.properties, b.properties);
                            if (propsPatch) {
                                apply = appendPatch(apply, new VPatch(VPatch.PROPS, a, propsPatch));
                            }
                            apply = diffChildren(a, b, patch, apply, index);
                        } else {
                            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b));
                            applyClear = true;
                        }
                    } else {
                        apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b));
                        applyClear = true;
                    }
                } else if (isVText(b)) {
                    if (!isVText(a)) {
                        apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b));
                        applyClear = true;
                    } else if (a.text !== b.text) {
                        apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b));
                    }
                } else if (isWidget(b)) {
                    if (!isWidget(a)) {
                        applyClear = true;
                    }

                    apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b));
                }

                if (apply) {
                    patch[index] = apply;
                }

                if (applyClear) {
                    clearState(a, patch, index);
                }
            }

            function diffChildren(a, b, patch, apply, index) {
                var aChildren = a.children;
                var orderedSet = reorder(aChildren, b.children);
                var bChildren = orderedSet.children;

                var aLen = aChildren.length;
                var bLen = bChildren.length;
                var len = aLen > bLen ? aLen : bLen;

                for (var i = 0; i < len; i++) {
                    var leftNode = aChildren[i];
                    var rightNode = bChildren[i];
                    index += 1;

                    if (!leftNode) {
                        if (rightNode) {
                            // Excess nodes in b need to be added
                            apply = appendPatch(apply, new VPatch(VPatch.INSERT, null, rightNode));
                        }
                    } else {
                        walk(leftNode, rightNode, patch, index);
                    }

                    if (isVNode(leftNode) && leftNode.count) {
                        index += leftNode.count;
                    }
                }

                if (orderedSet.moves) {
                    // Reorder nodes last
                    apply = appendPatch(apply, new VPatch(VPatch.ORDER, a, orderedSet.moves));
                }

                return apply;
            }

            function clearState(vNode, patch, index) {
                // TODO: Make this a single walk, not two
                unhook(vNode, patch, index);
                destroyWidgets(vNode, patch, index);
            }

            // Patch records for all destroyed widgets must be added because we need
            // a DOM node reference for the destroy function
            function destroyWidgets(vNode, patch, index) {
                if (isWidget(vNode)) {
                    if (typeof vNode.destroy === "function") {
                        patch[index] = appendPatch(patch[index], new VPatch(VPatch.REMOVE, vNode, null));
                    }
                } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
                    var children = vNode.children;
                    var len = children.length;
                    for (var i = 0; i < len; i++) {
                        var child = children[i];
                        index += 1;

                        destroyWidgets(child, patch, index);

                        if (isVNode(child) && child.count) {
                            index += child.count;
                        }
                    }
                } else if (isThunk(vNode)) {
                    thunks(vNode, null, patch, index);
                }
            }

            // Create a sub-patch for thunks
            function thunks(a, b, patch, index) {
                var nodes = handleThunk(a, b);
                var thunkPatch = diff(nodes.a, nodes.b);
                if (hasPatches(thunkPatch)) {
                    patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch);
                }
            }

            function hasPatches(patch) {
                for (var index in patch) {
                    if (index !== "a") {
                        return true;
                    }
                }

                return false;
            }

            // Execute hooks when two nodes are identical
            function unhook(vNode, patch, index) {
                if (isVNode(vNode)) {
                    if (vNode.hooks) {
                        patch[index] = appendPatch(patch[index], new VPatch(VPatch.PROPS, vNode, undefinedKeys(vNode.hooks)));
                    }

                    if (vNode.descendantHooks || vNode.hasThunks) {
                        var children = vNode.children;
                        var len = children.length;
                        for (var i = 0; i < len; i++) {
                            var child = children[i];
                            index += 1;

                            unhook(child, patch, index);

                            if (isVNode(child) && child.count) {
                                index += child.count;
                            }
                        }
                    }
                } else if (isThunk(vNode)) {
                    thunks(vNode, null, patch, index);
                }
            }

            function undefinedKeys(obj) {
                var result = {};

                for (var key in obj) {
                    result[key] = undefined;
                }

                return result;
            }

            // List diff, naive left to right reordering
            function reorder(aChildren, bChildren) {
                // O(M) time, O(M) memory
                var bChildIndex = keyIndex(bChildren);
                var bKeys = bChildIndex.keys;
                var bFree = bChildIndex.free;

                if (bFree.length === bChildren.length) {
                    return {
                        children: bChildren,
                        moves: null
                    };
                }

                // O(N) time, O(N) memory
                var aChildIndex = keyIndex(aChildren);
                var aKeys = aChildIndex.keys;
                var aFree = aChildIndex.free;

                if (aFree.length === aChildren.length) {
                    return {
                        children: bChildren,
                        moves: null
                    };
                }

                // O(MAX(N, M)) memory
                var newChildren = [];

                var freeIndex = 0;
                var freeCount = bFree.length;
                var deletedItems = 0;

                // Iterate through a and match a node in b
                // O(N) time,
                for (var i = 0; i < aChildren.length; i++) {
                    var aItem = aChildren[i];
                    var itemIndex;

                    if (aItem.key) {
                        if (bKeys.hasOwnProperty(aItem.key)) {
                            // Match up the old keys
                            itemIndex = bKeys[aItem.key];
                            newChildren.push(bChildren[itemIndex]);
                        } else {
                            // Remove old keyed items
                            itemIndex = i - deletedItems++;
                            newChildren.push(null);
                        }
                    } else {
                        // Match the item in a with the next free item in b
                        if (freeIndex < freeCount) {
                            itemIndex = bFree[freeIndex++];
                            newChildren.push(bChildren[itemIndex]);
                        } else {
                            // There are no free items in b to match with
                            // the free items in a, so the extra free nodes
                            // are deleted.
                            itemIndex = i - deletedItems++;
                            newChildren.push(null);
                        }
                    }
                }

                var lastFreeIndex = freeIndex >= bFree.length ? bChildren.length : bFree[freeIndex];

                // Iterate through b and append any new keys
                // O(M) time
                for (var j = 0; j < bChildren.length; j++) {
                    var newItem = bChildren[j];

                    if (newItem.key) {
                        if (!aKeys.hasOwnProperty(newItem.key)) {
                            // Add any new keyed items
                            // We are adding new items to the end and then sorting them
                            // in place. In future we should insert new items in place.
                            newChildren.push(newItem);
                        }
                    } else if (j >= lastFreeIndex) {
                        // Add any leftover non-keyed items
                        newChildren.push(newItem);
                    }
                }

                var simulate = newChildren.slice();
                var simulateIndex = 0;
                var removes = [];
                var inserts = [];
                var simulateItem;

                for (var k = 0; k < bChildren.length;) {
                    var wantedItem = bChildren[k];
                    simulateItem = simulate[simulateIndex];

                    // remove items
                    while (simulateItem === null && simulate.length) {
                        removes.push(remove(simulate, simulateIndex, null));
                        simulateItem = simulate[simulateIndex];
                    }

                    if (!simulateItem || simulateItem.key !== wantedItem.key) {
                        // if we need a key in this position...
                        if (wantedItem.key) {
                            if (simulateItem && simulateItem.key) {
                                // if an insert doesn't put this key in place, it needs to move
                                if (bKeys[simulateItem.key] !== k + 1) {
                                    removes.push(remove(simulate, simulateIndex, simulateItem.key));
                                    simulateItem = simulate[simulateIndex];
                                    // if the remove didn't put the wanted item in place, we need to insert it
                                    if (!simulateItem || simulateItem.key !== wantedItem.key) {
                                        inserts.push({ key: wantedItem.key, to: k });
                                    }
                                    // items are matching, so skip ahead
                                    else {
                                        simulateIndex++;
                                    }
                                } else {
                                    inserts.push({ key: wantedItem.key, to: k });
                                }
                            } else {
                                inserts.push({ key: wantedItem.key, to: k });
                            }
                            k++;
                        }
                        // a key in simulate has no matching wanted key, remove it
                        else if (simulateItem && simulateItem.key) {
                            removes.push(remove(simulate, simulateIndex, simulateItem.key));
                        }
                    } else {
                        simulateIndex++;
                        k++;
                    }
                }

                // remove all the remaining nodes from simulate
                while (simulateIndex < simulate.length) {
                    simulateItem = simulate[simulateIndex];
                    removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key));
                }

                // If the only moves we have are deletes then we can just
                // let the delete patch remove these items.
                if (removes.length === deletedItems && !inserts.length) {
                    return {
                        children: newChildren,
                        moves: null
                    };
                }

                return {
                    children: newChildren,
                    moves: {
                        removes: removes,
                        inserts: inserts
                    }
                };
            }

            function remove(arr, index, key) {
                arr.splice(index, 1);

                return {
                    from: index,
                    key: key
                };
            }

            function keyIndex(children) {
                var keys = {};
                var free = [];
                var length = children.length;

                for (var i = 0; i < length; i++) {
                    var child = children[i];

                    if (child.key) {
                        keys[child.key] = i;
                    } else {
                        free.push(i);
                    }
                }

                return {
                    keys: keys, // A hash of key name to index
                    free: free // An array of unkeyed item indices
                };
            }

            function appendPatch(apply, patch) {
                if (apply) {
                    if (isArray(apply)) {
                        apply.push(patch);
                    } else {
                        apply = [apply, patch];
                    }

                    return apply;
                } else {
                    return patch;
                }
            }
        }, { "../vnode/handle-thunk": 24, "../vnode/is-thunk": 25, "../vnode/is-vnode": 27, "../vnode/is-vtext": 28, "../vnode/is-widget": 29, "../vnode/vpatch": 32, "./diff-props": 34, "x-is-array": 12 }] }, {}, [4])(4);
});


// Proposed for ES6

const start = function (domRoot, renderFn, initialState, options = []) {
  const name = Keyword.has_key__qm__(options, Kernel.SpecialForms.atom('name')) ? Keyword.get(options, Kernel.SpecialForms.atom('name')) : Symbol();

  self.post_office.add_mailbox(name);

  const tree = renderFn.apply(this, initialState);
  const rootNode = virtualDom.create(tree);

  domRoot.appendChild(rootNode);
  self.post_office.send(name, Kernel.SpecialForms.tuple(rootNode, tree, renderFn));

  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('ok'), name);
};

const stop = function (agent, timeout = 5000) {
  self.post_office.remove_mailbox(agent);
  return Kernel.SpecialForms.atom('ok');
};

const render = function (agent, state) {

  const current_state = self.post_office.receive(agent);

  let rootNode = Kernel.elem(current_state, 0);
  let tree = Kernel.elem(current_state, 1);
  let renderFn = Kernel.elem(current_state, 2);

  let newTree = renderFn.apply(this, state);

  let patches = virtualDom.diff(tree, newTree);
  rootNode = virtualDom.patch(rootNode, patches);

  self.post_office.send(agent, Kernel.SpecialForms.tuple(rootNode, newTree, renderFn));

  return Kernel.SpecialForms.atom('ok');
};

var View = {
  start,
  stop,
  render
};

self.post_office = self.post_office || new PostOffice();

export { _Patterns as Patterns, BitString, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, Base, _String as String, Bitwise, Enumerable, Collectable, Inspect, _Map as Map, _Set as Set, MapSet, IntegerType, FloatType, virtualDom as VirtualDOM, View };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJlbGl4aXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIFBhdHRlcm5zID0ge1xuICAgIGdldCBkZWZhdWx0ICgpIHsgcmV0dXJuIF9QYXR0ZXJuczsgfVxufTtcblxuY2xhc3MgVHVwbGUge1xuXG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICB0aGlzLnZhbHVlcyA9IE9iamVjdC5mcmVlemUoYXJncyk7XG4gIH1cblxuICBnZXQoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICB9XG5cbiAgY291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmxlbmd0aDtcbiAgfVxuXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlc1tTeW1ib2wuaXRlcmF0b3JdKCk7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICB2YXIgaSxcbiAgICAgICAgcyA9IFwiXCI7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMudmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocyAhPT0gXCJcIikge1xuICAgICAgICBzICs9IFwiLCBcIjtcbiAgICAgIH1cbiAgICAgIHMgKz0gdGhpcy52YWx1ZXNbaV0udG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJ7XCIgKyBzICsgXCJ9XCI7XG4gIH1cblxuICBzdGF0aWMgdG9fc3RyaW5nKHR1cGxlKSB7XG4gICAgcmV0dXJuIHR1cGxlLnRvU3RyaW5nKCk7XG4gIH1cblxuICBzdGF0aWMgZGVsZXRlX2F0KHR1cGxlLCBpbmRleCkge1xuICAgIGxldCBuZXdfbGlzdCA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0dXBsZS5jb3VudCgpOyBpKyspIHtcbiAgICAgIGlmIChpICE9PSBpbmRleCkge1xuICAgICAgICBuZXdfbGlzdC5wdXNoKHR1cGxlLmdldChpKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUuYXBwbHkobnVsbCwgbmV3X2xpc3QpO1xuICB9XG5cbiAgc3RhdGljIGR1cGxpY2F0ZShkYXRhLCBzaXplKSB7XG4gICAgbGV0IGFycmF5ID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gc2l6ZSAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBhcnJheS5wdXNoKGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlLmFwcGx5KG51bGwsIGFycmF5KTtcbiAgfVxuXG4gIHN0YXRpYyBpbnNlcnRfYXQodHVwbGUsIGluZGV4LCB0ZXJtKSB7XG4gICAgbGV0IG5ld190dXBsZSA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gdHVwbGUuY291bnQoKTsgaSsrKSB7XG4gICAgICBpZiAoaSA9PT0gaW5kZXgpIHtcbiAgICAgICAgbmV3X3R1cGxlLnB1c2godGVybSk7XG4gICAgICAgIGkrKztcbiAgICAgICAgbmV3X3R1cGxlLnB1c2godHVwbGUuZ2V0KGkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld190dXBsZS5wdXNoKHR1cGxlLmdldChpKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUuYXBwbHkobnVsbCwgbmV3X3R1cGxlKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tX2xpc3QobGlzdCkge1xuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlLmFwcGx5KG51bGwsIGxpc3QpO1xuICB9XG5cbiAgc3RhdGljIHRvX2xpc3QodHVwbGUpIHtcbiAgICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHVwbGUuY291bnQoKTsgaSsrKSB7XG4gICAgICBuZXdfbGlzdC5wdXNoKHR1cGxlLmdldChpKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfbGlzdCk7XG4gIH1cbn1cblxuLyogQGZsb3cgKi9cblxuY2xhc3MgVmFyaWFibGUge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUgPSBudWxsKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgfVxufVxuXG5jbGFzcyBXaWxkY2FyZCB7XG4gIGNvbnN0cnVjdG9yKCkge31cbn1cblxuY2xhc3MgU3RhcnRzV2l0aCB7XG5cbiAgY29uc3RydWN0b3IocHJlZml4KSB7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXg7XG4gIH1cbn1cblxuY2xhc3MgQ2FwdHVyZSB7XG5cbiAgY29uc3RydWN0b3IodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cblxuY2xhc3MgSGVhZFRhaWwge1xuICBjb25zdHJ1Y3RvcigpIHt9XG59XG5cbmNsYXNzIFR5cGUge1xuXG4gIGNvbnN0cnVjdG9yKHR5cGUsIG9ialBhdHRlcm4gPSB7fSkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5vYmpQYXR0ZXJuID0gb2JqUGF0dGVybjtcbiAgfVxufVxuXG5jbGFzcyBCb3VuZCB7XG5cbiAgY29uc3RydWN0b3IodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFyaWFibGUobmFtZSA9IG51bGwpIHtcbiAgcmV0dXJuIG5ldyBWYXJpYWJsZShuYW1lKTtcbn1cblxuZnVuY3Rpb24gd2lsZGNhcmQoKSB7XG4gIHJldHVybiBuZXcgV2lsZGNhcmQoKTtcbn1cblxuZnVuY3Rpb24gc3RhcnRzV2l0aChwcmVmaXgpIHtcbiAgcmV0dXJuIG5ldyBTdGFydHNXaXRoKHByZWZpeCk7XG59XG5cbmZ1bmN0aW9uIGNhcHR1cmUodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBDYXB0dXJlKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gaGVhZFRhaWwoKSB7XG4gIHJldHVybiBuZXcgSGVhZFRhaWwoKTtcbn1cblxuZnVuY3Rpb24gdHlwZSh0eXBlLCBvYmpQYXR0ZXJuID0ge30pIHtcbiAgcmV0dXJuIG5ldyBUeXBlKHR5cGUsIG9ialBhdHRlcm4pO1xufVxuXG5mdW5jdGlvbiBib3VuZCh2YWx1ZSkge1xuICByZXR1cm4gbmV3IEJvdW5kKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gX2lzX251bWJlcih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNfc3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xufVxuXG5mdW5jdGlvbiBfaXNfdHVwbGUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgVHVwbGU7XG59XG5cbmZ1bmN0aW9uIF9pc19ib29sZWFuKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJztcbn1cblxuZnVuY3Rpb24gaXNfc3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzeW1ib2wnO1xufVxuXG5mdW5jdGlvbiBpc19udWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNfdW5kZWZpbmVkKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnO1xufVxuXG5mdW5jdGlvbiBfaXNfZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn1cblxuZnVuY3Rpb24gaXNfdmFyaWFibGUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgVmFyaWFibGU7XG59XG5cbmZ1bmN0aW9uIGlzX3dpbGRjYXJkKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFdpbGRjYXJkO1xufVxuXG5mdW5jdGlvbiBpc19oZWFkVGFpbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBIZWFkVGFpbDtcbn1cblxuZnVuY3Rpb24gaXNfY2FwdHVyZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBDYXB0dXJlO1xufVxuXG5mdW5jdGlvbiBpc190eXBlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFR5cGU7XG59XG5cbmZ1bmN0aW9uIGlzX3N0YXJ0c1dpdGgodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgU3RhcnRzV2l0aDtcbn1cblxuZnVuY3Rpb24gaXNfYm91bmQodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQm91bmQ7XG59XG5cbmZ1bmN0aW9uIGlzX29iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jztcbn1cblxuZnVuY3Rpb24gaXNfYXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG52YXIgQ2hlY2tzID0ge1xuICBpc19udW1iZXI6IF9pc19udW1iZXIsXG4gIGlzX3N0cmluZyxcbiAgaXNfYm9vbGVhbjogX2lzX2Jvb2xlYW4sXG4gIGlzX3N5bWJvbCxcbiAgaXNfbnVsbCxcbiAgaXNfdW5kZWZpbmVkLFxuICBpc19mdW5jdGlvbjogX2lzX2Z1bmN0aW9uLFxuICBpc192YXJpYWJsZSxcbiAgaXNfd2lsZGNhcmQsXG4gIGlzX2hlYWRUYWlsLFxuICBpc19jYXB0dXJlLFxuICBpc190eXBlLFxuICBpc19zdGFydHNXaXRoLFxuICBpc19ib3VuZCxcbiAgaXNfb2JqZWN0LFxuICBpc19hcnJheSxcbiAgaXNfdHVwbGU6IF9pc190dXBsZVxufTtcblxuZnVuY3Rpb24gcmVzb2x2ZVR1cGxlKHBhdHRlcm4pIHtcbiAgbGV0IG1hdGNoZXMgPSBbXTtcblxuICBmb3IgKGxldCBlbGVtIG9mIHBhdHRlcm4pIHtcbiAgICBtYXRjaGVzLnB1c2goYnVpbGRNYXRjaChlbGVtKSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKCFDaGVja3MuaXNfdHVwbGUodmFsdWUpIHx8IHZhbHVlLmNvdW50KCkgIT0gcGF0dGVybi5jb3VudCgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlLnZhbHVlcy5ldmVyeShmdW5jdGlvbiAodiwgaSkge1xuICAgICAgcmV0dXJuIG1hdGNoZXNbaV0odmFsdWUuZ2V0KGkpLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN5bWJvbChwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX3N5bWJvbCh2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHJpbmcocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19zdHJpbmcodmFsdWUpICYmIHZhbHVlID09PSBwYXR0ZXJuO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlTnVtYmVyKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfbnVtYmVyKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUJvb2xlYW4ocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19ib29sZWFuKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUZ1bmN0aW9uKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfZnVuY3Rpb24odmFsdWUpICYmIHZhbHVlID09PSBwYXR0ZXJuO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlTnVsbChwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX251bGwodmFsdWUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlQm91bmQocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gdHlwZW9mIHBhdHRlcm4udmFsdWUgJiYgdmFsdWUgPT09IHBhdHRlcm4udmFsdWUpIHtcbiAgICAgIGFyZ3MucHVzaCh2YWx1ZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVXaWxkY2FyZCgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVZhcmlhYmxlKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgYXJncy5wdXNoKHZhbHVlKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUhlYWRUYWlsKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKCFDaGVja3MuaXNfYXJyYXkodmFsdWUpIHx8IHZhbHVlLmxlbmd0aCA8IDIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkID0gdmFsdWVbMF07XG4gICAgY29uc3QgdGFpbCA9IHZhbHVlLnNsaWNlKDEpO1xuXG4gICAgYXJncy5wdXNoKGhlYWQpO1xuICAgIGFyZ3MucHVzaCh0YWlsKTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlQ2FwdHVyZShwYXR0ZXJuKSB7XG4gIGNvbnN0IG1hdGNoZXMgPSBidWlsZE1hdGNoKHBhdHRlcm4udmFsdWUpO1xuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAobWF0Y2hlcyh2YWx1ZSwgYXJncykpIHtcbiAgICAgIGFyZ3MucHVzaCh2YWx1ZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdGFydHNXaXRoKHBhdHRlcm4pIHtcbiAgY29uc3QgcHJlZml4ID0gcGF0dGVybi5wcmVmaXg7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmIChDaGVja3MuaXNfc3RyaW5nKHZhbHVlKSAmJiB2YWx1ZS5zdGFydHNXaXRoKHByZWZpeCkpIHtcbiAgICAgIGFyZ3MucHVzaCh2YWx1ZS5zdWJzdHJpbmcocHJlZml4Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlVHlwZShwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBwYXR0ZXJuLnR5cGUpIHtcbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBidWlsZE1hdGNoKHBhdHRlcm4ub2JqUGF0dGVybik7XG4gICAgICByZXR1cm4gbWF0Y2hlcyh2YWx1ZSwgYXJncykgJiYgYXJncy5wdXNoKHZhbHVlKSA+IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlQXJyYXkocGF0dGVybikge1xuICBjb25zdCBtYXRjaGVzID0gcGF0dGVybi5tYXAoeCA9PiBidWlsZE1hdGNoKHgpKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKCFDaGVja3MuaXNfYXJyYXkodmFsdWUpIHx8IHZhbHVlLmxlbmd0aCAhPSBwYXR0ZXJuLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZS5ldmVyeShmdW5jdGlvbiAodiwgaSkge1xuICAgICAgcmV0dXJuIG1hdGNoZXNbaV0odmFsdWVbaV0sIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlT2JqZWN0KHBhdHRlcm4pIHtcbiAgbGV0IG1hdGNoZXMgPSB7fTtcblxuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocGF0dGVybikpIHtcbiAgICBtYXRjaGVzW2tleV0gPSBidWlsZE1hdGNoKHBhdHRlcm5ba2V5XSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKCFDaGVja3MuaXNfb2JqZWN0KHZhbHVlKSB8fCBwYXR0ZXJuLmxlbmd0aCA+IHZhbHVlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhwYXR0ZXJuKSkge1xuICAgICAgaWYgKCEoa2V5IGluIHZhbHVlKSB8fCAhbWF0Y2hlc1trZXldKHZhbHVlW2tleV0sIGFyZ3MpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU5vTWF0Y2goKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG52YXIgUmVzb2x2ZXJzID0ge1xuICByZXNvbHZlQm91bmQsXG4gIHJlc29sdmVXaWxkY2FyZCxcbiAgcmVzb2x2ZVZhcmlhYmxlLFxuICByZXNvbHZlSGVhZFRhaWwsXG4gIHJlc29sdmVDYXB0dXJlLFxuICByZXNvbHZlU3RhcnRzV2l0aCxcbiAgcmVzb2x2ZVR5cGUsXG4gIHJlc29sdmVBcnJheSxcbiAgcmVzb2x2ZU9iamVjdCxcbiAgcmVzb2x2ZU5vTWF0Y2gsXG4gIHJlc29sdmVTeW1ib2wsXG4gIHJlc29sdmVTdHJpbmcsXG4gIHJlc29sdmVOdW1iZXIsXG4gIHJlc29sdmVCb29sZWFuLFxuICByZXNvbHZlRnVuY3Rpb24sXG4gIHJlc29sdmVOdWxsLFxuICByZXNvbHZlVHVwbGVcbn07XG5cbmZ1bmN0aW9uIGJ1aWxkTWF0Y2gocGF0dGVybikge1xuXG4gIGlmIChDaGVja3MuaXNfdHVwbGUocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVUdXBsZShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfdmFyaWFibGUocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVWYXJpYWJsZShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfd2lsZGNhcmQocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVXaWxkY2FyZChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfdW5kZWZpbmVkKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlV2lsZGNhcmQocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2hlYWRUYWlsKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlSGVhZFRhaWwocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3N0YXJ0c1dpdGgocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVTdGFydHNXaXRoKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19jYXB0dXJlKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlQ2FwdHVyZShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfYm91bmQocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVCb3VuZChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfdHlwZShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVR5cGUocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2FycmF5KHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlQXJyYXkocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX251bWJlcihwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZU51bWJlcihwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfc3RyaW5nKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlU3RyaW5nKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19ib29sZWFuKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlQm9vbGVhbihwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfc3ltYm9sKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlU3ltYm9sKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19udWxsKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlTnVsbChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfb2JqZWN0KHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlT2JqZWN0KHBhdHRlcm4pO1xuICB9XG5cbiAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlTm9NYXRjaCgpO1xufVxuXG5jbGFzcyBNYXRjaEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihhcmcpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnKSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSAnTm8gbWF0Y2ggZm9yOiAnICsgYXJnLnRvU3RyaW5nKCk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgIGxldCBtYXBwZWRWYWx1ZXMgPSBhcmcubWFwKHggPT4geC50b1N0cmluZygpKTtcbiAgICAgIHRoaXMubWVzc2FnZSA9ICdObyBtYXRjaCBmb3I6ICcgKyBtYXBwZWRWYWx1ZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9ICdObyBtYXRjaCBmb3I6ICcgKyBhcmc7XG4gICAgfVxuXG4gICAgdGhpcy5zdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrO1xuICAgIHRoaXMubmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgfVxufVxuXG5jbGFzcyBDYXNlIHtcblxuICBjb25zdHJ1Y3RvcihwYXR0ZXJuLCBmbiwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gYnVpbGRNYXRjaChwYXR0ZXJuKTtcbiAgICB0aGlzLmZuID0gZm47XG4gICAgdGhpcy5ndWFyZCA9IGd1YXJkO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VfY2FzZShwYXR0ZXJuLCBmbiwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIHJldHVybiBuZXcgQ2FzZShwYXR0ZXJuLCBmbiwgZ3VhcmQpO1xufVxuXG5mdW5jdGlvbiBkZWZtYXRjaCguLi5jYXNlcykge1xuICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBmb3IgKGxldCBwcm9jZXNzZWRDYXNlIG9mIGNhc2VzKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICBpZiAocHJvY2Vzc2VkQ2FzZS5wYXR0ZXJuKGFyZ3MsIHJlc3VsdCkgJiYgcHJvY2Vzc2VkQ2FzZS5ndWFyZC5hcHBseSh0aGlzLCByZXN1bHQpKSB7XG4gICAgICAgIHJldHVybiBwcm9jZXNzZWRDYXNlLmZuLmFwcGx5KHRoaXMsIHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IE1hdGNoRXJyb3IoYXJncyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hdGNoKHBhdHRlcm4sIGV4cHIsIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICBsZXQgcmVzdWx0ID0gW107XG4gIGxldCBwcm9jZXNzZWRQYXR0ZXJuID0gYnVpbGRNYXRjaChwYXR0ZXJuKTtcbiAgaWYgKHByb2Nlc3NlZFBhdHRlcm4oZXhwciwgcmVzdWx0KSAmJiBndWFyZC5hcHBseSh0aGlzLCByZXN1bHQpKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgTWF0Y2hFcnJvcihleHByKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaF9ub190aHJvdyhwYXR0ZXJuLCBleHByLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gbWF0Y2gocGF0dGVybiwgZXhwciwgZ3VhcmQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBNYXRjaEVycm9yKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhdHRlcm5NYXAoY29sbGVjdGlvbiwgcGF0dGVybiwgZnVuLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgbGV0IHJldCA9IFtdO1xuXG4gIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzdWx0ID0gZnVuLmFwcGx5KHRoaXMsIG1hdGNoKHBhdHRlcm4sIGVsZW0sIGd1YXJkKSk7XG4gICAgICByZXQgPSByZXQuY29uY2F0KHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cblxudmFyIF9QYXR0ZXJucyA9IHtcbiAgZGVmbWF0Y2gsIG1hdGNoLCBNYXRjaEVycm9yLCBtYXRjaF9ub190aHJvdywgcGF0dGVybk1hcCxcbiAgdmFyaWFibGUsIHdpbGRjYXJkLCBzdGFydHNXaXRoLFxuICBjYXB0dXJlLCBoZWFkVGFpbCwgdHlwZSwgYm91bmQsIENhc2UsIG1ha2VfY2FzZVxufTtcblxuY2xhc3MgQml0U3RyaW5nIHtcbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHRoaXMucmF3X3ZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoYXJncyk7XG4gICAgfTtcblxuICAgIHRoaXMudmFsdWUgPSBPYmplY3QuZnJlZXplKHRoaXMucHJvY2VzcyhhcmdzKSk7XG4gIH1cblxuICBnZXQoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZVtpbmRleF07XG4gIH1cblxuICBjb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5sZW5ndGg7XG4gIH1cblxuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZVtTeW1ib2wuaXRlcmF0b3JdKCk7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICB2YXIgaSxcbiAgICAgICAgcyA9IFwiXCI7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuY291bnQoKTsgaSsrKSB7XG4gICAgICBpZiAocyAhPT0gXCJcIikge1xuICAgICAgICBzICs9IFwiLCBcIjtcbiAgICAgIH1cbiAgICAgIHMgKz0gdGhpc1tpXS50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHJldHVybiBcIjw8XCIgKyBzICsgXCI+PlwiO1xuICB9XG5cbiAgcHJvY2VzcygpIHtcbiAgICBsZXQgcHJvY2Vzc2VkX3ZhbHVlcyA9IFtdO1xuXG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMucmF3X3ZhbHVlKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBwcm9jZXNzZWRfdmFsdWUgPSB0aGlzW1wicHJvY2Vzc19cIiArIHRoaXMucmF3X3ZhbHVlKClbaV0udHlwZV0odGhpcy5yYXdfdmFsdWUoKVtpXSk7XG5cbiAgICAgIGZvciAobGV0IGF0dHIgb2YgdGhpcy5yYXdfdmFsdWUoKVtpXS5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIHByb2Nlc3NlZF92YWx1ZSA9IHRoaXNbXCJwcm9jZXNzX1wiICsgYXR0cl0ocHJvY2Vzc2VkX3ZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgcHJvY2Vzc2VkX3ZhbHVlcyA9IHByb2Nlc3NlZF92YWx1ZXMuY29uY2F0KHByb2Nlc3NlZF92YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2Nlc3NlZF92YWx1ZXM7XG4gIH1cblxuICBwcm9jZXNzX2ludGVnZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUudmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2Zsb2F0KHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlLnNpemUgPT09IDY0KSB7XG4gICAgICByZXR1cm4gQml0U3RyaW5nLmZsb2F0NjRUb0J5dGVzKHZhbHVlLnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlLnNpemUgPT09IDMyKSB7XG4gICAgICByZXR1cm4gQml0U3RyaW5nLmZsb2F0MzJUb0J5dGVzKHZhbHVlLnZhbHVlKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHNpemUgZm9yIGZsb2F0XCIpO1xuICB9XG5cbiAgcHJvY2Vzc19iaXRzdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUudmFsdWUudmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2JpbmFyeSh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcudG9VVEY4QXJyYXkodmFsdWUudmFsdWUpO1xuICB9XG5cbiAgcHJvY2Vzc191dGY4KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjhBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3V0ZjE2KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjE2QXJyYXkodmFsdWUudmFsdWUpO1xuICB9XG5cbiAgcHJvY2Vzc191dGYzMih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcudG9VVEYzMkFycmF5KHZhbHVlLnZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3Nfc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFt2YWx1ZV0pWzBdO1xuICB9XG5cbiAgcHJvY2Vzc191bnNpZ25lZCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfbmF0aXZlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc19iaWcodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2xpdHRsZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXZlcnNlKCk7XG4gIH1cblxuICBwcm9jZXNzX3NpemUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX3VuaXQodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBzdGF0aWMgaW50ZWdlcih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJpbnRlZ2VyXCIsIFwidW5pdFwiOiAxLCBcInNpemVcIjogOCB9KTtcbiAgfVxuXG4gIHN0YXRpYyBmbG9hdCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJmbG9hdFwiLCBcInVuaXRcIjogMSwgXCJzaXplXCI6IDY0IH0pO1xuICB9XG5cbiAgc3RhdGljIGJpdHN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJiaXRzdHJpbmdcIiwgXCJ1bml0XCI6IDEsIFwic2l6ZVwiOiB2YWx1ZS5sZW5ndGggfSk7XG4gIH1cblxuICBzdGF0aWMgYml0cyh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcuYml0c3RyaW5nKHZhbHVlKTtcbiAgfVxuXG4gIHN0YXRpYyBiaW5hcnkodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwiYmluYXJ5XCIsIFwidW5pdFwiOiA4LCBcInNpemVcIjogdmFsdWUubGVuZ3RoIH0pO1xuICB9XG5cbiAgc3RhdGljIGJ5dGVzKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy5iaW5hcnkodmFsdWUpO1xuICB9XG5cbiAgc3RhdGljIHV0ZjgodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwidXRmOFwiIH0pO1xuICB9XG5cbiAgc3RhdGljIHV0ZjE2KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcInV0ZjE2XCIgfSk7XG4gIH1cblxuICBzdGF0aWMgdXRmMzIodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwidXRmMzJcIiB9KTtcbiAgfVxuXG4gIHN0YXRpYyBzaWduZWQodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcInNpZ25lZFwiKTtcbiAgfVxuXG4gIHN0YXRpYyB1bnNpZ25lZCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwge30sIFwidW5zaWduZWRcIik7XG4gIH1cblxuICBzdGF0aWMgbmF0aXZlKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJuYXRpdmVcIik7XG4gIH1cblxuICBzdGF0aWMgYmlnKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJiaWdcIik7XG4gIH1cblxuICBzdGF0aWMgbGl0dGxlKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJsaXR0bGVcIik7XG4gIH1cblxuICBzdGF0aWMgc2l6ZSh2YWx1ZSwgY291bnQpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJzaXplXCI6IGNvdW50IH0pO1xuICB9XG5cbiAgc3RhdGljIHVuaXQodmFsdWUsIGNvdW50KSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidW5pdFwiOiBjb3VudCB9KTtcbiAgfVxuXG4gIHN0YXRpYyB3cmFwKHZhbHVlLCBvcHQsIG5ld19hdHRyaWJ1dGUgPSBudWxsKSB7XG4gICAgbGV0IHRoZV92YWx1ZSA9IHZhbHVlO1xuXG4gICAgaWYgKCEodmFsdWUgaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICB0aGVfdmFsdWUgPSB7IFwidmFsdWVcIjogdmFsdWUsIFwiYXR0cmlidXRlc1wiOiBbXSB9O1xuICAgIH1cblxuICAgIHRoZV92YWx1ZSA9IE9iamVjdC5hc3NpZ24odGhlX3ZhbHVlLCBvcHQpO1xuXG4gICAgaWYgKG5ld19hdHRyaWJ1dGUpIHtcbiAgICAgIHRoZV92YWx1ZS5hdHRyaWJ1dGVzLnB1c2gobmV3X2F0dHJpYnV0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoZV92YWx1ZTtcbiAgfVxuXG4gIHN0YXRpYyB0b1VURjhBcnJheShzdHIpIHtcbiAgICB2YXIgdXRmOCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hhcmNvZGUgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjaGFyY29kZSA8IDEyOCkge1xuICAgICAgICB1dGY4LnB1c2goY2hhcmNvZGUpO1xuICAgICAgfSBlbHNlIGlmIChjaGFyY29kZSA8IDIwNDgpIHtcbiAgICAgICAgdXRmOC5wdXNoKDE5MiB8IGNoYXJjb2RlID4+IDYsIDEyOCB8IGNoYXJjb2RlICYgNjMpO1xuICAgICAgfSBlbHNlIGlmIChjaGFyY29kZSA8IDU1Mjk2IHx8IGNoYXJjb2RlID49IDU3MzQ0KSB7XG4gICAgICAgIHV0ZjgucHVzaCgyMjQgfCBjaGFyY29kZSA+PiAxMiwgMTI4IHwgY2hhcmNvZGUgPj4gNiAmIDYzLCAxMjggfCBjaGFyY29kZSAmIDYzKTtcbiAgICAgIH1cbiAgICAgIC8vIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBlbHNlIHtcbiAgICAgICAgaSsrO1xuICAgICAgICAvLyBVVEYtMTYgZW5jb2RlcyAweDEwMDAwLTB4MTBGRkZGIGJ5XG4gICAgICAgIC8vIHN1YnRyYWN0aW5nIDB4MTAwMDAgYW5kIHNwbGl0dGluZyB0aGVcbiAgICAgICAgLy8gMjAgYml0cyBvZiAweDAtMHhGRkZGRiBpbnRvIHR3byBoYWx2ZXNcbiAgICAgICAgY2hhcmNvZGUgPSA2NTUzNiArICgoY2hhcmNvZGUgJiAxMDIzKSA8PCAxMCB8IHN0ci5jaGFyQ29kZUF0KGkpICYgMTAyMyk7XG4gICAgICAgIHV0ZjgucHVzaCgyNDAgfCBjaGFyY29kZSA+PiAxOCwgMTI4IHwgY2hhcmNvZGUgPj4gMTIgJiA2MywgMTI4IHwgY2hhcmNvZGUgPj4gNiAmIDYzLCAxMjggfCBjaGFyY29kZSAmIDYzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHV0Zjg7XG4gIH1cblxuICBzdGF0aWMgdG9VVEYxNkFycmF5KHN0cikge1xuICAgIHZhciB1dGYxNiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY29kZVBvaW50ID0gc3RyLmNvZGVQb2ludEF0KGkpO1xuXG4gICAgICBpZiAoY29kZVBvaW50IDw9IDI1NSkge1xuICAgICAgICB1dGYxNi5wdXNoKDApO1xuICAgICAgICB1dGYxNi5wdXNoKGNvZGVQb2ludCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1dGYxNi5wdXNoKGNvZGVQb2ludCA+PiA4ICYgMjU1KTtcbiAgICAgICAgdXRmMTYucHVzaChjb2RlUG9pbnQgJiAyNTUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXRmMTY7XG4gIH1cblxuICBzdGF0aWMgdG9VVEYzMkFycmF5KHN0cikge1xuICAgIHZhciB1dGYzMiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY29kZVBvaW50ID0gc3RyLmNvZGVQb2ludEF0KGkpO1xuXG4gICAgICBpZiAoY29kZVBvaW50IDw9IDI1NSkge1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKGNvZGVQb2ludCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKGNvZGVQb2ludCA+PiA4ICYgMjU1KTtcbiAgICAgICAgdXRmMzIucHVzaChjb2RlUG9pbnQgJiAyNTUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXRmMzI7XG4gIH1cblxuICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjAwMzQ5My9qYXZhc2NyaXB0LWZsb2F0LWZyb20tdG8tYml0c1xuICBzdGF0aWMgZmxvYXQzMlRvQnl0ZXMoZikge1xuICAgIHZhciBieXRlcyA9IFtdO1xuXG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcig0KTtcbiAgICBuZXcgRmxvYXQzMkFycmF5KGJ1ZilbMF0gPSBmO1xuXG4gICAgbGV0IGludFZlcnNpb24gPSBuZXcgVWludDMyQXJyYXkoYnVmKVswXTtcblxuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbiA+PiAyNCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uID4+IDE2ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gPj4gOCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uICYgMjU1KTtcblxuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHN0YXRpYyBmbG9hdDY0VG9CeXRlcyhmKSB7XG4gICAgdmFyIGJ5dGVzID0gW107XG5cbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDgpO1xuICAgIG5ldyBGbG9hdDY0QXJyYXkoYnVmKVswXSA9IGY7XG5cbiAgICB2YXIgaW50VmVyc2lvbjEgPSBuZXcgVWludDMyQXJyYXkoYnVmKVswXTtcbiAgICB2YXIgaW50VmVyc2lvbjIgPSBuZXcgVWludDMyQXJyYXkoYnVmKVsxXTtcblxuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjIgPj4gMjQgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjIgPj4gMTYgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjIgPj4gOCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiAmIDI1NSk7XG5cbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24xID4+IDI0ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24xID4+IDE2ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24xID4+IDggJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgJiAyNTUpO1xuXG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG59XG5cbmxldCBTcGVjaWFsRm9ybXMgPSB7XG5cbiAgX19ESVJfXzogZnVuY3Rpb24gKCkge1xuICAgIGlmIChfX2Rpcm5hbWUpIHtcbiAgICAgIHJldHVybiBfX2Rpcm5hbWU7XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICBhdG9tOiBmdW5jdGlvbiAoX3ZhbHVlKSB7XG4gICAgcmV0dXJuIFN5bWJvbC5mb3IoX3ZhbHVlKTtcbiAgfSxcblxuICBsaXN0OiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIHJldHVybiBPYmplY3QuZnJlZXplKGFyZ3MpO1xuICB9LFxuXG4gIGJpdHN0cmluZzogZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IEJpdFN0cmluZyguLi5hcmdzKTtcbiAgfSxcblxuICBib3VuZDogZnVuY3Rpb24gKF92YXIpIHtcbiAgICByZXR1cm4gUGF0dGVybnMuYm91bmQoX3Zhcik7XG4gIH0sXG5cbiAgX2Nhc2U6IGZ1bmN0aW9uIChjb25kaXRpb24sIGNsYXVzZXMpIHtcbiAgICByZXR1cm4gUGF0dGVybnMuZGVmbWF0Y2goLi4uY2xhdXNlcykoY29uZGl0aW9uKTtcbiAgfSxcblxuICBjb25kOiBmdW5jdGlvbiAoY2xhdXNlcykge1xuICAgIGZvciAobGV0IGNsYXVzZSBvZiBjbGF1c2VzKSB7XG4gICAgICBpZiAoY2xhdXNlWzBdKSB7XG4gICAgICAgIHJldHVybiBjbGF1c2VbMV0oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgfSxcblxuICBmbjogZnVuY3Rpb24gKGNsYXVzZXMpIHtcbiAgICByZXR1cm4gUGF0dGVybnMuZGVmbWF0Y2goY2xhdXNlcyk7XG4gIH0sXG5cbiAgbWFwOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcmVlemUob2JqKTtcbiAgfSxcblxuICBtYXBfdXBkYXRlOiBmdW5jdGlvbiAobWFwLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobWFwLmNvbnN0cnVjdG9yLnByb3RvdHlwZSksIG1hcCwgdmFsdWVzKSk7XG4gIH0sXG5cbiAgX2ZvcjogZnVuY3Rpb24gKGNvbGxlY3Rpb25zLCBmdW4sIGZpbHRlciA9ICgpID0+IHRydWUsIGludG8gPSBbXSwgcHJldmlvdXNWYWx1ZXMgPSBbXSkge1xuICAgIGxldCBwYXR0ZXJuID0gY29sbGVjdGlvbnNbMF1bMF07XG4gICAgbGV0IGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uc1swXVsxXTtcblxuICAgIGlmIChjb2xsZWN0aW9ucy5sZW5ndGggPT09IDEpIHtcblxuICAgICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGxldCByID0gUGF0dGVybnMubWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZWxlbSk7XG4gICAgICAgIGxldCBhcmdzID0gcHJldmlvdXNWYWx1ZXMuY29uY2F0KHIpO1xuXG4gICAgICAgIGlmIChyICYmIGZpbHRlci5hcHBseSh0aGlzLCBhcmdzKSkge1xuICAgICAgICAgIGludG8gPSBFbnVtLmludG8oW2Z1bi5hcHBseSh0aGlzLCBhcmdzKV0sIGludG8pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpbnRvO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgX2ludG8gPSBbXTtcblxuICAgICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGxldCByID0gUGF0dGVybnMubWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZWxlbSk7XG4gICAgICAgIGlmIChyKSB7XG4gICAgICAgICAgX2ludG8gPSBFbnVtLmludG8odGhpcy5fZm9yKGNvbGxlY3Rpb25zLnNsaWNlKDEpLCBmdW4sIGZpbHRlciwgX2ludG8sIHByZXZpb3VzVmFsdWVzLmNvbmNhdChyKSksIGludG8pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfaW50bztcbiAgICB9XG4gIH0sXG5cbiAgcmVjZWl2ZTogZnVuY3Rpb24gKHJlY2VpdmVfZnVuLCB0aW1lb3V0X2luX21zID0gbnVsbCwgdGltZW91dF9mbiA9IHRpbWUgPT4gdHJ1ZSkge1xuICAgIGlmICh0aW1lb3V0X2luX21zID09IG51bGwgfHwgdGltZW91dF9pbl9tcyA9PT0gU3lzdGVtLmZvcignaW5maW5pdHknKSkge1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgaWYgKHNlbGYubWFpbGJveC5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICBsZXQgbWVzc2FnZSA9IHNlbGYubWFpbGJveFswXTtcbiAgICAgICAgICBzZWxmLm1haWxib3ggPSBzZWxmLm1haWxib3guc2xpY2UoMSk7XG4gICAgICAgICAgcmV0dXJuIHJlY2VpdmVfZnVuKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aW1lb3V0X2luX21zID09PSAwKSB7XG4gICAgICBpZiAoc2VsZi5tYWlsYm94Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICBsZXQgbWVzc2FnZSA9IHNlbGYubWFpbGJveFswXTtcbiAgICAgICAgc2VsZi5tYWlsYm94ID0gc2VsZi5tYWlsYm94LnNsaWNlKDEpO1xuICAgICAgICByZXR1cm4gcmVjZWl2ZV9mdW4obWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICB3aGlsZSAoRGF0ZS5ub3coKSA8IG5vdyArIHRpbWVvdXRfaW5fbXMpIHtcbiAgICAgICAgaWYgKHNlbGYubWFpbGJveC5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICBsZXQgbWVzc2FnZSA9IHNlbGYubWFpbGJveFswXTtcbiAgICAgICAgICBzZWxmLm1haWxib3ggPSBzZWxmLm1haWxib3guc2xpY2UoMSk7XG4gICAgICAgICAgcmV0dXJuIHJlY2VpdmVfZnVuKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aW1lb3V0X2ZuKHRpbWVvdXRfaW5fbXMpO1xuICAgIH1cbiAgfSxcblxuICB0dXBsZTogZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IFR1cGxlKC4uLmFyZ3MpO1xuICB9LFxuXG4gIF90cnk6IGZ1bmN0aW9uIChkb19mdW4sIHJlc2N1ZV9mdW5jdGlvbiwgY2F0Y2hfZnVuLCBlbHNlX2Z1bmN0aW9uLCBhZnRlcl9mdW5jdGlvbikge1xuICAgIGxldCByZXN1bHQgPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlc3VsdCA9IGRvX2Z1bigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxldCBleF9yZXN1bHQgPSBudWxsO1xuXG4gICAgICBpZiAocmVzY3VlX2Z1bmN0aW9uKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXhfcmVzdWx0ID0gcmVzY3VlX2Z1bmN0aW9uKGUpO1xuICAgICAgICAgIHJldHVybiBleF9yZXN1bHQ7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgaWYgKGV4IGluc3RhbmNlb2YgUGF0dGVybnMuTWF0Y2hFcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjYXRjaF9mdW4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBleF9yZXN1bHQgPSBjYXRjaF9mdW4oZSk7XG4gICAgICAgICAgcmV0dXJuIGV4X3Jlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBpZiAoZXggaW5zdGFuY2VvZiBQYXR0ZXJucy5NYXRjaEVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhyb3cgZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGFmdGVyX2Z1bmN0aW9uKSB7XG4gICAgICAgIGFmdGVyX2Z1bmN0aW9uKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVsc2VfZnVuY3Rpb24pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBlbHNlX2Z1bmN0aW9uKHJlc3VsdCk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBpZiAoZXggaW5zdGFuY2VvZiBQYXR0ZXJucy5NYXRjaEVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBNYXRjaCBGb3VuZCBpbiBFbHNlJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBleDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cblxufTtcblxuLyogQGZsb3cgKi9cblxubGV0IHByb2Nlc3NfY291bnRlciA9IC0xO1xuXG5jbGFzcyBQSUQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBwcm9jZXNzX2NvdW50ZXIgPSBwcm9jZXNzX2NvdW50ZXIgKyAxO1xuICAgIHRoaXMuaWQgPSBwcm9jZXNzX2NvdW50ZXI7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gXCJQSUQjPDAuXCIgKyB0aGlzLmlkICsgXCIuMD5cIjtcbiAgfVxufVxuXG5jbGFzcyBJbnRlZ2VyVHlwZSB7fVxuY2xhc3MgRmxvYXRUeXBlIHt9XG5cbi8vaHR0cHM6Ly9naXRodWIuY29tL2FpcnBvcnR5aC9wcm90b21vcnBoaXNtXG5jbGFzcyBQcm90b2NvbCB7XG4gIGNvbnN0cnVjdG9yKHNwZWMpIHtcbiAgICB0aGlzLnJlZ2lzdHJ5ID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuZmFsbGJhY2sgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgZnVuTmFtZSBpbiBzcGVjKSB7XG4gICAgICB0aGlzW2Z1bk5hbWVdID0gY3JlYXRlRnVuKGZ1bk5hbWUpLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlRnVuKGZ1bk5hbWUpIHtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGxldCB0aGluZyA9IGFyZ3NbMF07XG4gICAgICAgIGxldCBmdW4gPSBudWxsO1xuXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHRoaW5nKSAmJiB0aGlzLmhhc0ltcGxlbWVudGF0aW9uKEludGVnZXJUeXBlKSkge1xuICAgICAgICAgIGZ1biA9IHRoaXMucmVnaXN0cnkuZ2V0KEludGVnZXJUeXBlKVtmdW5OYW1lXTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpbmcgPT09IFwibnVtYmVyXCIgJiYgIU51bWJlci5pc0ludGVnZXIodGhpbmcpICYmIHRoaXMuaGFzSW1wbGVtZW50YXRpb24oRmxvYXRUeXBlKSkge1xuICAgICAgICAgIGZ1biA9IHRoaXMucmVnaXN0cnkuZ2V0KEZsb2F0VHlwZSlbZnVuTmFtZV07XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5oYXNJbXBsZW1lbnRhdGlvbih0aGluZykpIHtcbiAgICAgICAgICBmdW4gPSB0aGlzLnJlZ2lzdHJ5LmdldCh0aGluZy5jb25zdHJ1Y3RvcilbZnVuTmFtZV07XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5mYWxsYmFjaykge1xuICAgICAgICAgIGZ1biA9IHRoaXMuZmFsbGJhY2tbZnVuTmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZnVuICE9IG51bGwpIHtcbiAgICAgICAgICBsZXQgcmV0dmFsID0gZnVuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBpbXBsZW1lbnRhdGlvbiBmb3VuZCBmb3IgXCIgKyB0aGluZyk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGltcGxlbWVudGF0aW9uKHR5cGUsIGltcGxlbWVudGF0aW9uKSB7XG4gICAgaWYgKHR5cGUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuZmFsbGJhY2sgPSBpbXBsZW1lbnRhdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZWdpc3RyeS5zZXQodHlwZSwgaW1wbGVtZW50YXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIGhhc0ltcGxlbWVudGF0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMucmVnaXN0cnkuaGFzKHRoaW5nLmNvbnN0cnVjdG9yKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0bChsaXN0KSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMubGlzdCguLi5saXN0LnNsaWNlKDEpKTtcbn1cblxuZnVuY3Rpb24gaGQobGlzdCkge1xuICByZXR1cm4gbGlzdFswXTtcbn1cblxuZnVuY3Rpb24gaXNfbmlsKHgpIHtcbiAgcmV0dXJuIHggPT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzX2F0b20oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdzeW1ib2wnO1xufVxuXG5mdW5jdGlvbiBpc19iaW5hcnkoeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdzdHJpbmcnIHx8IHggaW5zdGFuY2VvZiBTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGlzX2Jvb2xlYW4oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdib29sZWFuJyB8fCB4IGluc3RhbmNlb2YgQm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gaXNfZnVuY3Rpb24oeCwgYXJpdHkgPSAtMSkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbicgfHwgeCBpbnN0YW5jZW9mIEZ1bmN0aW9uO1xufVxuXG5mdW5jdGlvbiBpc19mbG9hdCh4KSB7XG4gIHJldHVybiBpc19udW1iZXIoeCkgJiYgIU51bWJlci5pc0ludGVnZXIoeCk7XG59XG5cbmZ1bmN0aW9uIGlzX2ludGVnZXIoeCkge1xuICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcih4KTtcbn1cblxuZnVuY3Rpb24gaXNfbGlzdCh4KSB7XG4gIHJldHVybiB4IGluc3RhbmNlb2YgQXJyYXk7XG59XG5cbmZ1bmN0aW9uIGlzX21hcCh4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgfHwgeCBpbnN0YW5jZW9mIE9iamVjdDtcbn1cblxuZnVuY3Rpb24gaXNfbnVtYmVyKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNfdHVwbGUoeCkge1xuICByZXR1cm4geCBpbnN0YW5jZW9mIFR1cGxlO1xufVxuXG5mdW5jdGlvbiBfbGVuZ3RoKHgpIHtcbiAgcmV0dXJuIHgubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBpc19waWQoeCkge1xuICByZXR1cm4geCBpbnN0YW5jZW9mIFBJRDtcbn1cblxuZnVuY3Rpb24gaXNfcG9ydCh4KSB7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNfcmVmZXJlbmNlKHgpIHtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc19iaXRzdHJpbmcoeCkge1xuICByZXR1cm4gaXNfYmluYXJ5KHgpIHx8IHggaW5zdGFuY2VvZiBCaXRTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIF9faW5fXyhsZWZ0LCByaWdodCkge1xuICBmb3IgKGxldCB4IG9mIHJpZ2h0KSB7XG4gICAgaWYgKG1hdGNoX19xbWFya19fKGxlZnQsIHgpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFicyhudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGguYWJzKG51bWJlcik7XG59XG5cbmZ1bmN0aW9uIHJvdW5kKG51bWJlcikge1xuICByZXR1cm4gTWF0aC5yb3VuZChudW1iZXIpO1xufVxuXG5mdW5jdGlvbiBlbGVtKHR1cGxlLCBpbmRleCkge1xuICBpZiAoaXNfbGlzdCh0dXBsZSkpIHtcbiAgICByZXR1cm4gdHVwbGVbaW5kZXhdO1xuICB9XG5cbiAgcmV0dXJuIHR1cGxlLmdldChpbmRleCk7XG59XG5cbmZ1bmN0aW9uIHJlbShsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCAlIHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBkaXYobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgLyByaWdodDtcbn1cblxuZnVuY3Rpb24gYW5kKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0ICYmIHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBvcihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCB8fCByaWdodDtcbn1cblxuZnVuY3Rpb24gbm90KGFyZykge1xuICByZXR1cm4gIWFyZztcbn1cblxuZnVuY3Rpb24gYXBwbHkoLi4uYXJncykge1xuICBpZiAoYXJncy5sZW5ndGggPT09IDMpIHtcbiAgICBsZXQgbW9kID0gYXJnc1swXTtcbiAgICBsZXQgZnVuYyA9IGFyZ3NbMV07XG4gICAgbGV0IGZ1bmNfYXJncyA9IGFyZ3NbMl07XG4gICAgcmV0dXJuIG1vZFtmdW5jXS5hcHBseShudWxsLCBmdW5jX2FyZ3MpO1xuICB9IGVsc2Uge1xuICAgIGxldCBmdW5jID0gYXJnc1swXTtcbiAgICBsZXQgZnVuY19hcmdzID0gYXJnc1sxXTtcblxuICAgIHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGZ1bmNfYXJncyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9fc3RyaW5nKGFyZykge1xuICBpZiAoaXNfdHVwbGUoYXJnKSkge1xuICAgIHJldHVybiBUdXBsZS50b19zdHJpbmcoYXJnKTtcbiAgfVxuXG4gIHJldHVybiBhcmcudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hfX3FtYXJrX18ocGF0dGVybiwgZXhwciwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIHJldHVybiBfUGF0dGVybnMubWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZXhwciwgZ3VhcmQpICE9IG51bGw7XG59XG5cbmZ1bmN0aW9uIGRlZnN0cnVjdChkZWZhdWx0cykge1xuICByZXR1cm4gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKHVwZGF0ZSA9IHt9KSB7XG4gICAgICBsZXQgdGhlX3ZhbHVlcyA9IE9iamVjdC5hc3NpZ24oZGVmYXVsdHMsIHVwZGF0ZSk7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHRoZV92YWx1ZXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGUodXBkYXRlcyA9IHt9KSB7XG4gICAgICBsZXQgeCA9IG5ldyB0aGlzKHVwZGF0ZXMpO1xuICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWZleGNlcHRpb24oZGVmYXVsdHMpIHtcbiAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKHVwZGF0ZSA9IHt9KSB7XG4gICAgICBsZXQgbWVzc2FnZSA9IHVwZGF0ZS5tZXNzYWdlIHx8ICcnO1xuICAgICAgc3VwZXIobWVzc2FnZSk7XG5cbiAgICAgIGxldCB0aGVfdmFsdWVzID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgdXBkYXRlKTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgdGhlX3ZhbHVlcyk7XG5cbiAgICAgIHRoaXMubmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB0aGlzW1NwZWNpYWxGb3Jtcy5hdG9tKCdfX2V4Y2VwdGlvbl9fJyldID0gdHJ1ZTtcbiAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IubmFtZSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZSh1cGRhdGVzID0ge30pIHtcbiAgICAgIGxldCB4ID0gbmV3IHRoaXModXBkYXRlcyk7XG4gICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh4KTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlZnByb3RvY29sKHNwZWMpIHtcbiAgcmV0dXJuIG5ldyBQcm90b2NvbChzcGVjKTtcbn1cblxuZnVuY3Rpb24gZGVmaW1wbChwcm90b2NvbCwgdHlwZSwgaW1wbCkge1xuICBwcm90b2NvbC5pbXBsZW1lbnRhdGlvbih0eXBlLCBpbXBsKTtcbn1cblxudmFyIEtlcm5lbCA9IHtcbiAgU3BlY2lhbEZvcm1zLFxuICB0bCxcbiAgaGQsXG4gIGlzX25pbCxcbiAgaXNfYXRvbSxcbiAgaXNfYmluYXJ5LFxuICBpc19ib29sZWFuLFxuICBpc19mdW5jdGlvbixcbiAgaXNfZmxvYXQsXG4gIGlzX2ludGVnZXIsXG4gIGlzX2xpc3QsXG4gIGlzX21hcCxcbiAgaXNfbnVtYmVyLFxuICBpc190dXBsZSxcbiAgbGVuZ3RoOiBfbGVuZ3RoLFxuICBpc19waWQsXG4gIGlzX3BvcnQsXG4gIGlzX3JlZmVyZW5jZSxcbiAgaXNfYml0c3RyaW5nLFxuICBpbjogX19pbl9fLFxuICBhYnMsXG4gIHJvdW5kLFxuICBlbGVtLFxuICByZW0sXG4gIGRpdixcbiAgYW5kLFxuICBvcixcbiAgbm90LFxuICBhcHBseSxcbiAgdG9fc3RyaW5nLFxuICBtYXRjaF9fcW1hcmtfXyxcbiAgZGVmc3RydWN0LFxuICBkZWZwcm90b2NvbCxcbiAgZGVmaW1wbFxufTtcblxubGV0IEVudW0gPSB7XG5cbiAgYWxsX19xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuID0geCA9PiB4KSB7XG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoIWZ1bihlbGVtKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgYW55X19xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuID0geCA9PiB4KSB7XG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBhdDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4sIHRoZV9kZWZhdWx0ID0gbnVsbCkge1xuICAgIGlmIChuID4gdGhpcy5jb3VudChjb2xsZWN0aW9uKSB8fCBuIDwgMCkge1xuICAgICAgcmV0dXJuIHRoZV9kZWZhdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uW25dO1xuICB9LFxuXG4gIGNvbmNhdDogZnVuY3Rpb24gKC4uLmVudW1hYmxlcykge1xuICAgIHJldHVybiBlbnVtYWJsZXNbMF0uY29uY2F0KGVudW1hYmxlc1sxXSk7XG4gIH0sXG5cbiAgY291bnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4gPSBudWxsKSB7XG4gICAgaWYgKGZ1biA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbi5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uLmZpbHRlcihmdW4pLmxlbmd0aDtcbiAgICB9XG4gIH0sXG5cbiAgZHJvcDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvdW50KSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoY291bnQpO1xuICB9LFxuXG4gIGRyb3Bfd2hpbGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIGNvdW50ID0gY291bnQgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoY291bnQpO1xuICB9LFxuXG4gIGVhY2g6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGZ1bihlbGVtKTtcbiAgICB9XG4gIH0sXG5cbiAgZW1wdHlfX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24ubGVuZ3RoID09PSAwO1xuICB9LFxuXG4gIGZldGNoOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbikge1xuICAgIGlmIChLZXJuZWwuaXNfbGlzdChjb2xsZWN0aW9uKSkge1xuICAgICAgaWYgKG4gPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pICYmIG4gPj0gMCkge1xuICAgICAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oXCJva1wiKSwgY29sbGVjdGlvbltuXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKFwiZXJyb3JcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiY29sbGVjdGlvbiBpcyBub3QgYW4gRW51bWVyYWJsZVwiKTtcbiAgfSxcblxuICBmZXRjaF9fZW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4pIHtcbiAgICBpZiAoS2VybmVsLmlzX2xpc3QoY29sbGVjdGlvbikpIHtcbiAgICAgIGlmIChuIDwgdGhpcy5jb3VudChjb2xsZWN0aW9uKSAmJiBuID49IDApIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25bbl07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvdXQgb2YgYm91bmRzIGVycm9yXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcImNvbGxlY3Rpb24gaXMgbm90IGFuIEVudW1lcmFibGVcIik7XG4gIH0sXG5cbiAgZmlsdGVyOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGVsZW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgZmlsdGVyX21hcDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZpbHRlciwgbWFwcGVyKSB7XG4gICAgcmV0dXJuIEVudW0ubWFwKEVudW0uZmlsdGVyKGNvbGxlY3Rpb24sIGZpbHRlciksIG1hcHBlcik7XG4gIH0sXG5cbiAgZmluZDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGlmX25vbmUgPSBudWxsLCBmdW4pIHtcbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChmdW4oZWxlbSkpIHtcbiAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGlmX25vbmU7XG4gIH0sXG5cbiAgaW50bzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGxpc3QpIHtcbiAgICByZXR1cm4gbGlzdC5jb25jYXQoY29sbGVjdGlvbik7XG4gIH0sXG5cbiAgbWFwOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICByZXN1bHQucHVzaChmdW4oZWxlbSkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgbWFwX3JlZHVjZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGFjYywgZnVuKSB7XG4gICAgbGV0IG1hcHBlZCA9IEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCgpO1xuICAgIGxldCB0aGVfYWNjID0gYWNjO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pOyBpKyspIHtcbiAgICAgIGxldCB0dXBsZSA9IGZ1bihjb2xsZWN0aW9uW2ldLCB0aGVfYWNjKTtcblxuICAgICAgdGhlX2FjYyA9IEtlcm5lbC5lbGVtKHR1cGxlLCAxKTtcbiAgICAgIG1hcHBlZCA9IEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5tYXBwZWQuY29uY2F0KFtLZXJuZWwuZWxlbSh0dXBsZSwgMCldKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUobWFwcGVkLCB0aGVfYWNjKTtcbiAgfSxcblxuICBtZW1iZXI6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCB2YWx1ZSkge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLmluY2x1ZGVzKHZhbHVlKTtcbiAgfSxcblxuICByZWR1Y2U6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBhY2MsIGZ1bikge1xuICAgIGxldCB0aGVfYWNjID0gYWNjO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pOyBpKyspIHtcbiAgICAgIGxldCB0dXBsZSA9IGZ1bihjb2xsZWN0aW9uW2ldLCB0aGVfYWNjKTtcblxuICAgICAgdGhlX2FjYyA9IEtlcm5lbC5lbGVtKHR1cGxlLCAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhlX2FjYztcbiAgfSxcblxuICB0YWtlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgY291bnQpIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5zbGljZSgwLCBjb3VudCk7XG4gIH0sXG5cbiAgdGFrZV9ldmVyeTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG50aCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoaW5kZXggJSBudGggPT09IDApIHtcbiAgICAgICAgcmVzdWx0LnB1c2goZWxlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5yZXN1bHQpO1xuICB9LFxuXG4gIHRha2Vfd2hpbGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIGNvdW50ID0gY291bnQgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoMCwgY291bnQpO1xuICB9LFxuXG4gIHRvX2xpc3Q6IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cbn07XG5cbmxldCBBdG9tID0ge307XG5cbkF0b20udG9fc3RyaW5nID0gZnVuY3Rpb24gKGF0b20pIHtcbiAgcmV0dXJuIFN5bWJvbC5rZXlGb3IoYXRvbSk7XG59O1xuXG5BdG9tLnRvX2NoYXJfbGlzdCA9IGZ1bmN0aW9uIChhdG9tKSB7XG4gIHJldHVybiBBdG9tLnRvX3N0cmluZyhhdG9tKS5zcGxpdCgnJyk7XG59O1xuXG5sZXQgSW50ZWdlciA9IHtcblxuICBpc19ldmVuOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBuICUgMiA9PT0gMDtcbiAgfSxcblxuICBpc19vZGQ6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIG4gJSAyICE9PSAwO1xuICB9LFxuXG4gIHBhcnNlOiBmdW5jdGlvbiAoYmluKSB7XG4gICAgbGV0IHJlc3VsdCA9IHBhcnNlSW50KGJpbik7XG5cbiAgICBpZiAoaXNOYU4ocmVzdWx0KSkge1xuICAgICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbShcImVycm9yXCIpO1xuICAgIH1cblxuICAgIGxldCBpbmRleE9mRG90ID0gYmluLmluZGV4T2YoXCIuXCIpO1xuXG4gICAgaWYgKGluZGV4T2ZEb3QgPj0gMCkge1xuICAgICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUocmVzdWx0LCBiaW4uc3Vic3RyaW5nKGluZGV4T2ZEb3QpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShyZXN1bHQsIFwiXCIpO1xuICB9LFxuXG4gIHRvX2NoYXJfbGlzdDogZnVuY3Rpb24gKG51bWJlciwgYmFzZSA9IDEwKSB7XG4gICAgcmV0dXJuIG51bWJlci50b1N0cmluZyhiYXNlKS5zcGxpdChcIlwiKTtcbiAgfSxcblxuICB0b19zdHJpbmc6IGZ1bmN0aW9uIChudW1iZXIsIGJhc2UgPSAxMCkge1xuICAgIHJldHVybiBudW1iZXIudG9TdHJpbmcoYmFzZSk7XG4gIH1cbn07XG5cbmxldCBfQ2hhcnMgPSBLZXJuZWwuZGVmcHJvdG9jb2woe1xuICB0b19zdHJpbmc6IGZ1bmN0aW9uICh0aGluZykge31cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChfQ2hhcnMsIEJpdFN0cmluZywge1xuICB0b19zdHJpbmc6IGZ1bmN0aW9uICh0aGluZykge1xuICAgIGlmIChLZXJuZWwuaXNfYmluYXJ5KHRoaW5nKSkge1xuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH1cblxuICAgIHJldHVybiB0aGluZy50b1N0cmluZygpO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoX0NoYXJzLCBTeW1ib2wsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICBpZiAobmlsKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gQXRvbS50b19zdHJpbmcodGhpbmcpO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoX0NoYXJzLCBJbnRlZ2VyVHlwZSwge1xuICB0b19zdHJpbmc6IGZ1bmN0aW9uICh0aGluZykge1xuICAgIHJldHVybiBJbnRlZ2VyLnRvX3N0cmluZyh0aGluZyk7XG4gIH1cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChfQ2hhcnMsIEZsb2F0VHlwZSwge1xuICB0b19zdHJpbmc6IGZ1bmN0aW9uICh0aGluZykge1xuICAgIHJldHVybiB0aGluZy50b1N0cmluZztcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKF9DaGFycywgQXJyYXksIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gdGhpbmcudG9TdHJpbmcoKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKF9DaGFycywgVHVwbGUsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gVHVwbGUudG9fc3RyaW5nKHRoaW5nKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKF9DaGFycywgbnVsbCwge1xuICB0b19zdHJpbmc6IGZ1bmN0aW9uICh0aGluZykge1xuICAgIHJldHVybiB0aGluZy50b1N0cmluZygpO1xuICB9XG59KTtcblxuZnVuY3Rpb24gdG9fYXRvbShzdHJpbmcpIHtcbiAgcmV0dXJuIFN5bWJvbC5mb3Ioc3RyaW5nKTtcbn1cblxuZnVuY3Rpb24gdG9fZXhpc3RpbmdfYXRvbShzdHJpbmcpIHtcbiAgcmV0dXJuIFN5bWJvbC5mb3Ioc3RyaW5nKTtcbn1cblxuZnVuY3Rpb24gdG9fY2hhcl9saXN0KHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnNwbGl0KCcnKTtcbn1cblxuZnVuY3Rpb24gdG9fZmxvYXQoc3RyaW5nKSB7XG4gIHJldHVybiBwYXJzZUZsb2F0KHN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIHRvX2ludGVnZXIoc3RyaW5nLCBiYXNlID0gMTApIHtcbiAgcmV0dXJuIHBhcnNlSW50KHN0cmluZywgYmFzZSk7XG59XG5cbmZ1bmN0aW9uIHVwY2FzZShiaW5hcnkpIHtcbiAgcmV0dXJuIGJpbmFyeS50b1VwcGVyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiBkb3duY2FzZShiaW5hcnkpIHtcbiAgcmV0dXJuIGJpbmFyeS50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiBhdChzdHJpbmcsIHBvc2l0aW9uKSB7XG4gIGlmIChwb3NpdGlvbiA+IHN0cmluZy5sZW5ndGggLSAxKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gc3RyaW5nW3Bvc2l0aW9uXTtcbn1cblxuZnVuY3Rpb24gY2FwaXRhbGl6ZShzdHJpbmcpIHtcbiAgbGV0IHJldHVyblN0cmluZyA9ICcnO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIHJldHVyblN0cmluZyA9IHJldHVyblN0cmluZyArIHN0cmluZ1tpXS50b1VwcGVyQ2FzZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm5TdHJpbmcgPSByZXR1cm5TdHJpbmcgKyBzdHJpbmdbaV0udG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0dXJuU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBjb2RlcG9pbnRzKHN0cmluZykge1xuICByZXR1cm4gdG9fY2hhcl9saXN0KHN0cmluZykubWFwKGZ1bmN0aW9uIChjKSB7XG4gICAgcmV0dXJuIGMuY29kZVBvaW50QXQoMCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb250YWluc19fcW1fXyhzdHJpbmcsIGNvbnRhaW5zKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGNvbnRhaW5zKSkge1xuICAgIHJldHVybiBjb250YWlucy5zb21lKGZ1bmN0aW9uIChzKSB7XG4gICAgICByZXR1cm4gc3RyaW5nLmluZGV4T2YocykgPiAtMTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBzdHJpbmcuaW5kZXhPZihjb250YWlucykgPiAtMTtcbn1cblxuZnVuY3Rpb24gZHVwbGljYXRlKHN1YmplY3QsIG4pIHtcbiAgcmV0dXJuIHN1YmplY3QucmVwZWF0KG4pO1xufVxuXG5mdW5jdGlvbiBlbmRzX3dpdGhfX3FtX18oc3RyaW5nLCBzdWZmaXhlcykge1xuICBpZiAoQXJyYXkuaXNBcnJheShzdWZmaXhlcykpIHtcbiAgICByZXR1cm4gc3VmZml4ZXMuc29tZShmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIHN0cmluZy5lbmRzV2l0aChzKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBzdHJpbmcuZW5kc1dpdGgoc3VmZml4ZXMpO1xufVxuXG5mdW5jdGlvbiBmaXJzdChzdHJpbmcpIHtcbiAgaWYgKCFzdHJpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdbMF07XG59XG5cbmZ1bmN0aW9uIGdyYXBoZW1lcyhzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5zcGxpdCgnJyk7XG59XG5cbmZ1bmN0aW9uIGxhc3Qoc3RyaW5nKSB7XG4gIGlmICghc3RyaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gc3RyaW5nW3N0cmluZy5sZW5ndGggLSAxXTtcbn1cblxuZnVuY3Rpb24gbGVuZ3RoKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gbWF0Y2hfX3FtX18oc3RyaW5nLCByZWdleCkge1xuICByZXR1cm4gc3RyaW5nLm1hdGNoKHJlZ2V4KSAhPSBudWxsO1xufVxuXG5mdW5jdGlvbiBuZXh0X2NvZGVwb2ludChzdHJpbmcpIHtcbiAgaWYgKCFzdHJpbmcgfHwgc3RyaW5nID09PSAnJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUoc3RyaW5nWzBdLmNvZGVQb2ludEF0KDApLCBzdHJpbmcuc3Vic3RyKDEpKTtcbn1cblxuZnVuY3Rpb24gbmV4dF9ncmFwaGVtZShzdHJpbmcpIHtcbiAgaWYgKCFzdHJpbmcgfHwgc3RyaW5nID09PSAnJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUoc3RyaW5nWzBdLCBzdHJpbmcuc3Vic3RyKDEpKTtcbn1cblxuZnVuY3Rpb24gcmV2ZXJzZShzdHJpbmcpIHtcbiAgbGV0IHJldHVyblZhbHVlID0gJyc7XG5cbiAgZm9yICh2YXIgaSA9IHN0cmluZy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHJldHVyblZhbHVlID0gcmV0dXJuVmFsdWUgKyBzdHJpbmdbaV07XG4gIH07XG5cbiAgcmV0dXJuIHJldHVyblZhbHVlO1xufVxuXG5mdW5jdGlvbiBfc3BsaXQoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuc3BsaXQoKTtcbn1cblxuZnVuY3Rpb24gc3RhcnRzX3dpdGhfX3FtX18oc3RyaW5nLCBwcmVmaXhlcykge1xuICBpZiAoQXJyYXkuaXNBcnJheShwcmVmaXhlcykpIHtcbiAgICByZXR1cm4gcHJlZml4ZXMuc29tZShmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIHN0cmluZy5zdGFydHNXaXRoKHMpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHN0cmluZy5zdGFydHNXaXRoKHByZWZpeGVzKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRfY2hhcmFjdGVyX19xbV9fKGNvZGVwb2ludCkge1xuICB0cnkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludChjb2RlcG9pbnQpICE9IG51bGw7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxudmFyIF9TdHJpbmcgPSB7XG4gIGF0LFxuICBjYXBpdGFsaXplLFxuICBjb2RlcG9pbnRzLFxuICBjb250YWluc19fcW1fXyxcbiAgZG93bmNhc2UsXG4gIGR1cGxpY2F0ZSxcbiAgZW5kc193aXRoX19xbV9fLFxuICBmaXJzdCxcbiAgZ3JhcGhlbWVzLFxuICBsYXN0LFxuICBsZW5ndGgsXG4gIG1hdGNoX19xbV9fLFxuICBuZXh0X2NvZGVwb2ludCxcbiAgbmV4dF9ncmFwaGVtZSxcbiAgcmV2ZXJzZSxcbiAgc3BsaXQ6IF9zcGxpdCxcbiAgc3RhcnRzX3dpdGhfX3FtX18sXG4gIHRvX2F0b20sXG4gIHRvX2NoYXJfbGlzdCxcbiAgdG9fZXhpc3RpbmdfYXRvbSxcbiAgdG9fZmxvYXQsXG4gIHRvX2ludGVnZXIsXG4gIHVwY2FzZSxcbiAgdmFsaWRfY2hhcmFjdGVyX19xbV9fLFxuICBDaGFyczogX0NoYXJzXG59O1xuXG5sZXQgQ2hhcnMgPSBLZXJuZWwuZGVmcHJvdG9jb2woe1xuICB0b19jaGFyX2xpc3Q6IGZ1bmN0aW9uICh0aGluZykge31cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChDaGFycywgS2VybmVsLmlzX2JpdHN0cmluZywge1xuICB0b19jaGFyX2xpc3Q6IGZ1bmN0aW9uICh0aGluZykge1xuICAgIGlmIChLZXJuZWwuaXNfYmluYXJ5KHRoaW5nKSkge1xuICAgICAgcmV0dXJuIF9TdHJpbmcudG9fY2hhcl9saXN0KHRoaW5nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpbmcudG9TdHJpbmcoKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKENoYXJzLCBLZXJuZWwuaXNfYXRvbSwge1xuICB0b19jaGFyX2xpc3Q6IGZ1bmN0aW9uICh0aGluZykge1xuICAgIHJldHVybiBBdG9tLnRvX2NoYXJfbGlzdCh0aGluZyk7XG4gIH1cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChDaGFycywgS2VybmVsLmlzX2ludGVnZXIsIHtcbiAgdG9fY2hhcl9saXN0OiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gSW50ZWdlci50b19jaGFyX2xpc3QodGhpbmcpO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoQ2hhcnMsIEtlcm5lbC5pc19saXN0LCB7XG4gIHRvX2NoYXJfbGlzdDogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9XG59KTtcblxubGV0IExpc3QgPSB7fTtcblxuTGlzdC5DaGFycyA9IENoYXJzO1xuXG5MaXN0LmRlbGV0ZSA9IGZ1bmN0aW9uIChsaXN0LCBpdGVtKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcbiAgbGV0IHZhbHVlX2ZvdW5kID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgeCBvZiBsaXN0KSB7XG4gICAgaWYgKHggPT09IGl0ZW0gJiYgdmFsdWVfZm91bmQgIT09IGZhbHNlKSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh4KTtcbiAgICAgIHZhbHVlX2ZvdW5kID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHggIT09IGl0ZW0pIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKHgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QuZGVsZXRlX2F0ID0gZnVuY3Rpb24gKGxpc3QsIGluZGV4KSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaSAhPT0gaW5kZXgpIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGxpc3RbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QuZHVwbGljYXRlID0gZnVuY3Rpb24gKGVsZW0sIG4pIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgbmV3X3ZhbHVlLnB1c2goZWxlbSk7XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmZpcnN0ID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIGxpc3RbMF07XG59O1xuXG5MaXN0LmZsYXR0ZW4gPSBmdW5jdGlvbiAobGlzdCwgdGFpbCA9IEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCgpKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKGxldCB4IG9mIGxpc3QpIHtcbiAgICBpZiAoS2VybmVsLmlzX2xpc3QoeCkpIHtcbiAgICAgIG5ld192YWx1ZSA9IG5ld192YWx1ZS5jb25jYXQoTGlzdC5mbGF0dGVuKHgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3X3ZhbHVlLnB1c2goeCk7XG4gICAgfVxuICB9XG5cbiAgbmV3X3ZhbHVlID0gbmV3X3ZhbHVlLmNvbmNhdCh0YWlsKTtcblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmZvbGRsID0gZnVuY3Rpb24gKGxpc3QsIGFjYywgZnVuYykge1xuICByZXR1cm4gbGlzdC5yZWR1Y2UoZnVuYywgYWNjKTtcbn07XG5cbkxpc3QuZm9sZHIgPSBmdW5jdGlvbiAobGlzdCwgYWNjLCBmdW5jKSB7XG4gIGxldCBuZXdfYWNjID0gYWNjO1xuXG4gIGZvciAodmFyIGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbmV3X2FjYyA9IGZ1bmMobGlzdFtpXSwgbmV3X2FjYyk7XG4gIH1cblxuICByZXR1cm4gbmV3X2FjYztcbn07XG5cbkxpc3QuaW5zZXJ0X2F0ID0gZnVuY3Rpb24gKGxpc3QsIGluZGV4LCB2YWx1ZSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh2YWx1ZSk7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3X3ZhbHVlLnB1c2gobGlzdFtpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC5rZXlkZWxldGUgPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbikge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIUtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgbmV3X2xpc3QucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld19saXN0KTtcbn07XG5cbkxpc3Qua2V5ZmluZCA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uLCBfZGVmYXVsdCA9IG51bGwpIHtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoS2VybmVsLm1hdGNoX19xbWFya19fKGxpc3RbaV1bcG9zaXRpb25dLCBrZXkpKSB7XG4gICAgICByZXR1cm4gbGlzdFtpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gX2RlZmF1bHQ7XG59O1xuXG5MaXN0LmtleW1lbWJlcl9fcW1hcmtfXyA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uKSB7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuTGlzdC5rZXlyZXBsYWNlID0gZnVuY3Rpb24gKGxpc3QsIGtleSwgcG9zaXRpb24sIG5ld190dXBsZSkge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIUtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgbmV3X2xpc3QucHVzaChsaXN0W2ldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3X2xpc3QucHVzaChuZXdfdHVwbGUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xufTtcblxuTGlzdC5rZXlzb3J0ID0gZnVuY3Rpb24gKGxpc3QsIHBvc2l0aW9uKSB7XG4gIGxldCBuZXdfbGlzdCA9IGxpc3Q7XG5cbiAgbmV3X2xpc3Quc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChwb3NpdGlvbiA9PT0gMCkge1xuICAgICAgaWYgKGFbcG9zaXRpb25dLnZhbHVlIDwgYltwb3NpdGlvbl0udmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuXG4gICAgICBpZiAoYVtwb3NpdGlvbl0udmFsdWUgPiBiW3Bvc2l0aW9uXS52YWx1ZSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhW3Bvc2l0aW9uXSA8IGJbcG9zaXRpb25dKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFbcG9zaXRpb25dID4gYltwb3NpdGlvbl0pIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0LmtleXN0b3JlID0gZnVuY3Rpb24gKGxpc3QsIGtleSwgcG9zaXRpb24sIG5ld190dXBsZSkge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcbiAgbGV0IHJlcGxhY2VkID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIG5ld19saXN0LnB1c2gobGlzdFtpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld19saXN0LnB1c2gobmV3X3R1cGxlKTtcbiAgICAgIHJlcGxhY2VkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXJlcGxhY2VkKSB7XG4gICAgbmV3X2xpc3QucHVzaChuZXdfdHVwbGUpO1xuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0Lmxhc3QgPSBmdW5jdGlvbiAobGlzdCkge1xuICByZXR1cm4gbGlzdFtsaXN0Lmxlbmd0aCAtIDFdO1xufTtcblxuTGlzdC5yZXBsYWNlX2F0ID0gZnVuY3Rpb24gKGxpc3QsIGluZGV4LCB2YWx1ZSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGxpc3RbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QudXBkYXRlX2F0ID0gZnVuY3Rpb24gKGxpc3QsIGluZGV4LCBmdW4pIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5jb3VudCgpOyBpKyspIHtcbiAgICBpZiAoaSA9PT0gaW5kZXgpIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGZ1bihsaXN0LmdldChpKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0LmdldChpKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ld192YWx1ZTtcbn07XG5cbkxpc3Qud3JhcCA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gIGlmIChLZXJuZWwuaXNfbGlzdChsaXN0KSkge1xuICAgIHJldHVybiBsaXN0O1xuICB9IGVsc2UgaWYgKGxpc3QgPT0gbnVsbCkge1xuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KGxpc3QpO1xuICB9XG59O1xuXG5MaXN0LnppcCA9IGZ1bmN0aW9uIChsaXN0X29mX2xpc3RzKSB7XG4gIGlmIChsaXN0X29mX2xpc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoKTtcbiAgfVxuXG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcbiAgbGV0IHNtYWxsZXN0X2xlbmd0aCA9IGxpc3Rfb2ZfbGlzdHNbMF07XG5cbiAgZm9yIChsZXQgeCBvZiBsaXN0X29mX2xpc3RzKSB7XG4gICAgaWYgKHgubGVuZ3RoIDwgc21hbGxlc3RfbGVuZ3RoKSB7XG4gICAgICBzbWFsbGVzdF9sZW5ndGggPSB4Lmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNtYWxsZXN0X2xlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGN1cnJlbnRfdmFsdWUgPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGxpc3Rfb2ZfbGlzdHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGN1cnJlbnRfdmFsdWUucHVzaChsaXN0X29mX2xpc3RzW2pdW2ldKTtcbiAgICB9XG5cbiAgICBuZXdfdmFsdWUucHVzaChLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKC4uLmN1cnJlbnRfdmFsdWUpKTtcbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QudG9fdHVwbGUgPSBmdW5jdGlvbiAobGlzdCkge1xuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZS5hcHBseShudWxsLCBsaXN0KTtcbn07XG5cbkxpc3QuYXBwZW5kID0gZnVuY3Rpb24gKGxpc3QsIHZhbHVlKSB7XG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubGlzdC5jb25jYXQoW3ZhbHVlXSkpO1xufTtcblxuTGlzdC5wcmVwZW5kID0gZnVuY3Rpb24gKGxpc3QsIHZhbHVlKSB7XG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4uW3ZhbHVlXS5jb25jYXQobGlzdCkpO1xufTtcblxuTGlzdC5jb25jYXQgPSBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQuY29uY2F0KHJpZ2h0KTtcbn07XG5cbmNsYXNzIFNpZ25hbCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5iaW5kaW5ncyA9IFNwZWNpYWxGb3Jtcy5saXN0KCk7XG4gIH1cblxuICBhZGQobGlzdGVuZXIsIGNvbnRleHQgPSB0aGlzKSB7XG4gICAgdGhpcy5iaW5kaW5ncyA9IExpc3QuYXBwZW5kKHRoaXMuYmluZGluZ3MsIG5ldyBTaWduYWxCaW5kaW5nKHRoaXMsIGxpc3RlbmVyLCBjb250ZXh0KSk7XG4gIH1cblxuICByZW1vdmUobGlzdGVuZXIpIHtcbiAgICB0aGlzLmJpbmRpbmdzID0gRW51bS5maWx0ZXIodGhpcy5iaW5kaW5ncywgZnVuY3Rpb24gKGJpbmRpbmcpIHtcbiAgICAgIHJldHVybiBiaW5kaW5nLmxpc3RlbmVyICE9PSBsaXN0ZW5lcjtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc3BhdGNoKC4uLnBhcmFtcykge1xuICAgIGZvciAobGV0IGJpbmRpbmcgb2YgdGhpcy5iaW5kaW5ncykge1xuICAgICAgYmluZGluZy5leGVjdXRlKC4uLnBhcmFtcyk7XG4gICAgfVxuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICBmb3IgKGxldCBiaW5kaW5nIG9mIHRoaXMuYmluZGluZ3MpIHtcbiAgICAgIGJpbmRpbmcuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHRoaXMuYmluZGluZ3MgPSBudWxsO1xuICB9XG59XG5cbmNsYXNzIFNpZ25hbEJpbmRpbmcge1xuXG4gIGNvbnN0cnVjdG9yKHNpZ25hbCwgbGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gICAgdGhpcy5zaWduYWwgPSBzaWduYWw7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgfVxuXG4gIGV4ZWN1dGUoLi4ucGFyYW1zKSB7XG4gICAgdGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLmNvbnRleHQsIHBhcmFtcyk7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMubGlzdGVuZXIgPSBudWxsO1xuICAgIHRoaXMuc2lnbmFsID0gbnVsbDtcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9fdXBkYXRlKG1hcCwga2V5LCB2YWx1ZSkge1xuICBsZXQgbSA9IG5ldyBNYXAobWFwKTtcbiAgbS5zZXQoa2V5LCB2YWx1ZSk7XG4gIHJldHVybiBtO1xufVxuXG5mdW5jdGlvbiByZW1vdmUobWFwLCBrZXkpIHtcbiAgbGV0IG0gPSBuZXcgTWFwKG1hcCk7XG4gIG0uZGVsZXRlKGtleSk7XG4gIHJldHVybiBtO1xufVxuXG5jbGFzcyBNYWlsQm94IHtcblxuICBjb25zdHJ1Y3Rvcihjb250ZXh0ID0gdGhpcykge1xuICAgIHRoaXMuc2lnbmFsID0gbmV3IFNpZ25hbCgpO1xuICAgIHRoaXMuc2lnbmFsLmFkZCgoLi4ucGFyYW1zKSA9PiB0aGlzLm1lc3NhZ2VzID0gdGhpcy5tZXNzYWdlcy5jb25jYXQocGFyYW1zKSwgY29udGV4dCk7XG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICB9XG5cbiAgcmVjZWl2ZSguLi5tZXNzYWdlcykge1xuICAgIHRoaXMuc2lnbmFsLmRpc3BhdGNoKC4uLm1lc3NhZ2VzKTtcbiAgfVxuXG4gIHBlZWsoKSB7XG4gICAgaWYgKHRoaXMubWVzc2FnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tZXNzYWdlc1swXTtcbiAgfVxuXG4gIHJlYWQoKSB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMubWVzc2FnZXNbMF07XG4gICAgdGhpcy5tZXNzYWdlcyA9IHRoaXMubWVzc2FnZXMuc2xpY2UoMSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYWRkX3N1YnNjcmliZXIoZm4sIGNvbnRleHQgPSB0aGlzKSB7XG4gICAgdGhpcy5zaWduYWwuYWRkKGZuLCBjb250ZXh0KTtcbiAgfVxuXG4gIHJlbW92ZV9zdWJzY3JpYmVyKGZuKSB7XG4gICAgdGhpcy5zaWduYWwucmVtb3ZlKGZuKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zaWduYWwuZGlzcG9zZSgpO1xuICAgIHRoaXMubWVzc2FnZXMgPSBudWxsO1xuICB9XG59XG5cbmNsYXNzIFBvc3RPZmZpY2Uge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubWFpbGJveGVzID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgc2VuZChhZGRyZXNzLCBtZXNzYWdlKSB7XG4gICAgdGhpcy5tYWlsYm94ZXMuZ2V0KGFkZHJlc3MpLnJlY2VpdmUobWVzc2FnZSk7XG4gIH1cblxuICByZWNlaXZlKGFkZHJlc3MpIHtcbiAgICByZXR1cm4gdGhpcy5tYWlsYm94ZXMuZ2V0KGFkZHJlc3MpLnJlYWQoKTtcbiAgfVxuXG4gIHBlZWsoYWRkcmVzcykge1xuICAgIHJldHVybiB0aGlzLm1haWxib3hlcy5nZXQoYWRkcmVzcykucGVlaygpO1xuICB9XG5cbiAgYWRkX21haWxib3goYWRkcmVzcyA9IFN5bWJvbCgpLCBjb250ZXh0ID0gdGhpcykge1xuICAgIHRoaXMubWFpbGJveGVzID0gX191cGRhdGUodGhpcy5tYWlsYm94ZXMsIGFkZHJlc3MsIG5ldyBNYWlsQm94KCkpO1xuICAgIHJldHVybiBhZGRyZXNzO1xuICB9XG5cbiAgcmVtb3ZlX21haWxib3goYWRkcmVzcykge1xuICAgIHRoaXMubWFpbGJveGVzLmdldChhZGRyZXNzKS5kaXNwb3NlKCk7XG4gICAgdGhpcy5tYWlsYm94ZXMgPSByZW1vdmUodGhpcy5tYWlsYm94ZXMsIGFkZHJlc3MpO1xuICB9XG5cbiAgc3Vic2NyaWJlKGFkZHJlc3MsIHN1YnNjcmlidGlvbl9mbiwgY29udGV4dCA9IHRoaXMpIHtcbiAgICB0aGlzLm1haWxib3hlcy5nZXQoYWRkcmVzcykuYWRkX3N1YnNjcmliZXIoc3Vic2NyaWJ0aW9uX2ZuLCBjb250ZXh0KTtcbiAgfVxuXG4gIHVuc3Vic2NyaWJlKGFkZHJlc3MsIHN1YnNjcmlidGlvbl9mbikge1xuICAgIHRoaXMubWFpbGJveGVzLmdldChhZGRyZXNzKS5yZW1vdmVfc3Vic2NyaWJlcihzdWJzY3JpYnRpb25fZm4pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxfcHJvcGVydHkoaXRlbSwgcHJvcGVydHkpIHtcbiAgaWYgKHByb3BlcnR5IGluIGl0ZW0pIHtcbiAgICBpdGVtW3Byb3BlcnR5XTtcbiAgICBpZiAoaXRlbVtwcm9wZXJ0eV0gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIGl0ZW1bcHJvcGVydHldKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BlcnR5XTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoU3ltYm9sLmZvcihwcm9wZXJ0eSkgaW4gaXRlbSkge1xuICAgIGxldCBwcm9wID0gU3ltYm9sLmZvcihwcm9wZXJ0eSk7XG4gICAgaWYgKGl0ZW1bcHJvcF0gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIGl0ZW1bcHJvcF0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZW1bcHJvcF07XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKGBQcm9wZXJ0eSAkeyBwcm9wZXJ0eSB9IG5vdCBmb3VuZCBpbiAkeyBpdGVtIH1gKTtcbn1cblxudmFyIEpTID0ge1xuICBjYWxsX3Byb3BlcnR5XG59O1xuXG5sZXQgUmFuZ2UgPSBmdW5jdGlvbiAoX2ZpcnN0LCBfbGFzdCkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmFuZ2UpKSB7XG4gICAgcmV0dXJuIG5ldyBSYW5nZShfZmlyc3QsIF9sYXN0KTtcbiAgfVxuXG4gIHRoaXMuZmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9maXJzdDtcbiAgfTtcblxuICB0aGlzLmxhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9sYXN0O1xuICB9O1xuXG4gIGxldCBfcmFuZ2UgPSBbXTtcblxuICBmb3IgKGxldCBpID0gX2ZpcnN0OyBpIDw9IF9sYXN0OyBpKyspIHtcbiAgICBfcmFuZ2UucHVzaChpKTtcbiAgfVxuXG4gIF9yYW5nZSA9IE9iamVjdC5mcmVlemUoX3JhbmdlKTtcblxuICB0aGlzLnZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfcmFuZ2U7XG4gIH07XG5cbiAgdGhpcy5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9yYW5nZS5sZW5ndGg7XG4gIH07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SYW5nZS5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudmFsdWUoKVtTeW1ib2wuaXRlcmF0b3JdKCk7XG59O1xuXG5SYW5nZS5uZXcgPSBmdW5jdGlvbiAoZmlyc3QsIGxhc3QpIHtcbiAgcmV0dXJuIFJhbmdlKGZpcnN0LCBsYXN0KTtcbn07XG5cblJhbmdlLnJhbmdlX19xbWFya19fID0gZnVuY3Rpb24gKHJhbmdlKSB7XG4gIHJldHVybiByYW5nZSBpbnN0YW5jZW9mIFJhbmdlO1xufTtcblxubGV0IEtleXdvcmQgPSB7fTtcblxuS2V5d29yZC5oYXNfa2V5X19xbV9fID0gZnVuY3Rpb24gKGtleXdvcmRzLCBrZXkpIHtcbiAgZm9yIChsZXQga2V5d29yZCBvZiBrZXl3b3Jkcykge1xuICAgIGlmIChLZXJuZWwuZWxlbShrZXl3b3JkLCAwKSA9PSBrZXkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbktleXdvcmQuZ2V0ID0gZnVuY3Rpb24gKGtleXdvcmRzLCBrZXksIHRoZV9kZWZhdWx0ID0gbnVsbCkge1xuICBmb3IgKGxldCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XG4gICAgaWYgKEtlcm5lbC5lbGVtKGtleXdvcmQsIDApID09IGtleSkge1xuICAgICAgcmV0dXJuIEtlcm5lbC5lbGVtKGtleXdvcmQsIDEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGVfZGVmYXVsdDtcbn07XG5cbmxldCBBZ2VudCA9IHt9O1xuXG5BZ2VudC5zdGFydCA9IGZ1bmN0aW9uIChmdW4sIG9wdGlvbnMgPSBbXSkge1xuICBjb25zdCBuYW1lID0gS2V5d29yZC5oYXNfa2V5X19xbV9fKG9wdGlvbnMsIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnbmFtZScpKSA/IEtleXdvcmQuZ2V0KG9wdGlvbnMsIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnbmFtZScpKSA6IFN5bWJvbCgpO1xuXG4gIHNlbGYucG9zdF9vZmZpY2UuYWRkX21haWxib3gobmFtZSk7XG4gIHNlbGYucG9zdF9vZmZpY2Uuc2VuZChuYW1lLCBmdW4oKSk7XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUoS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpLCBuYW1lKTtcbn07XG5cbkFnZW50LnN0b3AgPSBmdW5jdGlvbiAoYWdlbnQsIHRpbWVvdXQgPSA1MDAwKSB7XG4gIHNlbGYucG9zdF9vZmZpY2UucmVtb3ZlX21haWxib3goYWdlbnQpO1xuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpO1xufTtcblxuQWdlbnQudXBkYXRlID0gZnVuY3Rpb24gKGFnZW50LCBmdW4sIHRpbWVvdXQgPSA1MDAwKSB7XG5cbiAgY29uc3QgY3VycmVudF9zdGF0ZSA9IHNlbGYucG9zdF9vZmZpY2UucmVjZWl2ZShhZ2VudCk7XG4gIHNlbGYucG9zdF9vZmZpY2Uuc2VuZChhZ2VudCwgZnVuKGN1cnJlbnRfc3RhdGUpKTtcblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpO1xufTtcblxuQWdlbnQuZ2V0ID0gZnVuY3Rpb24gKGFnZW50LCBmdW4sIHRpbWVvdXQgPSA1MDAwKSB7XG4gIHJldHVybiBmdW4oc2VsZi5wb3N0X29mZmljZS5wZWVrKGFnZW50KSk7XG59O1xuXG5BZ2VudC5nZXRfYW5kX3VwZGF0ZSA9IGZ1bmN0aW9uIChhZ2VudCwgZnVuLCB0aW1lb3V0ID0gNTAwMCkge1xuXG4gIGNvbnN0IGdldF9hbmRfdXBkYXRlX3R1cGxlID0gZnVuKHNlbGYucG9zdF9vZmZpY2UucmVjZWl2ZShhZ2VudCkpO1xuICBzZWxmLnBvc3Rfb2ZmaWNlLnNlbmQoYWdlbnQsIEtlcm5lbC5lbGVtKGdldF9hbmRfdXBkYXRlX3R1cGxlLCAxKSk7XG5cbiAgcmV0dXJuIEtlcm5lbC5lbGVtKGdldF9hbmRfdXBkYXRlX3R1cGxlLCAwKTtcbn07XG5cbi8vaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvd0Jhc2U2NC9CYXNlNjRfZW5jb2RpbmdfYW5kX2RlY29kaW5nI1NvbHV0aW9uXzJfJUUyJTgwJTkzX3Jld3JpdGVfdGhlX0RPTXNfYXRvYigpX2FuZF9idG9hKClfdXNpbmdfSmF2YVNjcmlwdCdzX1R5cGVkQXJyYXlzX2FuZF9VVEYtOFxuZnVuY3Rpb24gYjY0RW5jb2RlVW5pY29kZShzdHIpIHtcbiAgcmV0dXJuIGJ0b2EoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikucmVwbGFjZSgvJShbMC05QS1GXXsyfSkvZywgZnVuY3Rpb24gKG1hdGNoLCBwMSkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKCcweCcgKyBwMSk7XG4gIH0pKTtcbn1cblxuZnVuY3Rpb24gZW5jb2RlNjQoZGF0YSkge1xuICByZXR1cm4gYjY0RW5jb2RlVW5pY29kZShkYXRhKTtcbn1cblxuZnVuY3Rpb24gZGVjb2RlNjQoZGF0YSkge1xuICB0cnkge1xuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnb2snKSwgYXRvYihkYXRhKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdlcnJvcicpO1xuICB9XG4gIHJldHVybiBidG9hKGRhdGEpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGU2NF9fZW1fXyhkYXRhKSB7XG4gIHJldHVybiBhdG9iKGRhdGEpO1xufVxuXG52YXIgQmFzZSA9IHtcbiAgZW5jb2RlNjQsXG4gIGRlY29kZTY0LFxuICBkZWNvZGU2NF9fZW1fX1xufTtcblxuZnVuY3Rpb24gYm5vdChleHByKSB7XG4gIHJldHVybiB+ZXhwcjtcbn1cblxuZnVuY3Rpb24gYmFuZChsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCAmIHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBib3IobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgfCByaWdodDtcbn1cblxuZnVuY3Rpb24gYnNsKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0IDw8IHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBic3IobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgPj4gcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGJ4b3IobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgXiByaWdodDtcbn1cblxudmFyIEJpdHdpc2UgPSB7XG4gIGJub3QsXG4gIGJhbmQsXG4gIGJvcixcbiAgYnNsLFxuICBic3IsXG4gIGJ4b3Jcbn07XG5cbmxldCBFbnVtZXJhYmxlID0gS2VybmVsLmRlZnByb3RvY29sKHtcbiAgY291bnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7fSxcbiAgbWVtYmVyX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCB2YWx1ZSkge30sXG4gIHJlZHVjZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGFjYywgZnVuKSB7fVxufSk7XG5cbmxldCBDb2xsZWN0YWJsZSA9IEtlcm5lbC5kZWZwcm90b2NvbCh7XG4gIGludG86IGZ1bmN0aW9uIChjb2xsZWN0YWJsZSkge31cbn0pO1xuXG5sZXQgSW5zcGVjdCA9IEtlcm5lbC5kZWZwcm90b2NvbCh7XG4gIGluc3BlY3Q6IGZ1bmN0aW9uICh0aGluZywgb3B0cykge31cbn0pO1xuXG5mdW5jdGlvbiBfX19uZXdfXygpIHtcbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAoe30pO1xufVxuXG5mdW5jdGlvbiBrZXlzKG1hcCkge1xuICByZXR1cm4gT2JqZWN0LmtleXMobWFwKTtcbn1cblxuZnVuY3Rpb24gX19zaXplKG1hcCkge1xuICByZXR1cm4ga2V5cyhtYXApLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gX190b19saXN0KG1hcCkge1xuICBsZXQgbWFwX2tleXMgPSBrZXlzKG1hcCk7XG4gIGxldCBsaXN0ID0gW107XG5cbiAgZm9yIChsZXQga2V5IG9mIG1hcF9rZXlzKSB7XG4gICAgbGlzdC5wdXNoKFNwZWNpYWxGb3Jtcy50dXBsZShrZXksIG1hcFtrZXldKSk7XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLmxpc3QoLi4ubGlzdCk7XG59XG5cbmZ1bmN0aW9uIHZhbHVlcyhtYXApIHtcbiAgbGV0IG1hcF9rZXlzID0ga2V5cyhtYXApO1xuICBsZXQgbGlzdCA9IFtdO1xuXG4gIGZvciAobGV0IGtleSBvZiBtYXBfa2V5cykge1xuICAgIGxpc3QucHVzaChtYXBba2V5XSk7XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLmxpc3QoLi4ubGlzdCk7XG59XG5cbmZ1bmN0aW9uIGZyb21fc3RydWN0KHN0cnVjdCkge1xuICBsZXQgbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgc3RydWN0KTtcbiAgZGVsZXRlIG1hcFtTeW1ib2wuZm9yKFwiX19zdHJ1Y3RfX1wiKV07XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobWFwKTtcbn1cblxuZnVuY3Rpb24gX19fX2RlbGV0ZV9fKG1hcCwga2V5KSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgbWFwKTtcblxuICBkZWxldGUgbmV3X21hcFtrZXldO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBkcm9wKG1hcCwga2V5cykge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG5cbiAgZm9yIChsZXQga2V5IG9mIGtleXMpIHtcbiAgICBkZWxldGUgbmV3X21hcFtrZXldO1xuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIF9fZXF1YWxfX3FtYXJrX18obWFwMSwgbWFwMikge1xuICByZXR1cm4gbWFwMSA9PT0gbWFwMjtcbn1cblxuZnVuY3Rpb24gZmV0Y2hfX2VtYXJrX18obWFwLCBrZXkpIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwW2tleV07XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJLZXkgbm90IGZvdW5kLlwiKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2gobWFwLCBrZXkpIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gU3BlY2lhbEZvcm1zLnR1cGxlKFNwZWNpYWxGb3Jtcy5hdG9tKFwib2tcIiksIG1hcFtrZXldKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMuYXRvbShcImVycm9yXCIpO1xufVxuXG5mdW5jdGlvbiBoYXNfa2V5X19xbWFya19fKG1hcCwga2V5KSB7XG4gIHJldHVybiBrZXkgaW4gbWFwO1xufVxuXG5mdW5jdGlvbiBtZXJnZShtYXAxLCBtYXAyKSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwX3VwZGF0ZShtYXAxLCBtYXAyKTtcbn1cblxuZnVuY3Rpb24gc3BsaXQobWFwLCBrZXlzKSB7XG4gIGxldCBzcGxpdDEgPSB7fTtcbiAgbGV0IHNwbGl0MiA9IHt9O1xuXG4gIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhtYXApKSB7XG4gICAgaWYgKGtleXMuaW5kZXhPZihrZXkpID4gLTEpIHtcbiAgICAgIHNwbGl0MVtrZXldID0gbWFwW2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHNwbGl0MltrZXldID0gbWFwW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy50dXBsZShTcGVjaWFsRm9ybXMubWFwKHNwbGl0MSksIFNwZWNpYWxGb3Jtcy5tYXAoc3BsaXQyKSk7XG59XG5cbmZ1bmN0aW9uIHRha2UobWFwLCBrZXlzKSB7XG4gIGxldCBzcGxpdDEgPSB7fTtcblxuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMobWFwKSkge1xuICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA+IC0xKSB7XG4gICAgICBzcGxpdDFba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKHNwbGl0MSk7XG59XG5cbmZ1bmN0aW9uIGRyb3AobWFwLCBrZXlzKSB7XG4gIGxldCBzcGxpdDEgPSB7fTtcblxuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMobWFwKSkge1xuICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA9PT0gLTEpIHtcbiAgICAgIHNwbGl0MVtrZXldID0gbWFwW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAoc3BsaXQxKTtcbn1cblxuZnVuY3Rpb24gcHV0X25ldyhtYXAsIGtleSwgdmFsdWUpIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSB2YWx1ZTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gcHV0X25ld19sYXp5KG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSBmdW4oKTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gZ2V0X2FuZF91cGRhdGUobWFwLCBrZXksIGZ1bikge1xuICBpZiAoa2V5IGluIG1hcCkge1xuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG4gIG5ld19tYXBba2V5XSA9IGZ1bihtYXBba2V5XSk7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHBvcF9sYXp5KG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKCFrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIFNwZWNpYWxGb3Jtcy50dXBsZShmdW4oKSwgbWFwKTtcbiAgfVxuXG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgbWFwKTtcbiAgbGV0IHZhbHVlID0gZnVuKG5ld19tYXBba2V5XSk7XG4gIGRlbGV0ZSBuZXdfbWFwW2tleV07XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy50dXBsZSh2YWx1ZSwgbmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHBvcChtYXAsIGtleSwgX2RlZmF1bHQgPSBudWxsKSB7XG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIHJldHVybiBTcGVjaWFsRm9ybXMudHVwbGUoX2RlZmF1bHQsIG1hcCk7XG4gIH1cblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG4gIGxldCB2YWx1ZSA9IG5ld19tYXBba2V5XTtcbiAgZGVsZXRlIG5ld19tYXBba2V5XTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLnR1cGxlKHZhbHVlLCBuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gZ2V0X2xhenkobWFwLCBrZXksIGZ1bikge1xuICBpZiAoIWtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gZnVuKCk7XG4gIH1cblxuICByZXR1cm4gZnVuKG1hcFtrZXldKTtcbn1cblxuZnVuY3Rpb24gZ2V0KG1hcCwga2V5LCBfZGVmYXVsdCA9IG51bGwpIHtcbiAgaWYgKCFrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIF9kZWZhdWx0O1xuICB9XG5cbiAgcmV0dXJuIG1hcFtrZXldO1xufVxuXG5mdW5jdGlvbiBfX3B1dChtYXAsIGtleSwgdmFsKSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0KHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSB2YWw7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZV9fZW1hcmtfXyhtYXAsIGtleSwgZnVuKSB7XG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIktleSBub3QgZm91bmRcIik7XG4gIH1cblxuICBsZXQgbmV3X21hcCA9IE9iamVjdCh7fSwgbWFwKTtcbiAgbmV3X21hcFtrZXldID0gZnVuKG1hcFtrZXldKTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gX3VwZGF0ZShtYXAsIGtleSwgaW5pdGlhbCwgZnVuKSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0KHt9LCBtYXApO1xuXG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIG5ld19tYXBba2V5XSA9IGluaXRpYWw7XG4gIH0gZWxzZSB7XG4gICAgbmV3X21hcFtrZXldID0gZnVuKG1hcFtrZXldKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG52YXIgX01hcCA9IHtcbiAgbmV3OiBfX19uZXdfXyxcbiAga2V5cyxcbiAgc2l6ZTogX19zaXplLFxuICB0b19saXN0OiBfX3RvX2xpc3QsXG4gIHZhbHVlcyxcbiAgZnJvbV9zdHJ1Y3QsXG4gIGRlbGV0ZTogX19fX2RlbGV0ZV9fLFxuICBkcm9wLFxuICBlcXVhbF9fcW1hcmtfXzogX19lcXVhbF9fcW1hcmtfXyxcbiAgZmV0Y2hfX2VtYXJrX18sXG4gIGZldGNoLFxuICBoYXNfa2V5X19xbWFya19fLFxuICBzcGxpdCxcbiAgdGFrZSxcbiAgcHV0X25ldyxcbiAgcHV0X25ld19sYXp5LFxuICBnZXRfYW5kX3VwZGF0ZSxcbiAgcG9wX2xhenksXG4gIHBvcCxcbiAgZ2V0X2xhenksXG4gIGdldCxcbiAgcHV0OiBfX3B1dCxcbiAgdXBkYXRlX19lbWFya19fLFxuICB1cGRhdGU6IF91cGRhdGVcbn07XG5cbmZ1bmN0aW9uIF9fbmV3X18oKSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKHsgW1N5bWJvbC5mb3IoJ19fc3RydWN0X18nKV06IFN5bWJvbC5mb3IoJ01hcFNldCcpLCBzZXQ6IFNwZWNpYWxGb3Jtcy5saXN0KCkgfSk7XG59XG5cbmZ1bmN0aW9uIF9zaXplKG1hcCkge1xuICByZXR1cm4gbWFwLnNldC5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIF90b19saXN0KG1hcCkge1xuICByZXR1cm4gbWFwLnNldDtcbn1cblxuZnVuY3Rpb24gX19fZGVsZXRlX18oc2V0LCB0ZXJtKSB7XG4gIGxldCBuZXdfbGlzdCA9IExpc3QuZGVsZXRlKHNldC5zZXQsIHRlcm0pO1xuXG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgc2V0KTtcbiAgbmV3X21hcC5zZXQgPSBuZXdfbGlzdDtcbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIF9wdXQoc2V0LCB0ZXJtKSB7XG4gIGlmIChzZXQuc2V0LmluZGV4T2YodGVybSkgPT09IC0xKSB7XG4gICAgbGV0IG5ld19saXN0ID0gTGlzdC5hcHBlbmQoc2V0LnNldCwgdGVybSk7XG5cbiAgICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIHNldCk7XG4gICAgbmV3X21hcC5zZXQgPSBuZXdfbGlzdDtcbiAgICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbiAgfVxuXG4gIHJldHVybiBzZXQ7XG59XG5cbmZ1bmN0aW9uIF9kaWZmZXJlbmNlKHNldDEsIHNldDIpIHtcbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBzZXQxKTtcblxuICBmb3IgKGxldCB2YWwgb2Ygc2V0MS5zZXQpIHtcbiAgICBpZiAoX21lbWJlcl9fcW1hcmtfXyhzZXQyLCB2YWwpKSB7XG4gICAgICBuZXdfbWFwLnNldCA9IExpc3QuZGVsZXRlKG5ld19tYXAuc2V0LCB2YWwpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBfaW50ZXJzZWN0aW9uKHNldDEsIHNldDIpIHtcbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBzZXQxKTtcblxuICBmb3IgKGxldCB2YWwgb2Ygc2V0MS5zZXQpIHtcbiAgICBpZiAoIV9tZW1iZXJfX3FtYXJrX18oc2V0MiwgdmFsKSkge1xuICAgICAgbmV3X21hcC5zZXQgPSBMaXN0LmRlbGV0ZShuZXdfbWFwLnNldCwgdmFsKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gX3VuaW9uKHNldDEsIHNldDIpIHtcbiAgbGV0IG5ld19tYXAgPSBzZXQxO1xuXG4gIGZvciAobGV0IHZhbCBvZiBzZXQyLnNldCkge1xuICAgIG5ld19tYXAgPSBfcHV0KG5ld19tYXAsIHZhbCk7XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gX2Rpc2pvaW5fX3FtYXJrX18oc2V0MSwgc2V0Mikge1xuICBmb3IgKGxldCB2YWwgb2Ygc2V0MS5zZXQpIHtcbiAgICBpZiAoX21lbWJlcl9fcW1hcmtfXyhzZXQyLCB2YWwpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIF9tZW1iZXJfX3FtYXJrX18oc2V0LCB2YWx1ZSkge1xuICByZXR1cm4gc2V0LnNldC5pbmRleE9mKHZhbHVlKSA+PSAwO1xufVxuXG5mdW5jdGlvbiBfZXF1YWxfX3FtYXJrX18oc2V0MSwgc2V0Mikge1xuICByZXR1cm4gc2V0MS5zZXQgPT09IHNldDIuc2V0O1xufVxuXG5mdW5jdGlvbiBfc3Vic2V0X19xbWFya19fKHNldDEsIHNldDIpIHtcbiAgZm9yIChsZXQgdmFsIG9mIHNldDEuc2V0KSB7XG4gICAgaWYgKCFfbWVtYmVyX19xbWFya19fKHNldDIsIHZhbCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxudmFyIE1hcFNldCA9IHtcbiAgbmV3OiBfX25ld19fLFxuICBzaXplOiBfc2l6ZSxcbiAgdG9fbGlzdDogX3RvX2xpc3QsXG4gIGRpc2pvaW5fX3FtYXJrX186IF9kaXNqb2luX19xbWFya19fLFxuICBkZWxldGU6IF9fX2RlbGV0ZV9fLFxuICBzdWJzZXRfX3FtYXJrX186IF9zdWJzZXRfX3FtYXJrX18sXG4gIGVxdWFsX19xbWFya19fOiBfZXF1YWxfX3FtYXJrX18sXG4gIG1lbWJlcl9fcW1hcmtfXzogX21lbWJlcl9fcW1hcmtfXyxcbiAgcHV0OiBfcHV0LFxuICB1bmlvbjogX3VuaW9uLFxuICBpbnRlcnNlY3Rpb246IF9pbnRlcnNlY3Rpb24sXG4gIGRpZmZlcmVuY2U6IF9kaWZmZXJlbmNlXG59O1xuXG5mdW5jdGlvbiBzaXplKG1hcCkge1xuICByZXR1cm4gTWFwU2V0LnNpemUobWFwKTtcbn1cblxuZnVuY3Rpb24gdG9fbGlzdChtYXApIHtcbiAgcmV0dXJuIE1hcFNldC50b19saXN0KG1hcCk7XG59XG5cbmZ1bmN0aW9uIF9fZGVsZXRlX18oc2V0LCB0ZXJtKSB7XG4gIHJldHVybiBNYXBTZXQuZGVsZXRlKHNldCwgdGVybSk7XG59XG5cbmZ1bmN0aW9uIHB1dChzZXQsIHRlcm0pIHtcbiAgcmV0dXJuIE1hcFNldC5wdXQoc2V0LCB0ZXJtKTtcbn1cblxuZnVuY3Rpb24gZGlmZmVyZW5jZShzZXQxLCBzZXQyKSB7XG4gIHJldHVybiBNYXBTZXQuZGlmZmVyZW5jZShzZXQxLCBzZXQyKTtcbn1cblxuZnVuY3Rpb24gaW50ZXJzZWN0aW9uKHNldDEsIHNldDIpIHtcbiAgcmV0dXJuIE1hcFNldC5pbnRlcnNlY3Rpb24oc2V0MSwgc2V0Mik7XG59XG5cbmZ1bmN0aW9uIHVuaW9uKHNldDEsIHNldDIpIHtcbiAgcmV0dXJuIE1hcFNldC51bmlvbihzZXQxLCBzZXQyKTtcbn1cblxuZnVuY3Rpb24gZGlzam9pbl9fcW1hcmtfXyhzZXQxLCBzZXQyKSB7XG4gIHJldHVybiBNYXBTZXQuZGlzam9pbl9fcW1hcmtfXyhzZXQxLCBzZXQyKTtcbn1cblxuZnVuY3Rpb24gbWVtYmVyX19xbWFya19fKHNldCwgdmFsdWUpIHtcbiAgcmV0dXJuIE1hcFNldC5tZW1iZXJfX3FtYXJrX18oc2V0MSwgc2V0Mik7XG59XG5cbmZ1bmN0aW9uIGVxdWFsX19xbWFya19fKHNldDEsIHNldDIpIHtcbiAgcmV0dXJuIE1hcFNldC5lcXVhbF9fcW1hcmtfXyhzZXQxLCBzZXQyKTtcbn1cblxuZnVuY3Rpb24gc3Vic2V0X19xbWFya19fKHNldDEsIHNldDIpIHtcbiAgcmV0dXJuIE1hcFNldC5zdWJzZXRfX3FtYXJrX18oc2V0MSwgc2V0Mik7XG59XG5cbnZhciBfU2V0ID0ge1xuICBzaXplLFxuICB0b19saXN0LFxuICBkaXNqb2luX19xbWFya19fLFxuICBkZWxldGU6IF9fZGVsZXRlX18sXG4gIHN1YnNldF9fcW1hcmtfXyxcbiAgZXF1YWxfX3FtYXJrX18sXG4gIG1lbWJlcl9fcW1hcmtfXyxcbiAgcHV0LFxuICB1bmlvbixcbiAgaW50ZXJzZWN0aW9uLFxuICBkaWZmZXJlbmNlXG59O1xuXG5sZXQgdmlydHVhbERvbSA9IChmdW5jdGlvbiAoZSkge1xuICAgIHJldHVybiBlKCk7XG59KShmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRlZmluZSwgbW9kdWxlLCBleHBvcnRzO1xuICAgIHJldHVybiAoZnVuY3Rpb24gZSh0LCBuLCByKSB7XG4gICAgICAgIGZ1bmN0aW9uIHMobywgdSkge1xuICAgICAgICAgICAgaWYgKCFuW29dKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0W29dKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhID0gdHlwZW9mIHJlcXVpcmUgPT0gXCJmdW5jdGlvblwiICYmIHJlcXVpcmU7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdSAmJiBhKSByZXR1cm4gYShvLCAhMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpKSByZXR1cm4gaShvLCAhMCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG8gKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IChmLmNvZGUgPSBcIk1PRFVMRV9OT1RfRk9VTkRcIiwgZik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBsID0gbltvXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0czoge31cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRbb11bMF0uY2FsbChsLmV4cG9ydHMsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuID0gdFtvXVsxXVtlXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHMobiA/IG4gOiBlKTtcbiAgICAgICAgICAgICAgICB9LCBsLCBsLmV4cG9ydHMsIGUsIHQsIG4sIHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5bb10uZXhwb3J0cztcbiAgICAgICAgfVxuICAgICAgICB2YXIgaSA9IHR5cGVvZiByZXF1aXJlID09IFwiZnVuY3Rpb25cIiAmJiByZXF1aXJlO1xuICAgICAgICBmb3IgKHZhciBvID0gMDsgbyA8IHIubGVuZ3RoOyBvKyspIHMocltvXSk7XG4gICAgICAgIHJldHVybiBzO1xuICAgIH0pKHtcbiAgICAgICAgMTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcblxuICAgICAgICAgICAgdmFyIGNyZWF0ZUVsZW1lbnQgPSByZXF1aXJlKFwiLi92ZG9tL2NyZWF0ZS1lbGVtZW50LmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUVsZW1lbnQ7XG4gICAgICAgIH0sIHsgXCIuL3Zkb20vY3JlYXRlLWVsZW1lbnQuanNcIjogMTUgfV0sIDI6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgZGlmZiA9IHJlcXVpcmUoXCIuL3Z0cmVlL2RpZmYuanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGlmZjtcbiAgICAgICAgfSwgeyBcIi4vdnRyZWUvZGlmZi5qc1wiOiAzNSB9XSwgMzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBoID0gcmVxdWlyZShcIi4vdmlydHVhbC1oeXBlcnNjcmlwdC9pbmRleC5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBoO1xuICAgICAgICB9LCB7IFwiLi92aXJ0dWFsLWh5cGVyc2NyaXB0L2luZGV4LmpzXCI6IDIyIH1dLCA0OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGRpZmYgPSByZXF1aXJlKFwiLi9kaWZmLmpzXCIpO1xuICAgICAgICAgICAgdmFyIHBhdGNoID0gcmVxdWlyZShcIi4vcGF0Y2guanNcIik7XG4gICAgICAgICAgICB2YXIgaCA9IHJlcXVpcmUoXCIuL2guanNcIik7XG4gICAgICAgICAgICB2YXIgY3JlYXRlID0gcmVxdWlyZShcIi4vY3JlYXRlLWVsZW1lbnQuanNcIik7XG4gICAgICAgICAgICB2YXIgVk5vZGUgPSByZXF1aXJlKFwiLi92bm9kZS92bm9kZS5qc1wiKTtcbiAgICAgICAgICAgIHZhciBWVGV4dCA9IHJlcXVpcmUoXCIuL3Zub2RlL3Z0ZXh0LmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgICAgICBkaWZmOiBkaWZmLFxuICAgICAgICAgICAgICAgIHBhdGNoOiBwYXRjaCxcbiAgICAgICAgICAgICAgICBoOiBoLFxuICAgICAgICAgICAgICAgIGNyZWF0ZTogY3JlYXRlLFxuICAgICAgICAgICAgICAgIFZOb2RlOiBWTm9kZSxcbiAgICAgICAgICAgICAgICBWVGV4dDogVlRleHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sIHsgXCIuL2NyZWF0ZS1lbGVtZW50LmpzXCI6IDEsIFwiLi9kaWZmLmpzXCI6IDIsIFwiLi9oLmpzXCI6IDMsIFwiLi9wYXRjaC5qc1wiOiAxMywgXCIuL3Zub2RlL3Zub2RlLmpzXCI6IDMxLCBcIi4vdm5vZGUvdnRleHQuanNcIjogMzMgfV0sIDU6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICAvKiFcbiAgICAgICAgICAgICAqIENyb3NzLUJyb3dzZXIgU3BsaXQgMS4xLjFcbiAgICAgICAgICAgICAqIENvcHlyaWdodCAyMDA3LTIwMTIgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+XG4gICAgICAgICAgICAgKiBBdmFpbGFibGUgdW5kZXIgdGhlIE1JVCBMaWNlbnNlXG4gICAgICAgICAgICAgKiBFQ01BU2NyaXB0IGNvbXBsaWFudCwgdW5pZm9ybSBjcm9zcy1icm93c2VyIHNwbGl0IG1ldGhvZFxuICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU3BsaXRzIGEgc3RyaW5nIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncyB1c2luZyBhIHJlZ2V4IG9yIHN0cmluZyBzZXBhcmF0b3IuIE1hdGNoZXMgb2YgdGhlXG4gICAgICAgICAgICAgKiBzZXBhcmF0b3IgYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0IGFycmF5LiBIb3dldmVyLCBpZiBgc2VwYXJhdG9yYCBpcyBhIHJlZ2V4IHRoYXQgY29udGFpbnNcbiAgICAgICAgICAgICAqIGNhcHR1cmluZyBncm91cHMsIGJhY2tyZWZlcmVuY2VzIGFyZSBzcGxpY2VkIGludG8gdGhlIHJlc3VsdCBlYWNoIHRpbWUgYHNlcGFyYXRvcmAgaXMgbWF0Y2hlZC5cbiAgICAgICAgICAgICAqIEZpeGVzIGJyb3dzZXIgYnVncyBjb21wYXJlZCB0byB0aGUgbmF0aXZlIGBTdHJpbmcucHJvdG90eXBlLnNwbGl0YCBhbmQgY2FuIGJlIHVzZWQgcmVsaWFibHlcbiAgICAgICAgICAgICAqIGNyb3NzLWJyb3dzZXIuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFN0cmluZyB0byBzcGxpdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7UmVnRXhwfFN0cmluZ30gc2VwYXJhdG9yIFJlZ2V4IG9yIHN0cmluZyB0byB1c2UgZm9yIHNlcGFyYXRpbmcgdGhlIHN0cmluZy5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbbGltaXRdIE1heGltdW0gbnVtYmVyIG9mIGl0ZW1zIHRvIGluY2x1ZGUgaW4gdGhlIHJlc3VsdCBhcnJheS5cbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtBcnJheX0gQXJyYXkgb2Ygc3Vic3RyaW5ncy5cbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLy8gQmFzaWMgdXNlXG4gICAgICAgICAgICAgKiBzcGxpdCgnYSBiIGMgZCcsICcgJyk7XG4gICAgICAgICAgICAgKiAvLyAtPiBbJ2EnLCAnYicsICdjJywgJ2QnXVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIFdpdGggbGltaXRcbiAgICAgICAgICAgICAqIHNwbGl0KCdhIGIgYyBkJywgJyAnLCAyKTtcbiAgICAgICAgICAgICAqIC8vIC0+IFsnYScsICdiJ11cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyBCYWNrcmVmZXJlbmNlcyBpbiByZXN1bHQgYXJyYXlcbiAgICAgICAgICAgICAqIHNwbGl0KCcuLndvcmQxIHdvcmQyLi4nLCAvKFthLXpdKykoXFxkKykvaSk7XG4gICAgICAgICAgICAgKiAvLyAtPiBbJy4uJywgJ3dvcmQnLCAnMScsICcgJywgJ3dvcmQnLCAnMicsICcuLiddXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIHNwbGl0KHVuZGVmKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgbmF0aXZlU3BsaXQgPSBTdHJpbmcucHJvdG90eXBlLnNwbGl0LFxuICAgICAgICAgICAgICAgICAgICBjb21wbGlhbnRFeGVjTnBjZyA9IC8oKT8/Ly5leGVjKFwiXCIpWzFdID09PSB1bmRlZixcblxuICAgICAgICAgICAgICAgIC8vIE5QQ0c6IG5vbnBhcnRpY2lwYXRpbmcgY2FwdHVyaW5nIGdyb3VwXG4gICAgICAgICAgICAgICAgc2VsZjtcblxuICAgICAgICAgICAgICAgIHNlbGYgPSBmdW5jdGlvbiAoc3RyLCBzZXBhcmF0b3IsIGxpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGBzZXBhcmF0b3JgIGlzIG5vdCBhIHJlZ2V4LCB1c2UgYG5hdGl2ZVNwbGl0YFxuICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHNlcGFyYXRvcikgIT09IFwiW29iamVjdCBSZWdFeHBdXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuYXRpdmVTcGxpdC5jYWxsKHN0ciwgc2VwYXJhdG9yLCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIG91dHB1dCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgPSAoc2VwYXJhdG9yLmlnbm9yZUNhc2UgPyBcImlcIiA6IFwiXCIpICsgKHNlcGFyYXRvci5tdWx0aWxpbmUgPyBcIm1cIiA6IFwiXCIpICsgKHNlcGFyYXRvci5leHRlbmRlZCA/IFwieFwiIDogXCJcIikgKyAoc2VwYXJhdG9yLnN0aWNreSA/IFwieVwiIDogXCJcIiksXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCAzK1xuICAgICAgICAgICAgICAgICAgICBsYXN0TGFzdEluZGV4ID0gMCxcblxuICAgICAgICAgICAgICAgICAgICAvLyBNYWtlIGBnbG9iYWxgIGFuZCBhdm9pZCBgbGFzdEluZGV4YCBpc3N1ZXMgYnkgd29ya2luZyB3aXRoIGEgY29weVxuICAgICAgICAgICAgICAgICAgICBzZXBhcmF0b3IgPSBuZXcgUmVnRXhwKHNlcGFyYXRvci5zb3VyY2UsIGZsYWdzICsgXCJnXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdG9yMixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdExlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IFwiXCI7IC8vIFR5cGUtY29udmVydFxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbXBsaWFudEV4ZWNOcGNnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb2Vzbid0IG5lZWQgZmxhZ3MgZ3ksIGJ1dCB0aGV5IGRvbid0IGh1cnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRvcjIgPSBuZXcgUmVnRXhwKFwiXlwiICsgc2VwYXJhdG9yLnNvdXJjZSArIFwiJCg/IVxcXFxzKVwiLCBmbGFncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogVmFsdWVzIGZvciBgbGltaXRgLCBwZXIgdGhlIHNwZWM6XG4gICAgICAgICAgICAgICAgICAgICAqIElmIHVuZGVmaW5lZDogNDI5NDk2NzI5NSAvLyBNYXRoLnBvdygyLCAzMikgLSAxXG4gICAgICAgICAgICAgICAgICAgICAqIElmIDAsIEluZmluaXR5LCBvciBOYU46IDBcbiAgICAgICAgICAgICAgICAgICAgICogSWYgcG9zaXRpdmUgbnVtYmVyOiBsaW1pdCA9IE1hdGguZmxvb3IobGltaXQpOyBpZiAobGltaXQgPiA0Mjk0OTY3Mjk1KSBsaW1pdCAtPSA0Mjk0OTY3Mjk2O1xuICAgICAgICAgICAgICAgICAgICAgKiBJZiBuZWdhdGl2ZSBudW1iZXI6IDQyOTQ5NjcyOTYgLSBNYXRoLmZsb29yKE1hdGguYWJzKGxpbWl0KSlcbiAgICAgICAgICAgICAgICAgICAgICogSWYgb3RoZXI6IFR5cGUtY29udmVydCwgdGhlbiB1c2UgdGhlIGFib3ZlIHJ1bGVzXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBsaW1pdCA9IGxpbWl0ID09PSB1bmRlZiA/IC0xID4+PiAwIDogLy8gTWF0aC5wb3coMiwgMzIpIC0gMVxuICAgICAgICAgICAgICAgICAgICBsaW1pdCA+Pj4gMDsgLy8gVG9VaW50MzIobGltaXQpXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChtYXRjaCA9IHNlcGFyYXRvci5leGVjKHN0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGBzZXBhcmF0b3IubGFzdEluZGV4YCBpcyBub3QgcmVsaWFibGUgY3Jvc3MtYnJvd3NlclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdEluZGV4ID4gbGFzdExhc3RJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKHN0ci5zbGljZShsYXN0TGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCBicm93c2VycyB3aG9zZSBgZXhlY2AgbWV0aG9kcyBkb24ndCBjb25zaXN0ZW50bHkgcmV0dXJuIGB1bmRlZmluZWRgIGZvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vbnBhcnRpY2lwYXRpbmcgY2FwdHVyaW5nIGdyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29tcGxpYW50RXhlY05wY2cgJiYgbWF0Y2gubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaFswXS5yZXBsYWNlKHNlcGFyYXRvcjIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aCAtIDI7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbaV0gPT09IHVuZGVmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoW2ldID0gdW5kZWY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCA+IDEgJiYgbWF0Y2guaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KG91dHB1dCwgbWF0Y2guc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0TGVuZ3RoID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RMYXN0SW5kZXggPSBsYXN0SW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dC5sZW5ndGggPj0gbGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlcGFyYXRvci5sYXN0SW5kZXggPT09IG1hdGNoLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdG9yLmxhc3RJbmRleCsrOyAvLyBBdm9pZCBhbiBpbmZpbml0ZSBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RMYXN0SW5kZXggPT09IHN0ci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0TGVuZ3RoIHx8ICFzZXBhcmF0b3IudGVzdChcIlwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goc3RyLnNsaWNlKGxhc3RMYXN0SW5kZXgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0cHV0Lmxlbmd0aCA+IGxpbWl0ID8gb3V0cHV0LnNsaWNlKDAsIGxpbWl0KSA6IG91dHB1dDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICB9LCB7fV0sIDY6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7fSwge31dLCA3OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgIHZhciBPbmVWZXJzaW9uQ29uc3RyYWludCA9IHJlcXVpcmUoXCJpbmRpdmlkdWFsL29uZS12ZXJzaW9uXCIpO1xuXG4gICAgICAgICAgICB2YXIgTVlfVkVSU0lPTiA9IFwiN1wiO1xuICAgICAgICAgICAgT25lVmVyc2lvbkNvbnN0cmFpbnQoXCJldi1zdG9yZVwiLCBNWV9WRVJTSU9OKTtcblxuICAgICAgICAgICAgdmFyIGhhc2hLZXkgPSBcIl9fRVZfU1RPUkVfS0VZQFwiICsgTVlfVkVSU0lPTjtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBFdlN0b3JlO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBFdlN0b3JlKGVsZW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IGVsZW1baGFzaEtleV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIWhhc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzaCA9IGVsZW1baGFzaEtleV0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcImluZGl2aWR1YWwvb25lLXZlcnNpb25cIjogOSB9XSwgODogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgICAgICAvKmdsb2JhbCB3aW5kb3csIGdsb2JhbCovXG5cbiAgICAgICAgICAgICAgICB2YXIgcm9vdCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDoge307XG5cbiAgICAgICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEluZGl2aWR1YWw7XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBJbmRpdmlkdWFsKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSBpbiByb290KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFtrZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcm9vdFtrZXldID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmNhbGwodGhpcywgdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSk7XG4gICAgICAgIH0sIHt9XSwgOTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICB2YXIgSW5kaXZpZHVhbCA9IHJlcXVpcmUoXCIuL2luZGV4LmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IE9uZVZlcnNpb247XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIE9uZVZlcnNpb24obW9kdWxlTmFtZSwgdmVyc2lvbiwgZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiX19JTkRJVklEVUFMX09ORV9WRVJTSU9OX1wiICsgbW9kdWxlTmFtZTtcbiAgICAgICAgICAgICAgICB2YXIgZW5mb3JjZUtleSA9IGtleSArIFwiX0VORk9SQ0VfU0lOR0xFVE9OXCI7XG5cbiAgICAgICAgICAgICAgICB2YXIgdmVyc2lvblZhbHVlID0gSW5kaXZpZHVhbChlbmZvcmNlS2V5LCB2ZXJzaW9uKTtcblxuICAgICAgICAgICAgICAgIGlmICh2ZXJzaW9uVmFsdWUgIT09IHZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuIG9ubHkgaGF2ZSBvbmUgY29weSBvZiBcIiArIG1vZHVsZU5hbWUgKyBcIi5cXG5cIiArIFwiWW91IGFscmVhZHkgaGF2ZSB2ZXJzaW9uIFwiICsgdmVyc2lvblZhbHVlICsgXCIgaW5zdGFsbGVkLlxcblwiICsgXCJUaGlzIG1lYW5zIHlvdSBjYW5ub3QgaW5zdGFsbCB2ZXJzaW9uIFwiICsgdmVyc2lvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIEluZGl2aWR1YWwoa2V5LCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi9pbmRleC5qc1wiOiA4IH1dLCAxMDogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRvcExldmVsID0gdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTtcbiAgICAgICAgICAgICAgICB2YXIgbWluRG9jID0gcmVxdWlyZShcIm1pbi1kb2N1bWVudFwiKTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jY3kgPSB0b3BMZXZlbFtcIl9fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDRcIl07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkb2NjeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jY3kgPSB0b3BMZXZlbFtcIl9fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDRcIl0gPSBtaW5Eb2M7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRvY2N5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmNhbGwodGhpcywgdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSk7XG4gICAgICAgIH0sIHsgXCJtaW4tZG9jdW1lbnRcIjogNiB9XSwgMTE6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdCh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT09IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LCB7fV0sIDEyOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIG5hdGl2ZUlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgICAgICAgICAgdmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBuYXRpdmVJc0FycmF5IHx8IGlzQXJyYXk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7fV0sIDEzOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIHBhdGNoID0gcmVxdWlyZShcIi4vdmRvbS9wYXRjaC5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBwYXRjaDtcbiAgICAgICAgfSwgeyBcIi4vdmRvbS9wYXRjaC5qc1wiOiAxOCB9XSwgMTQ6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaXNPYmplY3QgPSByZXF1aXJlKFwiaXMtb2JqZWN0XCIpO1xuICAgICAgICAgICAgdmFyIGlzSG9vayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12aG9vay5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhcHBseVByb3BlcnRpZXM7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFwcGx5UHJvcGVydGllcyhub2RlLCBwcm9wcywgcHJldmlvdXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcFZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUHJvcGVydHkobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSwgcHJldmlvdXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzSG9vayhwcm9wVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVQcm9wZXJ0eShub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlLCBwcmV2aW91cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcFZhbHVlLmhvb2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wVmFsdWUuaG9vayhub2RlLCBwcm9wTmFtZSwgcHJldmlvdXMgPyBwcmV2aW91c1twcm9wTmFtZV0gOiB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE9iamVjdChub2RlLCBwcm9wcywgcHJldmlvdXMsIHByb3BOYW1lLCBwcm9wVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IHByb3BWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlUHJvcGVydHkobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSwgcHJldmlvdXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJldmlvdXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzVmFsdWUgPSBwcmV2aW91c1twcm9wTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0hvb2socHJldmlvdXNWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wTmFtZSA9PT0gXCJhdHRyaWJ1dGVzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhdHRyTmFtZSBpbiBwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BOYW1lID09PSBcInN0eWxlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHByZXZpb3VzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZVtpXSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcHJldmlvdXNWYWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZXZpb3VzVmFsdWUudW5ob29rKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c1ZhbHVlLnVuaG9vayhub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcGF0Y2hPYmplY3Qobm9kZSwgcHJvcHMsIHByZXZpb3VzLCBwcm9wTmFtZSwgcHJvcFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzVmFsdWUgPSBwcmV2aW91cyA/IHByZXZpb3VzW3Byb3BOYW1lXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgIC8vIFNldCBhdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgaWYgKHByb3BOYW1lID09PSBcImF0dHJpYnV0ZXNcIikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhdHRyTmFtZSBpbiBwcm9wVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBwcm9wVmFsdWVbYXR0ck5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0clZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c1ZhbHVlICYmIGlzT2JqZWN0KHByZXZpb3VzVmFsdWUpICYmIGdldFByb3RvdHlwZShwcmV2aW91c1ZhbHVlKSAhPT0gZ2V0UHJvdG90eXBlKHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBwcm9wVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWlzT2JqZWN0KG5vZGVbcHJvcE5hbWVdKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciByZXBsYWNlciA9IHByb3BOYW1lID09PSBcInN0eWxlXCIgPyBcIlwiIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBwcm9wVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcHJvcFZhbHVlW2tdO1xuICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXVtrXSA9IHZhbHVlID09PSB1bmRlZmluZWQgPyByZXBsYWNlciA6IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0UHJvdG90eXBlKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLl9fcHJvdG9fXykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuX19wcm90b19fO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9pcy12aG9vay5qc1wiOiAyNiwgXCJpcy1vYmplY3RcIjogMTEgfV0sIDE1OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGRvY3VtZW50ID0gcmVxdWlyZShcImdsb2JhbC9kb2N1bWVudFwiKTtcblxuICAgICAgICAgICAgdmFyIGFwcGx5UHJvcGVydGllcyA9IHJlcXVpcmUoXCIuL2FwcGx5LXByb3BlcnRpZXNcIik7XG5cbiAgICAgICAgICAgIHZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZub2RlLmpzXCIpO1xuICAgICAgICAgICAgdmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdnRleHQuanNcIik7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCIpO1xuICAgICAgICAgICAgdmFyIGhhbmRsZVRodW5rID0gcmVxdWlyZShcIi4uL3Zub2RlL2hhbmRsZS10aHVuay5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVFbGVtZW50O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHZub2RlLCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IG9wdHMgPyBvcHRzLmRvY3VtZW50IHx8IGRvY3VtZW50IDogZG9jdW1lbnQ7XG4gICAgICAgICAgICAgICAgdmFyIHdhcm4gPSBvcHRzID8gb3B0cy53YXJuIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIHZub2RlID0gaGFuZGxlVGh1bmsodm5vZGUpLmE7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNXaWRnZXQodm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2bm9kZS5pbml0KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1ZUZXh0KHZub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWlzVk5vZGUodm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3YXJuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuKFwiSXRlbSBpcyBub3QgYSB2YWxpZCB2aXJ0dWFsIGRvbSBub2RlXCIsIHZub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHZub2RlLm5hbWVzcGFjZSA9PT0gbnVsbCA/IGRvYy5jcmVhdGVFbGVtZW50KHZub2RlLnRhZ05hbWUpIDogZG9jLmNyZWF0ZUVsZW1lbnROUyh2bm9kZS5uYW1lc3BhY2UsIHZub2RlLnRhZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHByb3BzID0gdm5vZGUucHJvcGVydGllcztcbiAgICAgICAgICAgICAgICBhcHBseVByb3BlcnRpZXMobm9kZSwgcHJvcHMpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZE5vZGUgPSBjcmVhdGVFbGVtZW50KGNoaWxkcmVuW2ldLCBvcHRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9oYW5kbGUtdGh1bmsuanNcIjogMjQsIFwiLi4vdm5vZGUvaXMtdm5vZGUuanNcIjogMjcsIFwiLi4vdm5vZGUvaXMtdnRleHQuanNcIjogMjgsIFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCI6IDI5LCBcIi4vYXBwbHktcHJvcGVydGllc1wiOiAxNCwgXCJnbG9iYWwvZG9jdW1lbnRcIjogMTAgfV0sIDE2OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgLy8gTWFwcyBhIHZpcnR1YWwgRE9NIHRyZWUgb250byBhIHJlYWwgRE9NIHRyZWUgaW4gYW4gZWZmaWNpZW50IG1hbm5lci5cbiAgICAgICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gcmVhZCBhbGwgb2YgdGhlIERPTSBub2RlcyBpbiB0aGUgdHJlZSBzbyB3ZSB1c2VcbiAgICAgICAgICAgIC8vIHRoZSBpbi1vcmRlciB0cmVlIGluZGV4aW5nIHRvIGVsaW1pbmF0ZSByZWN1cnNpb24gZG93biBjZXJ0YWluIGJyYW5jaGVzLlxuICAgICAgICAgICAgLy8gV2Ugb25seSByZWN1cnNlIGludG8gYSBET00gbm9kZSBpZiB3ZSBrbm93IHRoYXQgaXQgY29udGFpbnMgYSBjaGlsZCBvZlxuICAgICAgICAgICAgLy8gaW50ZXJlc3QuXG5cbiAgICAgICAgICAgIHZhciBub0NoaWxkID0ge307XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZG9tSW5kZXg7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvbUluZGV4KHJvb3ROb2RlLCB0cmVlLCBpbmRpY2VzLCBub2Rlcykge1xuICAgICAgICAgICAgICAgIGlmICghaW5kaWNlcyB8fCBpbmRpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5zb3J0KGFzY2VuZGluZyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWN1cnNlKHJvb3ROb2RlLCB0cmVlLCBpbmRpY2VzLCBub2RlcywgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZWN1cnNlKHJvb3ROb2RlLCB0cmVlLCBpbmRpY2VzLCBub2Rlcywgcm9vdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgbm9kZXMgPSBub2RlcyB8fCB7fTtcblxuICAgICAgICAgICAgICAgIGlmIChyb290Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhJblJhbmdlKGluZGljZXMsIHJvb3RJbmRleCwgcm9vdEluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXNbcm9vdEluZGV4XSA9IHJvb3ROb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHZDaGlsZHJlbiA9IHRyZWUuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZDaGlsZHJlbikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGROb2RlcyA9IHJvb3ROb2RlLmNoaWxkTm9kZXM7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJlZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RJbmRleCArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZDaGlsZCA9IHZDaGlsZHJlbltpXSB8fCBub0NoaWxkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXh0SW5kZXggPSByb290SW5kZXggKyAodkNoaWxkLmNvdW50IHx8IDApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCByZWN1cnNpb24gZG93biB0aGUgdHJlZSBpZiB0aGVyZSBhcmUgbm8gbm9kZXMgZG93biBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4SW5SYW5nZShpbmRpY2VzLCByb290SW5kZXgsIG5leHRJbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzZShjaGlsZE5vZGVzW2ldLCB2Q2hpbGQsIGluZGljZXMsIG5vZGVzLCByb290SW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RJbmRleCA9IG5leHRJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQmluYXJ5IHNlYXJjaCBmb3IgYW4gaW5kZXggaW4gdGhlIGludGVydmFsIFtsZWZ0LCByaWdodF1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGluZGV4SW5SYW5nZShpbmRpY2VzLCBsZWZ0LCByaWdodCkge1xuICAgICAgICAgICAgICAgIGlmIChpbmRpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG1pbkluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgbWF4SW5kZXggPSBpbmRpY2VzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJbmRleDtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW07XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAobWluSW5kZXggPD0gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEluZGV4ID0gKG1heEluZGV4ICsgbWluSW5kZXgpIC8gMiA+PiAwO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbSA9IGluZGljZXNbY3VycmVudEluZGV4XTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobWluSW5kZXggPT09IG1heEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudEl0ZW0gPj0gbGVmdCAmJiBjdXJyZW50SXRlbSA8PSByaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SXRlbSA8IGxlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbkluZGV4ID0gY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SXRlbSA+IHJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhJbmRleCA9IGN1cnJlbnRJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYXNjZW5kaW5nKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYSA+IGIgPyAxIDogLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHt9XSwgMTc6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgYXBwbHlQcm9wZXJ0aWVzID0gcmVxdWlyZShcIi4vYXBwbHktcHJvcGVydGllc1wiKTtcblxuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBWUGF0Y2ggPSByZXF1aXJlKFwiLi4vdm5vZGUvdnBhdGNoLmpzXCIpO1xuXG4gICAgICAgICAgICB2YXIgdXBkYXRlV2lkZ2V0ID0gcmVxdWlyZShcIi4vdXBkYXRlLXdpZGdldFwiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhcHBseVBhdGNoO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhcHBseVBhdGNoKHZwYXRjaCwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gdnBhdGNoLnR5cGU7XG4gICAgICAgICAgICAgICAgdmFyIHZOb2RlID0gdnBhdGNoLnZOb2RlO1xuICAgICAgICAgICAgICAgIHZhciBwYXRjaCA9IHZwYXRjaC5wYXRjaDtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5SRU1PVkU6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlTm9kZShkb21Ob2RlLCB2Tm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLklOU0VSVDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnNlcnROb2RlKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guVlRFWFQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nUGF0Y2goZG9tTm9kZSwgdk5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guV0lER0VUOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpZGdldFBhdGNoKGRvbU5vZGUsIHZOb2RlLCBwYXRjaCwgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLlZOT0RFOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZOb2RlUGF0Y2goZG9tTm9kZSwgdk5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guT1JERVI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZW9yZGVyQ2hpbGRyZW4oZG9tTm9kZSwgcGF0Y2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLlBST1BTOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlQcm9wZXJ0aWVzKGRvbU5vZGUsIHBhdGNoLCB2Tm9kZS5wcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkb21Ob2RlO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5USFVOSzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlUm9vdChkb21Ob2RlLCByZW5kZXJPcHRpb25zLnBhdGNoKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKSk7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9tTm9kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZU5vZGUoZG9tTm9kZSwgdk5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZG9tTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZGVzdHJveVdpZGdldChkb21Ob2RlLCB2Tm9kZSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaW5zZXJ0Tm9kZShwYXJlbnROb2RlLCB2Tm9kZSwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodk5vZGUsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5hcHBlbmRDaGlsZChuZXdOb2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc3RyaW5nUGF0Y2goZG9tTm9kZSwgbGVmdFZOb2RlLCB2VGV4dCwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBuZXdOb2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGRvbU5vZGUubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tTm9kZS5yZXBsYWNlRGF0YSgwLCBkb21Ob2RlLmxlbmd0aCwgdlRleHQudGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIG5ld05vZGUgPSBkb21Ob2RlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gZG9tTm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodlRleHQsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlICYmIG5ld05vZGUgIT09IGRvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIGRvbU5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdpZGdldFBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgd2lkZ2V0LCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVwZGF0aW5nID0gdXBkYXRlV2lkZ2V0KGxlZnRWTm9kZSwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZTtcblxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGluZykge1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gd2lkZ2V0LnVwZGF0ZShsZWZ0Vk5vZGUsIGRvbU5vZGUpIHx8IGRvbU5vZGU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHdpZGdldCwgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGU7XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSAmJiBuZXdOb2RlICE9PSBkb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIGRvbU5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdXBkYXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzdHJveVdpZGdldChkb21Ob2RlLCBsZWZ0Vk5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdOb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB2Tm9kZVBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgdk5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZOb2RlLCByZW5kZXJPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlICYmIG5ld05vZGUgIT09IGRvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgZG9tTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXQoZG9tTm9kZSwgdykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygdy5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIgJiYgaXNXaWRnZXQodykpIHtcbiAgICAgICAgICAgICAgICAgICAgdy5kZXN0cm95KGRvbU5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVvcmRlckNoaWxkcmVuKGRvbU5vZGUsIG1vdmVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSBkb21Ob2RlLmNoaWxkTm9kZXM7XG4gICAgICAgICAgICAgICAgdmFyIGtleU1hcCA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBub2RlO1xuICAgICAgICAgICAgICAgIHZhciByZW1vdmU7XG4gICAgICAgICAgICAgICAgdmFyIGluc2VydDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW92ZXMucmVtb3Zlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmUgPSBtb3Zlcy5yZW1vdmVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBub2RlID0gY2hpbGROb2Rlc1tyZW1vdmUuZnJvbV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZW1vdmUua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlNYXBbcmVtb3ZlLmtleV0gPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRvbU5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGNoaWxkTm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbW92ZXMuaW5zZXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnQgPSBtb3Zlcy5pbnNlcnRzW2pdO1xuICAgICAgICAgICAgICAgICAgICBub2RlID0ga2V5TWFwW2luc2VydC5rZXldO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHRoZSB3ZWlyZGVzdCBidWcgaSd2ZSBldmVyIHNlZW4gaW4gd2Via2l0XG4gICAgICAgICAgICAgICAgICAgIGRvbU5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIGluc2VydC50byA+PSBsZW5ndGgrKyA/IG51bGwgOiBjaGlsZE5vZGVzW2luc2VydC50b10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVwbGFjZVJvb3Qob2xkUm9vdCwgbmV3Um9vdCkge1xuICAgICAgICAgICAgICAgIGlmIChvbGRSb290ICYmIG5ld1Jvb3QgJiYgb2xkUm9vdCAhPT0gbmV3Um9vdCAmJiBvbGRSb290LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgb2xkUm9vdC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdSb290LCBvbGRSb290KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3Um9vdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiOiAyOSwgXCIuLi92bm9kZS92cGF0Y2guanNcIjogMzIsIFwiLi9hcHBseS1wcm9wZXJ0aWVzXCI6IDE0LCBcIi4vdXBkYXRlLXdpZGdldFwiOiAxOSB9XSwgMTg6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgZG9jdW1lbnQgPSByZXF1aXJlKFwiZ2xvYmFsL2RvY3VtZW50XCIpO1xuICAgICAgICAgICAgdmFyIGlzQXJyYXkgPSByZXF1aXJlKFwieC1pcy1hcnJheVwiKTtcblxuICAgICAgICAgICAgdmFyIHJlbmRlciA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1lbGVtZW50XCIpO1xuICAgICAgICAgICAgdmFyIGRvbUluZGV4ID0gcmVxdWlyZShcIi4vZG9tLWluZGV4XCIpO1xuICAgICAgICAgICAgdmFyIHBhdGNoT3AgPSByZXF1aXJlKFwiLi9wYXRjaC1vcFwiKTtcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gcGF0Y2g7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHBhdGNoKHJvb3ROb2RlLCBwYXRjaGVzLCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyT3B0aW9ucyA9IHJlbmRlck9wdGlvbnMgfHwge307XG4gICAgICAgICAgICAgICAgcmVuZGVyT3B0aW9ucy5wYXRjaCA9IHJlbmRlck9wdGlvbnMucGF0Y2ggJiYgcmVuZGVyT3B0aW9ucy5wYXRjaCAhPT0gcGF0Y2ggPyByZW5kZXJPcHRpb25zLnBhdGNoIDogcGF0Y2hSZWN1cnNpdmU7XG4gICAgICAgICAgICAgICAgcmVuZGVyT3B0aW9ucy5yZW5kZXIgPSByZW5kZXJPcHRpb25zLnJlbmRlciB8fCByZW5kZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVuZGVyT3B0aW9ucy5wYXRjaChyb290Tm9kZSwgcGF0Y2hlcywgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHBhdGNoUmVjdXJzaXZlKHJvb3ROb2RlLCBwYXRjaGVzLCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGljZXMgPSBwYXRjaEluZGljZXMocGF0Y2hlcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5kaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3ROb2RlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGRvbUluZGV4KHJvb3ROb2RlLCBwYXRjaGVzLmEsIGluZGljZXMpO1xuICAgICAgICAgICAgICAgIHZhciBvd25lckRvY3VtZW50ID0gcm9vdE5vZGUub3duZXJEb2N1bWVudDtcblxuICAgICAgICAgICAgICAgIGlmICghcmVuZGVyT3B0aW9ucy5kb2N1bWVudCAmJiBvd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJPcHRpb25zLmRvY3VtZW50ID0gb3duZXJEb2N1bWVudDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVJbmRleCA9IGluZGljZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIHJvb3ROb2RlID0gYXBwbHlQYXRjaChyb290Tm9kZSwgaW5kZXhbbm9kZUluZGV4XSwgcGF0Y2hlc1tub2RlSW5kZXhdLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFwcGx5UGF0Y2gocm9vdE5vZGUsIGRvbU5vZGUsIHBhdGNoTGlzdCwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmICghZG9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG5ld05vZGU7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNBcnJheShwYXRjaExpc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0Y2hMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gcGF0Y2hPcChwYXRjaExpc3RbaV0sIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9tTm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290Tm9kZSA9IG5ld05vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gcGF0Y2hPcChwYXRjaExpc3QsIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21Ob2RlID09PSByb290Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdE5vZGUgPSBuZXdOb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvb3ROb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBwYXRjaEluZGljZXMocGF0Y2hlcykge1xuICAgICAgICAgICAgICAgIHZhciBpbmRpY2VzID0gW107XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcGF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSBcImFcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKE51bWJlcihrZXkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRpY2VzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi9jcmVhdGUtZWxlbWVudFwiOiAxNSwgXCIuL2RvbS1pbmRleFwiOiAxNiwgXCIuL3BhdGNoLW9wXCI6IDE3LCBcImdsb2JhbC9kb2N1bWVudFwiOiAxMCwgXCJ4LWlzLWFycmF5XCI6IDEyIH1dLCAxOTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gdXBkYXRlV2lkZ2V0O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVXaWRnZXQoYSwgYikge1xuICAgICAgICAgICAgICAgIGlmIChpc1dpZGdldChhKSAmJiBpc1dpZGdldChiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJuYW1lXCIgaW4gYSAmJiBcIm5hbWVcIiBpbiBiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5pZCA9PT0gYi5pZDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLmluaXQgPT09IGIuaW5pdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiOiAyOSB9XSwgMjA6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgdmFyIEV2U3RvcmUgPSByZXF1aXJlKFwiZXYtc3RvcmVcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gRXZIb29rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBFdkhvb2sodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRXZIb29rKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV2SG9vayh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBFdkhvb2sucHJvdG90eXBlLmhvb2sgPSBmdW5jdGlvbiAobm9kZSwgcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVzID0gRXZTdG9yZShub2RlKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcE5hbWUgPSBwcm9wZXJ0eU5hbWUuc3Vic3RyKDMpO1xuXG4gICAgICAgICAgICAgICAgZXNbcHJvcE5hbWVdID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIEV2SG9vay5wcm90b3R5cGUudW5ob29rID0gZnVuY3Rpb24gKG5vZGUsIHByb3BlcnR5TmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBlcyA9IEV2U3RvcmUobm9kZSk7XG4gICAgICAgICAgICAgICAgdmFyIHByb3BOYW1lID0gcHJvcGVydHlOYW1lLnN1YnN0cigzKTtcblxuICAgICAgICAgICAgICAgIGVzW3Byb3BOYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sIHsgXCJldi1zdG9yZVwiOiA3IH1dLCAyMTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IFNvZnRTZXRIb29rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBTb2Z0U2V0SG9vayh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTb2Z0U2V0SG9vaykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTb2Z0U2V0SG9vayh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBTb2Z0U2V0SG9vay5wcm90b3R5cGUuaG9vayA9IGZ1bmN0aW9uIChub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZVtwcm9wZXJ0eU5hbWVdICE9PSB0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcGVydHlOYW1lXSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSwge31dLCAyMjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICB2YXIgaXNBcnJheSA9IHJlcXVpcmUoXCJ4LWlzLWFycmF5XCIpO1xuXG4gICAgICAgICAgICB2YXIgVk5vZGUgPSByZXF1aXJlKFwiLi4vdm5vZGUvdm5vZGUuanNcIik7XG4gICAgICAgICAgICB2YXIgVlRleHQgPSByZXF1aXJlKFwiLi4vdm5vZGUvdnRleHQuanNcIik7XG4gICAgICAgICAgICB2YXIgaXNWTm9kZSA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12bm9kZVwiKTtcbiAgICAgICAgICAgIHZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZ0ZXh0XCIpO1xuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldFwiKTtcbiAgICAgICAgICAgIHZhciBpc0hvb2sgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdmhvb2tcIik7XG4gICAgICAgICAgICB2YXIgaXNWVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdGh1bmtcIik7XG5cbiAgICAgICAgICAgIHZhciBwYXJzZVRhZyA9IHJlcXVpcmUoXCIuL3BhcnNlLXRhZy5qc1wiKTtcbiAgICAgICAgICAgIHZhciBzb2Z0U2V0SG9vayA9IHJlcXVpcmUoXCIuL2hvb2tzL3NvZnQtc2V0LWhvb2suanNcIik7XG4gICAgICAgICAgICB2YXIgZXZIb29rID0gcmVxdWlyZShcIi4vaG9va3MvZXYtaG9vay5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBoO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBoKHRhZ05hbWUsIHByb3BlcnRpZXMsIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgdGFnLCBwcm9wcywga2V5LCBuYW1lc3BhY2U7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWNoaWxkcmVuICYmIGlzQ2hpbGRyZW4ocHJvcGVydGllcykpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4gPSBwcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcyA9IHt9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByb3BzID0gcHJvcHMgfHwgcHJvcGVydGllcyB8fCB7fTtcbiAgICAgICAgICAgICAgICB0YWcgPSBwYXJzZVRhZyh0YWdOYW1lLCBwcm9wcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBzdXBwb3J0IGtleXNcbiAgICAgICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkoXCJrZXlcIikpIHtcbiAgICAgICAgICAgICAgICAgICAga2V5ID0gcHJvcHMua2V5O1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5rZXkgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gc3VwcG9ydCBuYW1lc3BhY2VcbiAgICAgICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkoXCJuYW1lc3BhY2VcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlID0gcHJvcHMubmFtZXNwYWNlO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5uYW1lc3BhY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZml4IGN1cnNvciBidWdcbiAgICAgICAgICAgICAgICBpZiAodGFnID09PSBcIklOUFVUXCIgJiYgIW5hbWVzcGFjZSAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eShcInZhbHVlXCIpICYmIHByb3BzLnZhbHVlICE9PSB1bmRlZmluZWQgJiYgIWlzSG9vayhwcm9wcy52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMudmFsdWUgPSBzb2Z0U2V0SG9vayhwcm9wcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtUHJvcGVydGllcyhwcm9wcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4gIT09IHVuZGVmaW5lZCAmJiBjaGlsZHJlbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBhZGRDaGlsZChjaGlsZHJlbiwgY2hpbGROb2RlcywgdGFnLCBwcm9wcyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBWTm9kZSh0YWcsIHByb3BzLCBjaGlsZE5vZGVzLCBrZXksIG5hbWVzcGFjZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZENoaWxkKGMsIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGROb2Rlcy5wdXNoKG5ldyBWVGV4dChjKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGVzLnB1c2gobmV3IFZUZXh0KFN0cmluZyhjKSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNDaGlsZChjKSkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGVzLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ2hpbGQoY1tpXSwgY2hpbGROb2RlcywgdGFnLCBwcm9wcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGMgPT09IG51bGwgfHwgYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBVbmV4cGVjdGVkVmlydHVhbEVsZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yZWlnbk9iamVjdDogYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFZub2RlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZTogdGFnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHByb3BzXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdHJhbnNmb3JtUHJvcGVydGllcyhwcm9wcykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSG9vayh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BOYW1lLnN1YnN0cigwLCAzKSA9PT0gXCJldi1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZCBldi1mb28gc3VwcG9ydFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzW3Byb3BOYW1lXSA9IGV2SG9vayh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzQ2hpbGQoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc1ZOb2RlKHgpIHx8IGlzVlRleHQoeCkgfHwgaXNXaWRnZXQoeCkgfHwgaXNWVGh1bmsoeCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzQ2hpbGRyZW4oeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzdHJpbmdcIiB8fCBpc0FycmF5KHgpIHx8IGlzQ2hpbGQoeCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFVuZXhwZWN0ZWRWaXJ0dWFsRWxlbWVudChkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuXG4gICAgICAgICAgICAgICAgZXJyLnR5cGUgPSBcInZpcnR1YWwtaHlwZXJzY3JpcHQudW5leHBlY3RlZC52aXJ0dWFsLWVsZW1lbnRcIjtcbiAgICAgICAgICAgICAgICBlcnIubWVzc2FnZSA9IFwiVW5leHBlY3RlZCB2aXJ0dWFsIGNoaWxkIHBhc3NlZCB0byBoKCkuXFxuXCIgKyBcIkV4cGVjdGVkIGEgVk5vZGUgLyBWdGh1bmsgLyBWV2lkZ2V0IC8gc3RyaW5nIGJ1dDpcXG5cIiArIFwiZ290OlxcblwiICsgZXJyb3JTdHJpbmcoZGF0YS5mb3JlaWduT2JqZWN0KSArIFwiLlxcblwiICsgXCJUaGUgcGFyZW50IHZub2RlIGlzOlxcblwiICsgZXJyb3JTdHJpbmcoZGF0YS5wYXJlbnRWbm9kZSk7XG4gICAgICAgICAgICAgICAgXCJcXG5cIiArIFwiU3VnZ2VzdGVkIGZpeDogY2hhbmdlIHlvdXIgYGgoLi4uLCBbIC4uLiBdKWAgY2FsbHNpdGUuXCI7XG4gICAgICAgICAgICAgICAgZXJyLmZvcmVpZ25PYmplY3QgPSBkYXRhLmZvcmVpZ25PYmplY3Q7XG4gICAgICAgICAgICAgICAgZXJyLnBhcmVudFZub2RlID0gZGF0YS5wYXJlbnRWbm9kZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGVycm9yU3RyaW5nKG9iaikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIFwiICAgIFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcob2JqKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9pcy10aHVua1wiOiAyNSwgXCIuLi92bm9kZS9pcy12aG9va1wiOiAyNiwgXCIuLi92bm9kZS9pcy12bm9kZVwiOiAyNywgXCIuLi92bm9kZS9pcy12dGV4dFwiOiAyOCwgXCIuLi92bm9kZS9pcy13aWRnZXRcIjogMjksIFwiLi4vdm5vZGUvdm5vZGUuanNcIjogMzEsIFwiLi4vdm5vZGUvdnRleHQuanNcIjogMzMsIFwiLi9ob29rcy9ldi1ob29rLmpzXCI6IDIwLCBcIi4vaG9va3Mvc29mdC1zZXQtaG9vay5qc1wiOiAyMSwgXCIuL3BhcnNlLXRhZy5qc1wiOiAyMywgXCJ4LWlzLWFycmF5XCI6IDEyIH1dLCAyMzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICB2YXIgc3BsaXQgPSByZXF1aXJlKFwiYnJvd3Nlci1zcGxpdFwiKTtcblxuICAgICAgICAgICAgdmFyIGNsYXNzSWRTcGxpdCA9IC8oW1xcLiNdP1thLXpBLVowLTlcXHUwMDdGLVxcdUZGRkZfOi1dKykvO1xuICAgICAgICAgICAgdmFyIG5vdENsYXNzSWQgPSAvXlxcLnwjLztcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBwYXJzZVRhZztcblxuICAgICAgICAgICAgZnVuY3Rpb24gcGFyc2VUYWcodGFnLCBwcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICghdGFnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkRJVlwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBub0lkID0gIXByb3BzLmhhc093blByb3BlcnR5KFwiaWRcIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGFnUGFydHMgPSBzcGxpdCh0YWcsIGNsYXNzSWRTcGxpdCk7XG4gICAgICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKG5vdENsYXNzSWQudGVzdCh0YWdQYXJ0c1sxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSA9IFwiRElWXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzZXMsIHBhcnQsIHR5cGUsIGk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFnUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydCA9IHRhZ1BhcnRzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gcGFydC5jaGFyQXQoMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lID0gcGFydDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIi5cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2gocGFydC5zdWJzdHJpbmcoMSwgcGFydC5sZW5ndGgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIiNcIiAmJiBub0lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5pZCA9IHBhcnQuc3Vic3RyaW5nKDEsIHBhcnQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjbGFzc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaChwcm9wcy5jbGFzc05hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcHJvcHMuY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKFwiIFwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHMubmFtZXNwYWNlID8gdGFnTmFtZSA6IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcImJyb3dzZXItc3BsaXRcIjogNSB9XSwgMjQ6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaXNWTm9kZSA9IHJlcXVpcmUoXCIuL2lzLXZub2RlXCIpO1xuICAgICAgICAgICAgdmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi9pcy12dGV4dFwiKTtcbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuL2lzLXdpZGdldFwiKTtcbiAgICAgICAgICAgIHZhciBpc1RodW5rID0gcmVxdWlyZShcIi4vaXMtdGh1bmtcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaGFuZGxlVGh1bms7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZVRodW5rKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVuZGVyZWRBID0gYTtcbiAgICAgICAgICAgICAgICB2YXIgcmVuZGVyZWRCID0gYjtcblxuICAgICAgICAgICAgICAgIGlmIChpc1RodW5rKGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkQiA9IHJlbmRlclRodW5rKGIsIGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc1RodW5rKGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkQSA9IHJlbmRlclRodW5rKGEsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGE6IHJlbmRlcmVkQSxcbiAgICAgICAgICAgICAgICAgICAgYjogcmVuZGVyZWRCXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVuZGVyVGh1bmsodGh1bmssIHByZXZpb3VzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlbmRlcmVkVGh1bmsgPSB0aHVuay52bm9kZTtcblxuICAgICAgICAgICAgICAgIGlmICghcmVuZGVyZWRUaHVuaykge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJlZFRodW5rID0gdGh1bmsudm5vZGUgPSB0aHVuay5yZW5kZXIocHJldmlvdXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghKGlzVk5vZGUocmVuZGVyZWRUaHVuaykgfHwgaXNWVGV4dChyZW5kZXJlZFRodW5rKSB8fCBpc1dpZGdldChyZW5kZXJlZFRodW5rKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGh1bmsgZGlkIG5vdCByZXR1cm4gYSB2YWxpZCBub2RlXCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZW5kZXJlZFRodW5rO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi9pcy10aHVua1wiOiAyNSwgXCIuL2lzLXZub2RlXCI6IDI3LCBcIi4vaXMtdnRleHRcIjogMjgsIFwiLi9pcy13aWRnZXRcIjogMjkgfV0sIDI1OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBpc1RodW5rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc1RodW5rKHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdCAmJiB0LnR5cGUgPT09IFwiVGh1bmtcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge31dLCAyNjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaXNIb29rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc0hvb2soaG9vaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBob29rICYmICh0eXBlb2YgaG9vay5ob29rID09PSBcImZ1bmN0aW9uXCIgJiYgIWhvb2suaGFzT3duUHJvcGVydHkoXCJob29rXCIpIHx8IHR5cGVvZiBob29rLnVuaG9vayA9PT0gXCJmdW5jdGlvblwiICYmICFob29rLmhhc093blByb3BlcnR5KFwidW5ob29rXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge31dLCAyNzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBpc1ZpcnR1YWxOb2RlO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc1ZpcnR1YWxOb2RlKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geCAmJiB4LnR5cGUgPT09IFwiVmlydHVhbE5vZGVcIiAmJiB4LnZlcnNpb24gPT09IHZlcnNpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuL3ZlcnNpb25cIjogMzAgfV0sIDI4OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGlzVmlydHVhbFRleHQ7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzVmlydHVhbFRleHQoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4ICYmIHgudHlwZSA9PT0gXCJWaXJ0dWFsVGV4dFwiICYmIHgudmVyc2lvbiA9PT0gdmVyc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4vdmVyc2lvblwiOiAzMCB9XSwgMjk6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGlzV2lkZ2V0O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc1dpZGdldCh3KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHcgJiYgdy50eXBlID09PSBcIldpZGdldFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7fV0sIDMwOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBcIjJcIjtcbiAgICAgICAgfSwge31dLCAzMTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcbiAgICAgICAgICAgIHZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4vaXMtdm5vZGVcIik7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi9pcy13aWRnZXRcIik7XG4gICAgICAgICAgICB2YXIgaXNUaHVuayA9IHJlcXVpcmUoXCIuL2lzLXRodW5rXCIpO1xuICAgICAgICAgICAgdmFyIGlzVkhvb2sgPSByZXF1aXJlKFwiLi9pcy12aG9va1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBWaXJ0dWFsTm9kZTtcblxuICAgICAgICAgICAgdmFyIG5vUHJvcGVydGllcyA9IHt9O1xuICAgICAgICAgICAgdmFyIG5vQ2hpbGRyZW4gPSBbXTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gVmlydHVhbE5vZGUodGFnTmFtZSwgcHJvcGVydGllcywgY2hpbGRyZW4sIGtleSwgbmFtZXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YWdOYW1lID0gdGFnTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzIHx8IG5vUHJvcGVydGllcztcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW4gfHwgbm9DaGlsZHJlbjtcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9IGtleSAhPSBudWxsID8gU3RyaW5nKGtleSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSB0eXBlb2YgbmFtZXNwYWNlID09PSBcInN0cmluZ1wiID8gbmFtZXNwYWNlIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCB8fCAwO1xuICAgICAgICAgICAgICAgIHZhciBkZXNjZW5kYW50cyA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGhhc1dpZGdldHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgaGFzVGh1bmtzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGRlc2NlbmRhbnRIb29rcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBob29rcztcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBwcm9wZXJ0aWVzW3Byb3BOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZIb29rKHByb3BlcnR5KSAmJiBwcm9wZXJ0eS51bmhvb2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhvb2tzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9va3NbcHJvcE5hbWVdID0gcHJvcGVydHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZOb2RlKGNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY2VuZGFudHMgKz0gY2hpbGQuY291bnQgfHwgMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNXaWRnZXRzICYmIGNoaWxkLmhhc1dpZGdldHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNXaWRnZXRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNUaHVua3MgJiYgY2hpbGQuaGFzVGh1bmtzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzVGh1bmtzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkZXNjZW5kYW50SG9va3MgJiYgKGNoaWxkLmhvb2tzIHx8IGNoaWxkLmRlc2NlbmRhbnRIb29rcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjZW5kYW50SG9va3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFoYXNXaWRnZXRzICYmIGlzV2lkZ2V0KGNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGlsZC5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNXaWRnZXRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaGFzVGh1bmtzICYmIGlzVGh1bmsoY2hpbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNUaHVua3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IGNvdW50ICsgZGVzY2VuZGFudHM7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNXaWRnZXRzID0gaGFzV2lkZ2V0cztcbiAgICAgICAgICAgICAgICB0aGlzLmhhc1RodW5rcyA9IGhhc1RodW5rcztcbiAgICAgICAgICAgICAgICB0aGlzLmhvb2tzID0gaG9va3M7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXNjZW5kYW50SG9va3MgPSBkZXNjZW5kYW50SG9va3M7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFZpcnR1YWxOb2RlLnByb3RvdHlwZS52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgIFZpcnR1YWxOb2RlLnByb3RvdHlwZS50eXBlID0gXCJWaXJ0dWFsTm9kZVwiO1xuICAgICAgICB9LCB7IFwiLi9pcy10aHVua1wiOiAyNSwgXCIuL2lzLXZob29rXCI6IDI2LCBcIi4vaXMtdm5vZGVcIjogMjcsIFwiLi9pcy13aWRnZXRcIjogMjksIFwiLi92ZXJzaW9uXCI6IDMwIH1dLCAzMjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcblxuICAgICAgICAgICAgVmlydHVhbFBhdGNoLk5PTkUgPSAwO1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLlZURVhUID0gMTtcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5WTk9ERSA9IDI7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guV0lER0VUID0gMztcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5QUk9QUyA9IDQ7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guT1JERVIgPSA1O1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLklOU0VSVCA9IDY7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guUkVNT1ZFID0gNztcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5USFVOSyA9IDg7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gVmlydHVhbFBhdGNoO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBWaXJ0dWFsUGF0Y2godHlwZSwgdk5vZGUsIHBhdGNoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gTnVtYmVyKHR5cGUpO1xuICAgICAgICAgICAgICAgIHRoaXMudk5vZGUgPSB2Tm9kZTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGNoID0gcGF0Y2g7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5wcm90b3R5cGUudmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2gucHJvdG90eXBlLnR5cGUgPSBcIlZpcnR1YWxQYXRjaFwiO1xuICAgICAgICB9LCB7IFwiLi92ZXJzaW9uXCI6IDMwIH1dLCAzMzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBWaXJ0dWFsVGV4dDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gVmlydHVhbFRleHQodGV4dCkge1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dCA9IFN0cmluZyh0ZXh0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgVmlydHVhbFRleHQucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgICAgVmlydHVhbFRleHQucHJvdG90eXBlLnR5cGUgPSBcIlZpcnR1YWxUZXh0XCI7XG4gICAgICAgIH0sIHsgXCIuL3ZlcnNpb25cIjogMzAgfV0sIDM0OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gcmVxdWlyZShcImlzLW9iamVjdFwiKTtcbiAgICAgICAgICAgIHZhciBpc0hvb2sgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdmhvb2tcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGlmZlByb3BzO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBkaWZmUHJvcHMoYSwgYikge1xuICAgICAgICAgICAgICAgIHZhciBkaWZmO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYUtleSBpbiBhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKGFLZXkgaW4gYikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBhVmFsdWUgPSBhW2FLZXldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYlZhbHVlID0gYlthS2V5XTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYVZhbHVlID09PSBiVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KGFWYWx1ZSkgJiYgaXNPYmplY3QoYlZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldFByb3RvdHlwZShiVmFsdWUpICE9PSBnZXRQcm90b3R5cGUoYVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBiVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzSG9vayhiVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IGJWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9iamVjdERpZmYgPSBkaWZmUHJvcHMoYVZhbHVlLCBiVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3REaWZmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gb2JqZWN0RGlmZjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBiVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBiS2V5IGluIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoYktleSBpbiBhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2JLZXldID0gYltiS2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaWZmO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRQcm90b3R5cGUodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUuX19wcm90b19fKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5fX3Byb3RvX187XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2lzLXZob29rXCI6IDI2LCBcImlzLW9iamVjdFwiOiAxMSB9XSwgMzU6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaXNBcnJheSA9IHJlcXVpcmUoXCJ4LWlzLWFycmF5XCIpO1xuXG4gICAgICAgICAgICB2YXIgVlBhdGNoID0gcmVxdWlyZShcIi4uL3Zub2RlL3ZwYXRjaFwiKTtcbiAgICAgICAgICAgIHZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZub2RlXCIpO1xuICAgICAgICAgICAgdmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdnRleHRcIik7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0XCIpO1xuICAgICAgICAgICAgdmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdGh1bmtcIik7XG4gICAgICAgICAgICB2YXIgaGFuZGxlVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaGFuZGxlLXRodW5rXCIpO1xuXG4gICAgICAgICAgICB2YXIgZGlmZlByb3BzID0gcmVxdWlyZShcIi4vZGlmZi1wcm9wc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkaWZmO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBkaWZmKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0Y2ggPSB7IGE6IGEgfTtcbiAgICAgICAgICAgICAgICB3YWxrKGEsIGIsIHBhdGNoLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0Y2g7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdhbGsoYSwgYiwgcGF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBhcHBseSA9IHBhdGNoW2luZGV4XTtcbiAgICAgICAgICAgICAgICB2YXIgYXBwbHlDbGVhciA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzVGh1bmsoYSkgfHwgaXNUaHVuayhiKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHVua3MoYSwgYiwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGIgPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGEgaXMgYSB3aWRnZXQgd2Ugd2lsbCBhZGQgYSByZW1vdmUgcGF0Y2ggZm9yIGl0XG4gICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSBhbnkgY2hpbGQgd2lkZ2V0cy9ob29rcyBtdXN0IGJlIGRlc3Ryb3llZC5cbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyBhZGRpbmcgdHdvIHJlbW92ZSBwYXRjaGVzIGZvciBhIHdpZGdldC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1dpZGdldChhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJTdGF0ZShhLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBwYXRjaFtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5SRU1PVkUsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVk5vZGUoYikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLnRhZ05hbWUgPT09IGIudGFnTmFtZSAmJiBhLm5hbWVzcGFjZSA9PT0gYi5uYW1lc3BhY2UgJiYgYS5rZXkgPT09IGIua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BzUGF0Y2ggPSBkaWZmUHJvcHMoYS5wcm9wZXJ0aWVzLCBiLnByb3BlcnRpZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wc1BhdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlBST1BTLCBhLCBwcm9wc1BhdGNoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gZGlmZkNoaWxkcmVuKGEsIGIsIHBhdGNoLCBhcHBseSwgaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WTk9ERSwgYSwgYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guVk5PREUsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1ZUZXh0KGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNWVGV4dChhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guVlRFWFQsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGEudGV4dCAhPT0gYi50ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WVEVYVCwgYSwgYikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1dpZGdldChiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzV2lkZ2V0KGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseUNsZWFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLldJREdFVCwgYSwgYikpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhcHBseSkge1xuICAgICAgICAgICAgICAgICAgICBwYXRjaFtpbmRleF0gPSBhcHBseTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYXBwbHlDbGVhcikge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclN0YXRlKGEsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBkaWZmQ2hpbGRyZW4oYSwgYiwgcGF0Y2gsIGFwcGx5LCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBhQ2hpbGRyZW4gPSBhLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgIHZhciBvcmRlcmVkU2V0ID0gcmVvcmRlcihhQ2hpbGRyZW4sIGIuY2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIHZhciBiQ2hpbGRyZW4gPSBvcmRlcmVkU2V0LmNoaWxkcmVuO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFMZW4gPSBhQ2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciBiTGVuID0gYkNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gYUxlbiA+IGJMZW4gPyBhTGVuIDogYkxlbjtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnROb2RlID0gYUNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmlnaHROb2RlID0gYkNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghbGVmdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyaWdodE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGNlc3Mgbm9kZXMgaW4gYiBuZWVkIHRvIGJlIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guSU5TRVJULCBudWxsLCByaWdodE5vZGUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhbGsobGVmdE5vZGUsIHJpZ2h0Tm9kZSwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZOb2RlKGxlZnROb2RlKSAmJiBsZWZ0Tm9kZS5jb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gbGVmdE5vZGUuY291bnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3JkZXJlZFNldC5tb3Zlcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZW9yZGVyIG5vZGVzIGxhc3RcbiAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guT1JERVIsIGEsIG9yZGVyZWRTZXQubW92ZXMpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwbHk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNsZWFyU3RhdGUodk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IE1ha2UgdGhpcyBhIHNpbmdsZSB3YWxrLCBub3QgdHdvXG4gICAgICAgICAgICAgICAgdW5ob29rKHZOb2RlLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIGRlc3Ryb3lXaWRnZXRzKHZOb2RlLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBQYXRjaCByZWNvcmRzIGZvciBhbGwgZGVzdHJveWVkIHdpZGdldHMgbXVzdCBiZSBhZGRlZCBiZWNhdXNlIHdlIG5lZWRcbiAgICAgICAgICAgIC8vIGEgRE9NIG5vZGUgcmVmZXJlbmNlIGZvciB0aGUgZGVzdHJveSBmdW5jdGlvblxuICAgICAgICAgICAgZnVuY3Rpb24gZGVzdHJveVdpZGdldHModk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChpc1dpZGdldCh2Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2Tm9kZS5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoW2luZGV4XSA9IGFwcGVuZFBhdGNoKHBhdGNoW2luZGV4XSwgbmV3IFZQYXRjaChWUGF0Y2guUkVNT1ZFLCB2Tm9kZSwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1ZOb2RlKHZOb2RlKSAmJiAodk5vZGUuaGFzV2lkZ2V0cyB8fCB2Tm9kZS5oYXNUaHVua3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHZOb2RlLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Ryb3lXaWRnZXRzKGNoaWxkLCBwYXRjaCwgaW5kZXgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShjaGlsZCkgJiYgY2hpbGQuY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCArPSBjaGlsZC5jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNUaHVuayh2Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGh1bmtzKHZOb2RlLCBudWxsLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgc3ViLXBhdGNoIGZvciB0aHVua3NcbiAgICAgICAgICAgIGZ1bmN0aW9uIHRodW5rcyhhLCBiLCBwYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZXMgPSBoYW5kbGVUaHVuayhhLCBiKTtcbiAgICAgICAgICAgICAgICB2YXIgdGh1bmtQYXRjaCA9IGRpZmYobm9kZXMuYSwgbm9kZXMuYik7XG4gICAgICAgICAgICAgICAgaWYgKGhhc1BhdGNoZXModGh1bmtQYXRjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0Y2hbaW5kZXhdID0gbmV3IFZQYXRjaChWUGF0Y2guVEhVTkssIG51bGwsIHRodW5rUGF0Y2gpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFzUGF0Y2hlcyhwYXRjaCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGluZGV4IGluIHBhdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gXCJhXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBFeGVjdXRlIGhvb2tzIHdoZW4gdHdvIG5vZGVzIGFyZSBpZGVudGljYWxcbiAgICAgICAgICAgIGZ1bmN0aW9uIHVuaG9vayh2Tm9kZSwgcGF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUodk5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2Tm9kZS5ob29rcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hbaW5kZXhdID0gYXBwZW5kUGF0Y2gocGF0Y2hbaW5kZXhdLCBuZXcgVlBhdGNoKFZQYXRjaC5QUk9QUywgdk5vZGUsIHVuZGVmaW5lZEtleXModk5vZGUuaG9va3MpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodk5vZGUuZGVzY2VuZGFudEhvb2tzIHx8IHZOb2RlLmhhc1RodW5rcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdk5vZGUuY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmhvb2soY2hpbGQsIHBhdGNoLCBpbmRleCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShjaGlsZCkgJiYgY2hpbGQuY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gY2hpbGQuY291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1RodW5rKHZOb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHVua3Modk5vZGUsIG51bGwsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB1bmRlZmluZWRLZXlzKG9iaikge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB7fTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTGlzdCBkaWZmLCBuYWl2ZSBsZWZ0IHRvIHJpZ2h0IHJlb3JkZXJpbmdcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlb3JkZXIoYUNoaWxkcmVuLCBiQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAvLyBPKE0pIHRpbWUsIE8oTSkgbWVtb3J5XG4gICAgICAgICAgICAgICAgdmFyIGJDaGlsZEluZGV4ID0ga2V5SW5kZXgoYkNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB2YXIgYktleXMgPSBiQ2hpbGRJbmRleC5rZXlzO1xuICAgICAgICAgICAgICAgIHZhciBiRnJlZSA9IGJDaGlsZEluZGV4LmZyZWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoYkZyZWUubGVuZ3RoID09PSBiQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogYkNoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBPKE4pIHRpbWUsIE8oTikgbWVtb3J5XG4gICAgICAgICAgICAgICAgdmFyIGFDaGlsZEluZGV4ID0ga2V5SW5kZXgoYUNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB2YXIgYUtleXMgPSBhQ2hpbGRJbmRleC5rZXlzO1xuICAgICAgICAgICAgICAgIHZhciBhRnJlZSA9IGFDaGlsZEluZGV4LmZyZWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoYUZyZWUubGVuZ3RoID09PSBhQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogYkNoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBPKE1BWChOLCBNKSkgbWVtb3J5XG4gICAgICAgICAgICAgICAgdmFyIG5ld0NoaWxkcmVuID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgZnJlZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgZnJlZUNvdW50ID0gYkZyZWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciBkZWxldGVkSXRlbXMgPSAwO1xuXG4gICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGEgYW5kIG1hdGNoIGEgbm9kZSBpbiBiXG4gICAgICAgICAgICAgICAgLy8gTyhOKSB0aW1lLFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYUNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhSXRlbSA9IGFDaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1JbmRleDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYUl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYktleXMuaGFzT3duUHJvcGVydHkoYUl0ZW0ua2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hdGNoIHVwIHRoZSBvbGQga2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGJLZXlzW2FJdGVtLmtleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChiQ2hpbGRyZW5baXRlbUluZGV4XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBvbGQga2V5ZWQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBpIC0gZGVsZXRlZEl0ZW1zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hdGNoIHRoZSBpdGVtIGluIGEgd2l0aCB0aGUgbmV4dCBmcmVlIGl0ZW0gaW4gYlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZyZWVJbmRleCA8IGZyZWVDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGJGcmVlW2ZyZWVJbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGJDaGlsZHJlbltpdGVtSW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgYXJlIG5vIGZyZWUgaXRlbXMgaW4gYiB0byBtYXRjaCB3aXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGZyZWUgaXRlbXMgaW4gYSwgc28gdGhlIGV4dHJhIGZyZWUgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhcmUgZGVsZXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBpIC0gZGVsZXRlZEl0ZW1zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBsYXN0RnJlZUluZGV4ID0gZnJlZUluZGV4ID49IGJGcmVlLmxlbmd0aCA/IGJDaGlsZHJlbi5sZW5ndGggOiBiRnJlZVtmcmVlSW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGIgYW5kIGFwcGVuZCBhbnkgbmV3IGtleXNcbiAgICAgICAgICAgICAgICAvLyBPKE0pIHRpbWVcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGJDaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3SXRlbSA9IGJDaGlsZHJlbltqXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobmV3SXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYUtleXMuaGFzT3duUHJvcGVydHkobmV3SXRlbS5rZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGFueSBuZXcga2V5ZWQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBhcmUgYWRkaW5nIG5ldyBpdGVtcyB0byB0aGUgZW5kIGFuZCB0aGVuIHNvcnRpbmcgdGhlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluIHBsYWNlLiBJbiBmdXR1cmUgd2Ugc2hvdWxkIGluc2VydCBuZXcgaXRlbXMgaW4gcGxhY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChuZXdJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChqID49IGxhc3RGcmVlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBhbnkgbGVmdG92ZXIgbm9uLWtleWVkIGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG5ld0l0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNpbXVsYXRlID0gbmV3Q2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2ltdWxhdGVJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIHJlbW92ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgaW5zZXJ0cyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBzaW11bGF0ZUl0ZW07XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGJDaGlsZHJlbi5sZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3YW50ZWRJdGVtID0gYkNoaWxkcmVuW2tdO1xuICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XTtcblxuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHNpbXVsYXRlSXRlbSA9PT0gbnVsbCAmJiBzaW11bGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaW11bGF0ZUl0ZW0gfHwgc2ltdWxhdGVJdGVtLmtleSAhPT0gd2FudGVkSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIG5lZWQgYSBrZXkgaW4gdGhpcyBwb3NpdGlvbi4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdhbnRlZEl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNpbXVsYXRlSXRlbSAmJiBzaW11bGF0ZUl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIGFuIGluc2VydCBkb2Vzbid0IHB1dCB0aGlzIGtleSBpbiBwbGFjZSwgaXQgbmVlZHMgdG8gbW92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYktleXNbc2ltdWxhdGVJdGVtLmtleV0gIT09IGsgKyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBzaW11bGF0ZUl0ZW0ua2V5KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSByZW1vdmUgZGlkbid0IHB1dCB0aGUgd2FudGVkIGl0ZW0gaW4gcGxhY2UsIHdlIG5lZWQgdG8gaW5zZXJ0IGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNpbXVsYXRlSXRlbSB8fCBzaW11bGF0ZUl0ZW0ua2V5ICE9PSB3YW50ZWRJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7IGtleTogd2FudGVkSXRlbS5rZXksIHRvOiBrIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXRlbXMgYXJlIG1hdGNoaW5nLCBzbyBza2lwIGFoZWFkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goeyBrZXk6IHdhbnRlZEl0ZW0ua2V5LCB0bzogayB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7IGtleTogd2FudGVkSXRlbS5rZXksIHRvOiBrIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIGtleSBpbiBzaW11bGF0ZSBoYXMgbm8gbWF0Y2hpbmcgd2FudGVkIGtleSwgcmVtb3ZlIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzaW11bGF0ZUl0ZW0gJiYgc2ltdWxhdGVJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbS5rZXkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBhbGwgdGhlIHJlbWFpbmluZyBub2RlcyBmcm9tIHNpbXVsYXRlXG4gICAgICAgICAgICAgICAgd2hpbGUgKHNpbXVsYXRlSW5kZXggPCBzaW11bGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJdGVtID0gc2ltdWxhdGVbc2ltdWxhdGVJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbSAmJiBzaW11bGF0ZUl0ZW0ua2V5KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIG9ubHkgbW92ZXMgd2UgaGF2ZSBhcmUgZGVsZXRlcyB0aGVuIHdlIGNhbiBqdXN0XG4gICAgICAgICAgICAgICAgLy8gbGV0IHRoZSBkZWxldGUgcGF0Y2ggcmVtb3ZlIHRoZXNlIGl0ZW1zLlxuICAgICAgICAgICAgICAgIGlmIChyZW1vdmVzLmxlbmd0aCA9PT0gZGVsZXRlZEl0ZW1zICYmICFpbnNlcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IG5ld0NoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbmV3Q2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgICAgIG1vdmVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVzOiByZW1vdmVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0czogaW5zZXJ0c1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlKGFyciwgaW5kZXgsIGtleSkge1xuICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbTogaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24ga2V5SW5kZXgoY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5cyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBmcmVlID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGNoaWxkcmVuLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5c1tjaGlsZC5rZXldID0gaTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyZWUucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGtleXM6IGtleXMsIC8vIEEgaGFzaCBvZiBrZXkgbmFtZSB0byBpbmRleFxuICAgICAgICAgICAgICAgICAgICBmcmVlOiBmcmVlIC8vIEFuIGFycmF5IG9mIHVua2V5ZWQgaXRlbSBpbmRpY2VzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYXBwZW5kUGF0Y2goYXBwbHksIHBhdGNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFwcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KGFwcGx5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkucHVzaChwYXRjaCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IFthcHBseSwgcGF0Y2hdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcGx5O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRjaDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9oYW5kbGUtdGh1bmtcIjogMjQsIFwiLi4vdm5vZGUvaXMtdGh1bmtcIjogMjUsIFwiLi4vdm5vZGUvaXMtdm5vZGVcIjogMjcsIFwiLi4vdm5vZGUvaXMtdnRleHRcIjogMjgsIFwiLi4vdm5vZGUvaXMtd2lkZ2V0XCI6IDI5LCBcIi4uL3Zub2RlL3ZwYXRjaFwiOiAzMiwgXCIuL2RpZmYtcHJvcHNcIjogMzQsIFwieC1pcy1hcnJheVwiOiAxMiB9XSB9LCB7fSwgWzRdKSg0KTtcbn0pO1xuXG5cbi8vIFByb3Bvc2VkIGZvciBFUzZcblxuY29uc3Qgc3RhcnQgPSBmdW5jdGlvbiAoZG9tUm9vdCwgcmVuZGVyRm4sIGluaXRpYWxTdGF0ZSwgb3B0aW9ucyA9IFtdKSB7XG4gIGNvbnN0IG5hbWUgPSBLZXl3b3JkLmhhc19rZXlfX3FtX18ob3B0aW9ucywgS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCduYW1lJykpID8gS2V5d29yZC5nZXQob3B0aW9ucywgS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCduYW1lJykpIDogU3ltYm9sKCk7XG5cbiAgc2VsZi5wb3N0X29mZmljZS5hZGRfbWFpbGJveChuYW1lKTtcblxuICBjb25zdCB0cmVlID0gcmVuZGVyRm4uYXBwbHkodGhpcywgaW5pdGlhbFN0YXRlKTtcbiAgY29uc3Qgcm9vdE5vZGUgPSB2aXJ0dWFsRG9tLmNyZWF0ZSh0cmVlKTtcblxuICBkb21Sb290LmFwcGVuZENoaWxkKHJvb3ROb2RlKTtcbiAgc2VsZi5wb3N0X29mZmljZS5zZW5kKG5hbWUsIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUocm9vdE5vZGUsIHRyZWUsIHJlbmRlckZuKSk7XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUoS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpLCBuYW1lKTtcbn07XG5cbmNvbnN0IHN0b3AgPSBmdW5jdGlvbiAoYWdlbnQsIHRpbWVvdXQgPSA1MDAwKSB7XG4gIHNlbGYucG9zdF9vZmZpY2UucmVtb3ZlX21haWxib3goYWdlbnQpO1xuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpO1xufTtcblxuY29uc3QgcmVuZGVyID0gZnVuY3Rpb24gKGFnZW50LCBzdGF0ZSkge1xuXG4gIGNvbnN0IGN1cnJlbnRfc3RhdGUgPSBzZWxmLnBvc3Rfb2ZmaWNlLnJlY2VpdmUoYWdlbnQpO1xuXG4gIGxldCByb290Tm9kZSA9IEtlcm5lbC5lbGVtKGN1cnJlbnRfc3RhdGUsIDApO1xuICBsZXQgdHJlZSA9IEtlcm5lbC5lbGVtKGN1cnJlbnRfc3RhdGUsIDEpO1xuICBsZXQgcmVuZGVyRm4gPSBLZXJuZWwuZWxlbShjdXJyZW50X3N0YXRlLCAyKTtcblxuICBsZXQgbmV3VHJlZSA9IHJlbmRlckZuLmFwcGx5KHRoaXMsIHN0YXRlKTtcblxuICBsZXQgcGF0Y2hlcyA9IHZpcnR1YWxEb20uZGlmZih0cmVlLCBuZXdUcmVlKTtcbiAgcm9vdE5vZGUgPSB2aXJ0dWFsRG9tLnBhdGNoKHJvb3ROb2RlLCBwYXRjaGVzKTtcblxuICBzZWxmLnBvc3Rfb2ZmaWNlLnNlbmQoYWdlbnQsIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUocm9vdE5vZGUsIG5ld1RyZWUsIHJlbmRlckZuKSk7XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnb2snKTtcbn07XG5cbnZhciBWaWV3ID0ge1xuICBzdGFydCxcbiAgc3RvcCxcbiAgcmVuZGVyXG59O1xuXG5zZWxmLnBvc3Rfb2ZmaWNlID0gc2VsZi5wb3N0X29mZmljZSB8fCBuZXcgUG9zdE9mZmljZSgpO1xuXG5leHBvcnQgeyBfUGF0dGVybnMgYXMgUGF0dGVybnMsIEJpdFN0cmluZywgS2VybmVsLCBBdG9tLCBFbnVtLCBJbnRlZ2VyLCBKUywgTGlzdCwgUmFuZ2UsIFR1cGxlLCBBZ2VudCwgS2V5d29yZCwgQmFzZSwgX1N0cmluZyBhcyBTdHJpbmcsIEJpdHdpc2UsIEVudW1lcmFibGUsIENvbGxlY3RhYmxlLCBJbnNwZWN0LCBfTWFwIGFzIE1hcCwgX1NldCBhcyBTZXQsIE1hcFNldCwgSW50ZWdlclR5cGUsIEZsb2F0VHlwZSwgdmlydHVhbERvbSBhcyBWaXJ0dWFsRE9NLCBWaWV3IH07Il0sImZpbGUiOiJlbGl4aXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==