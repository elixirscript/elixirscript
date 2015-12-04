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

class Tuple$1 {

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

}

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

function is_number$1(value) {
  return typeof value === 'number';
}

function is_string(value) {
  return typeof value === 'string';
}

function is_boolean$1(value) {
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

function is_function$1(value) {
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
  is_number: is_number$1,
  is_string,
  is_boolean: is_boolean$1,
  is_symbol,
  is_null,
  is_undefined,
  is_function: is_function$1,
  is_variable,
  is_wildcard,
  is_headTail,
  is_capture,
  is_type,
  is_startsWith,
  is_bound,
  is_object,
  is_array
};

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
  resolveNull
};

function buildMatch(pattern) {

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

var Patterns = {
  defmatch, match, MatchError, match_no_throw,
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

/* @flow */

class Mailbox {

  constructor() {
    this.messages = [];
  }

  deliver(message) {
    this.messages.push(message);
    return message;
  }

  get() {
    return this.messages;
  }

  isEmpty() {
    return this.messages.length === 0;
  }

  removeAt(index) {
    this.messages.splice(index, 1);
  }
}

var States = {
  NORMAL: Symbol.for("normal"),
  KILL: Symbol.for("kill"),
  SUSPEND: Symbol.for("suspend"),
  CONTINUE: Symbol.for("continue"),
  RECEIVE: Symbol.for("receive"),
  SEND: Symbol.for("send"),
  SLEEPING: Symbol.for("sleeping"),
  RUNNING: Symbol.for("running"),
  SUSPENDED: Symbol.for("suspended"),
  STOPPED: Symbol.for("stopped"),
  SLEEP: Symbol.for("sleep"),
  EXIT: Symbol.for("exit"),
  NOMATCH: Symbol.for("no_match")
};

class Process {

  constructor(pid, mailbox) {
    this.pid = pid;
    this.mailbox = mailbox;
    this.status = States.STOPPED;
    this.dict = {};
  }
}

class ProcessSystem {

  constructor() {
    this.pids = new Map();
    this.mailboxes = new Map();
    this.names = new Map();
    this.links = new Map();

    this.current_process = null;
    this.suspended = new Map();

    this.main_process_pid = this.spawn();
    this.set_current(this.main_process_pid);
  }

  spawn() {
    return this.add_proc(false).pid;
  }

  spawn_link() {
    return this.add_proc(true).pid;
  }

  link(pid) {
    this.links.get(this.pid()).add(pid);
    this.links.get(pid).add(this.pid());
  }

  unlink(pid) {
    this.links.get(this.pid()).delete(pid);
    this.links.get(pid).delete(this.pid());
  }

  set_current(id) {
    let pid = this.pidof(id);
    if (pid !== null) {
      this.current_process = this.pids.get(pid);
      this.current_process.status = States.RUNNING;
    }
  }

  add_proc(linked) {
    let newpid = new PID();
    let mailbox = new Mailbox();
    let newproc = new Process(newpid, mailbox);

    this.pids.set(newpid, newproc);
    this.mailboxes.set(newpid, mailbox);
    this.links.set(newpid, new Set());

    if (linked) {
      this.link(newpid);
    }

    return newproc;
  }

  remove_proc(pid) {
    this.pids.delete(pid);
    this.unregister(pid);

    if (this.links.has(pid)) {
      for (let linkpid of this.links.get(pid)) {
        this.links.get(linkpid).delete(pid);
      }

      this.links.delete(pid);
    }
  }

  exit(id) {
    let pid = this.pidof(id);
    this.remove_proc(id);
  }

  register(name, pid) {
    if (!this.names.has(name)) {
      this.names.set(name, pid);
      return name;
    } else {
      throw new Error("Name is already registered to another process");
    }
  }

  registered(name) {
    return this.names.has(name) ? this.names.get(name) : null;
  }

  unregister(pid) {
    for (let name of this.names.keys()) {
      if (this.names.has(name) && this.names.get(name) === pid) {
        this.names.delete(name);
      }
    }
  }

  pid() {
    return this.current_process.pid;
  }

  pidof(id) {
    if (id instanceof PID) {
      return this.pids.has(id) ? id : null;
    } else if (id instanceof Process) {
      return id.pid;
    } else {
      let pid = this.registered(id);
      if (pid === null) throw "Process name not registered: " + id + " (" + typeof id + ")";
      return pid;
    }
  }

  put(id, key, value) {
    let pid = this.pidof(id);
    let process = this.pids.get(pid);
    process.dict[key] = value;
  }

  get(id, key) {
    let pid = this.pidof(id);
    let process = this.pids.get(pid);

    if (key != null) {
      return process.dict[key];
    } else {
      return process.dict;
    }
  }

  get_keys(id) {
    let pid = this.pidof(id);
    let process = this.pids.get(pid);

    return Object.keys(process.dict);
  }

  erase(id, key) {
    let pid = this.pidof(id);
    let process = this.pids.get(pid);

    if (key != null) {
      delete process.dict[key];
    } else {
      process.dict = {};
    }
  }
}

var C = Object.freeze({
	ProcessSystem: ProcessSystem,
	Tuple: Tuple$1,
	PID: PID,
	BitString: BitString,
	Patterns: Patterns,
	IntegerType: IntegerType,
	FloatType: FloatType,
	call_property: call_property
});

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
    return new Tuple$1(...args);
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

function to_string$1(tuple) {
  return tuple.toString();
};

function delete_at(tuple, index) {
  let new_list = [];

  for (var i = 0; i < tuple.count(); i++) {
    if (i !== index) {
      new_list.push(tuple.get(i));
    }
  }

  return Kernel.SpecialForms.tuple.apply(null, new_list);
};

function duplicate(data, size) {
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return Kernel.SpecialForms.tuple.apply(null, array);
};

function insert_at(tuple, index, term) {
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
};

function from_list(list) {
  return Kernel.SpecialForms.tuple.apply(null, list);
};

function to_list(tuple) {
  let new_list = [];

  for (var i = 0; i < tuple.count(); i++) {
    new_list.push(tuple.get(i));
  }

  return Kernel.SpecialForms.list(...new_list);
};

var Tuple = {
  to_string: to_string$1,
  delete_at,
  duplicate,
  insert_at,
  from_list,
  to_list
};

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
  return x instanceof Tuple$1;
}

function length(x) {
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
  return Patterns.match_no_throw(pattern, expr, guard) != null;
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
  length,
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

let Chars$1 = Kernel.defprotocol({
  to_string: function (thing) {}
});

Kernel.defimpl(Chars$1, BitString, {
  to_string: function (thing) {
    if (Kernel.is_binary(thing)) {
      return thing;
    }

    return thing.toString();
  }
});

Kernel.defimpl(Chars$1, Symbol, {
  to_string: function (thing) {
    if (nil) {
      return "";
    }

    return Atom.to_string(thing);
  }
});

Kernel.defimpl(Chars$1, IntegerType, {
  to_string: function (thing) {
    return Integer.to_string(thing);
  }
});

Kernel.defimpl(Chars$1, FloatType, {
  to_string: function (thing) {
    return thing.toString;
  }
});

Kernel.defimpl(Chars$1, Array, {
  to_string: function (thing) {
    return thing.toString();
  }
});

Kernel.defimpl(Chars$1, Tuple$1, {
  to_string: function (thing) {
    return Tuple.to_string(thing);
  }
});

Kernel.defimpl(Chars$1, null, {
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

function duplicate$1(subject, n) {
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

function length$1(string) {
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

function split(string) {
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

var String$1 = {
  at,
  capitalize,
  codepoints,
  contains__qm__,
  downcase,
  duplicate: duplicate$1,
  ends_with__qm__,
  first,
  graphemes,
  last,
  length: length$1,
  match__qm__,
  next_codepoint,
  next_grapheme,
  reverse,
  split,
  starts_with__qm__,
  to_atom,
  to_char_list,
  to_existing_atom,
  to_float,
  to_integer,
  upcase,
  valid_character__qm__,
  Chars: Chars$1
};

let Chars = Kernel.defprotocol({
  to_char_list: function (thing) {}
});

Kernel.defimpl(Chars, BitString, {
  to_char_list: function (thing) {
    if (Kernel.is_binary(thing)) {
      return String$1.to_char_list(thing);
    }

    return thing.toString();
  }
});

Kernel.defimpl(Chars, Symbol, {
  to_char_list: function (thing) {
    return Atom.to_char_list(thing);
  }
});

Kernel.defimpl(Chars, IntegerType, {
  to_char_list: function (thing) {
    return Integer.to_char_list(thing);
  }
});

Kernel.defimpl(Chars, Array, {
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
  let pid = self.processes.spawn();

  if (Keyword.has_key__qm__(options, Kernel.SpecialForms.atom('name'))) {
    pid = self.processes.register(Keyword.get(options, Kernel.SpecialForms.atom('name')), pid);
  }

  self.processes.put(pid, 'state', fun());
  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('ok'), pid);
};

Agent.stop = function (agent, timeout = 5000) {
  self.processes.exit(agent);
  return Kernel.SpecialForms.atom('ok');
};

Agent.update = function (agent, fun, timeout = 5000) {

  const current_state = self.processes.get(agent, 'state');
  self.processes.put(agent, 'state', fun(current_state));

  return Kernel.SpecialForms.atom('ok');
};

Agent.get = function (agent, fun, timeout = 5000) {
  return fun(self.processes.get(agent, 'state'));
};

Agent.get_and_update = function (agent, fun, timeout = 5000) {

  const get_and_update_tuple = fun(self.processes.get(agent, 'state'));
  self.processes.put(agent, 'state', Kernel.elem(get_and_update_tuple, 1));

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

var base = {
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

var bitwise = {
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

function __new__() {
  return SpecialForms.map({});
}

function keys(map) {
  return Object.keys(map);
}

function size(map) {
  return keys(map).length;
}

function to_list$1(map) {
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

function __delete__(map, key) {
  let new_map = Object.assign({}, map);

  delete new_map[key];

  return SpecialForms.map(new_map);
}

function equal__qmark__(map1, map2) {
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

function split$1(map, keys) {
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

function put(map, key, val) {
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

function update(map, key, initial, fun) {
  let new_map = Object({}, map);

  if (!key in map) {
    new_map[key] = initial;
  } else {
    new_map[key] = fun(map[key]);
  }

  return SpecialForms.map(new_map);
}

var map = {
  new: __new__,
  keys,
  size,
  to_list: to_list$1,
  values,
  from_struct,
  delete: __delete__,
  drop,
  equal__qmark__,
  fetch__emark__,
  fetch,
  has_key__qmark__,
  split: split$1,
  take,
  put_new,
  put_new_lazy,
  get_and_update,
  pop_lazy,
  pop,
  get_lazy,
  get,
  put,
  update__emark__,
  update
};

function __new__$1() {
  return SpecialForms.map({ [Symbol.for('__struct__')]: Symbol.for('MapSet'), set: SpecialForms.list() });
}

function size$2(map) {
  return map.set.length;
}

function to_list$3(map) {
  return map.set;
}

function __delete__$2(set, term) {
  let new_list = List.delete(set.set, term);

  let new_map = Object.assign({}, set);
  new_map.set = new_list;
  return SpecialForms.map(new_map);
}

function put$2(set, term) {
  if (set.set.indexOf(term) === -1) {
    let new_list = List.append(set.set, term);

    let new_map = Object.assign({}, set);
    new_map.set = new_list;
    return SpecialForms.map(new_map);
  }

  return set;
}

function difference$1(set1, set2) {
  let new_map = Object.assign({}, set1);

  for (let val of set1.set) {
    if (member__qmark__$1(set2, val)) {
      new_map.set = List.delete(new_map.set, val);
    }
  }

  return SpecialForms.map(new_map);
}

function intersection$1(set1, set2) {
  let new_map = Object.assign({}, set1);

  for (let val of set1.set) {
    if (!member__qmark__$1(set2, val)) {
      new_map.set = List.delete(new_map.set, val);
    }
  }

  return SpecialForms.map(new_map);
}

function union$1(set1, set2) {
  let new_map = set1;

  for (let val of set2.set) {
    new_map = put$2(new_map, val);
  }

  return SpecialForms.map(new_map);
}

function disjoin__qmark__$1(set1, set2) {
  for (let val of set1.set) {
    if (member__qmark__$1(set2, val)) {
      return false;
    }
  }

  return true;
}

function member__qmark__$1(set, value) {
  return set.set.indexOf(value) >= 0;
}

function equal__qmark__$2(set1, set2) {
  return set1.set === set2.set;
}

function subset__qmark__$1(set1, set2) {
  for (let val of set1.set) {
    if (!member__qmark__$1(set2, val)) {
      return false;
    }
  }

  return true;
}

var MapSet = {
  new: __new__$1,
  size: size$2,
  to_list: to_list$3,
  disjoin__qmark__: disjoin__qmark__$1,
  delete: __delete__$2,
  subset__qmark__: subset__qmark__$1,
  equal__qmark__: equal__qmark__$2,
  member__qmark__: member__qmark__$1,
  put: put$2,
  union: union$1,
  intersection: intersection$1,
  difference: difference$1
};

function size$1(map) {
  return MapSet.size(map);
}

function to_list$2(map) {
  return MapSet.to_list(map);
}

function __delete__$1(set, term) {
  return MapSet.delete(set, term);
}

function put$1(set, term) {
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

function equal__qmark__$1(set1, set2) {
  return MapSet.equal__qmark__(set1, set2);
}

function subset__qmark__(set1, set2) {
  return MapSet.subset__qmark__(set1, set2);
}

var set = {
  size: size$1,
  to_list: to_list$2,
  disjoin__qmark__,
  delete: __delete__$1,
  subset__qmark__,
  equal__qmark__: equal__qmark__$1,
  member__qmark__,
  put: put$1,
  union,
  intersection,
  difference
};

let VirtualDOM = (function (e) {
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

const start = function (domRoot, renderFn, initialState, options = []) {
  let pid = self.processes.spawn();

  if (Keyword.has_key__qm__(options, Kernel.SpecialForms.atom('name'))) {
    pid = self.processes.register(Keyword.get(options, Kernel.SpecialForms.atom('name')), pid);
  }

  const tree = renderFn.apply(this, initialState);
  const rootNode = VirtualDOM.create(tree);

  domRoot.appendChild(rootNode);

  self.processes.put(pid, 'state', Kernel.SpecialForms.tuple(rootNode, tree, renderFn));
  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('ok'), pid);
};

const stop = function (agent, timeout = 5000) {
  self.processes.exit(agent);
  return Kernel.SpecialForms.atom('ok');
};

const render = function (agent, state) {

  const current_state = self.processes.get(agent, 'state');

  let rootNode = Kernel.elem(current_state, 0);
  let tree = Kernel.elem(current_state, 1);
  let renderFn = Kernel.elem(current_state, 2);

  let newTree = renderFn.apply(this, state);

  let patches = VirtualDOM.diff(tree, newTree);
  rootNode = VirtualDOM.patch(rootNode, patches);

  self.processes.put(agent, 'state', Kernel.SpecialForms.tuple(rootNode, newTree, renderFn));

  return Kernel.SpecialForms.atom('ok');
};

var view = {
  start,
  stop,
  render
};

self.processes = self.processes || new ProcessSystem();

const Core = C;

export { Core, Kernel, Atom, Enum, Integer, List, Range, Tuple, Agent, Keyword, base as Base, String$1 as String, bitwise as Bitwise, Enumerable, Collectable, Inspect, map as Map, set as Set, MapSet, VirtualDOM, view as View };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJlbGl4aXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gY2FsbF9wcm9wZXJ0eShpdGVtLCBwcm9wZXJ0eSkge1xuICBpZiAocHJvcGVydHkgaW4gaXRlbSkge1xuICAgIGl0ZW1bcHJvcGVydHldO1xuICAgIGlmIChpdGVtW3Byb3BlcnR5XSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICByZXR1cm4gaXRlbVtwcm9wZXJ0eV0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZW1bcHJvcGVydHldO1xuICAgIH1cbiAgfSBlbHNlIGlmIChTeW1ib2wuZm9yKHByb3BlcnR5KSBpbiBpdGVtKSB7XG4gICAgbGV0IHByb3AgPSBTeW1ib2wuZm9yKHByb3BlcnR5KTtcbiAgICBpZiAoaXRlbVtwcm9wXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICByZXR1cm4gaXRlbVtwcm9wXSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaXRlbVtwcm9wXTtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoYFByb3BlcnR5ICR7IHByb3BlcnR5IH0gbm90IGZvdW5kIGluICR7IGl0ZW0gfWApO1xufVxuXG5jbGFzcyBUdXBsZSQxIHtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgdGhpcy52YWx1ZXMgPSBPYmplY3QuZnJlZXplKGFyZ3MpO1xuICB9XG5cbiAgZ2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgfVxuXG4gIGNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5sZW5ndGg7XG4gIH1cblxuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXNbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgdmFyIGksXG4gICAgICAgIHMgPSBcIlwiO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHMgIT09IFwiXCIpIHtcbiAgICAgICAgcyArPSBcIiwgXCI7XG4gICAgICB9XG4gICAgICBzICs9IHRoaXMudmFsdWVzW2ldLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwie1wiICsgcyArIFwifVwiO1xuICB9XG5cbn1cblxubGV0IHByb2Nlc3NfY291bnRlciA9IC0xO1xuXG5jbGFzcyBQSUQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBwcm9jZXNzX2NvdW50ZXIgPSBwcm9jZXNzX2NvdW50ZXIgKyAxO1xuICAgIHRoaXMuaWQgPSBwcm9jZXNzX2NvdW50ZXI7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gXCJQSUQjPDAuXCIgKyB0aGlzLmlkICsgXCIuMD5cIjtcbiAgfVxufVxuXG5jbGFzcyBJbnRlZ2VyVHlwZSB7fVxuXG5jbGFzcyBGbG9hdFR5cGUge31cblxuLyogQGZsb3cgKi9cblxuY2xhc3MgVmFyaWFibGUge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUgPSBudWxsKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgfVxufVxuXG5jbGFzcyBXaWxkY2FyZCB7XG4gIGNvbnN0cnVjdG9yKCkge31cbn1cblxuY2xhc3MgU3RhcnRzV2l0aCB7XG5cbiAgY29uc3RydWN0b3IocHJlZml4KSB7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXg7XG4gIH1cbn1cblxuY2xhc3MgQ2FwdHVyZSB7XG5cbiAgY29uc3RydWN0b3IodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cblxuY2xhc3MgSGVhZFRhaWwge1xuICBjb25zdHJ1Y3RvcigpIHt9XG59XG5cbmNsYXNzIFR5cGUge1xuXG4gIGNvbnN0cnVjdG9yKHR5cGUsIG9ialBhdHRlcm4gPSB7fSkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5vYmpQYXR0ZXJuID0gb2JqUGF0dGVybjtcbiAgfVxufVxuXG5jbGFzcyBCb3VuZCB7XG5cbiAgY29uc3RydWN0b3IodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFyaWFibGUobmFtZSA9IG51bGwpIHtcbiAgcmV0dXJuIG5ldyBWYXJpYWJsZShuYW1lKTtcbn1cblxuZnVuY3Rpb24gd2lsZGNhcmQoKSB7XG4gIHJldHVybiBuZXcgV2lsZGNhcmQoKTtcbn1cblxuZnVuY3Rpb24gc3RhcnRzV2l0aChwcmVmaXgpIHtcbiAgcmV0dXJuIG5ldyBTdGFydHNXaXRoKHByZWZpeCk7XG59XG5cbmZ1bmN0aW9uIGNhcHR1cmUodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBDYXB0dXJlKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gaGVhZFRhaWwoKSB7XG4gIHJldHVybiBuZXcgSGVhZFRhaWwoKTtcbn1cblxuZnVuY3Rpb24gdHlwZSh0eXBlLCBvYmpQYXR0ZXJuID0ge30pIHtcbiAgcmV0dXJuIG5ldyBUeXBlKHR5cGUsIG9ialBhdHRlcm4pO1xufVxuXG5mdW5jdGlvbiBib3VuZCh2YWx1ZSkge1xuICByZXR1cm4gbmV3IEJvdW5kKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gaXNfbnVtYmVyJDEodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzX3N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbn1cblxuZnVuY3Rpb24gaXNfYm9vbGVhbiQxKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJztcbn1cblxuZnVuY3Rpb24gaXNfc3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzeW1ib2wnO1xufVxuXG5mdW5jdGlvbiBpc19udWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNfdW5kZWZpbmVkKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnO1xufVxuXG5mdW5jdGlvbiBpc19mdW5jdGlvbiQxKHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59XG5cbmZ1bmN0aW9uIGlzX3ZhcmlhYmxlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFZhcmlhYmxlO1xufVxuXG5mdW5jdGlvbiBpc193aWxkY2FyZCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBXaWxkY2FyZDtcbn1cblxuZnVuY3Rpb24gaXNfaGVhZFRhaWwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgSGVhZFRhaWw7XG59XG5cbmZ1bmN0aW9uIGlzX2NhcHR1cmUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQ2FwdHVyZTtcbn1cblxuZnVuY3Rpb24gaXNfdHlwZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBUeXBlO1xufVxuXG5mdW5jdGlvbiBpc19zdGFydHNXaXRoKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFN0YXJ0c1dpdGg7XG59XG5cbmZ1bmN0aW9uIGlzX2JvdW5kKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kO1xufVxuXG5mdW5jdGlvbiBpc19vYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59XG5cbmZ1bmN0aW9uIGlzX2FycmF5KHZhbHVlKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxudmFyIENoZWNrcyA9IHtcbiAgaXNfbnVtYmVyOiBpc19udW1iZXIkMSxcbiAgaXNfc3RyaW5nLFxuICBpc19ib29sZWFuOiBpc19ib29sZWFuJDEsXG4gIGlzX3N5bWJvbCxcbiAgaXNfbnVsbCxcbiAgaXNfdW5kZWZpbmVkLFxuICBpc19mdW5jdGlvbjogaXNfZnVuY3Rpb24kMSxcbiAgaXNfdmFyaWFibGUsXG4gIGlzX3dpbGRjYXJkLFxuICBpc19oZWFkVGFpbCxcbiAgaXNfY2FwdHVyZSxcbiAgaXNfdHlwZSxcbiAgaXNfc3RhcnRzV2l0aCxcbiAgaXNfYm91bmQsXG4gIGlzX29iamVjdCxcbiAgaXNfYXJyYXlcbn07XG5cbmZ1bmN0aW9uIHJlc29sdmVTeW1ib2wocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19zeW1ib2wodmFsdWUpICYmIHZhbHVlID09PSBwYXR0ZXJuO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3RyaW5nKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfc3RyaW5nKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU51bWJlcihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX251bWJlcih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVCb29sZWFuKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfYm9vbGVhbih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVGdW5jdGlvbihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX2Z1bmN0aW9uKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU51bGwocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19udWxsKHZhbHVlKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUJvdW5kKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IHR5cGVvZiBwYXR0ZXJuLnZhbHVlICYmIHZhbHVlID09PSBwYXR0ZXJuLnZhbHVlKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlV2lsZGNhcmQoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVWYXJpYWJsZSgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGFyZ3MucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVIZWFkVGFpbCgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX2FycmF5KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZCA9IHZhbHVlWzBdO1xuICAgIGNvbnN0IHRhaWwgPSB2YWx1ZS5zbGljZSgxKTtcblxuICAgIGFyZ3MucHVzaChoZWFkKTtcbiAgICBhcmdzLnB1c2godGFpbCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUNhcHR1cmUocGF0dGVybikge1xuICBjb25zdCBtYXRjaGVzID0gYnVpbGRNYXRjaChwYXR0ZXJuLnZhbHVlKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKG1hdGNoZXModmFsdWUsIGFyZ3MpKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3RhcnRzV2l0aChwYXR0ZXJuKSB7XG4gIGNvbnN0IHByZWZpeCA9IHBhdHRlcm4ucHJlZml4O1xuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAoQ2hlY2tzLmlzX3N0cmluZyh2YWx1ZSkgJiYgdmFsdWUuc3RhcnRzV2l0aChwcmVmaXgpKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUuc3Vic3RyaW5nKHByZWZpeC5sZW5ndGgpKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVR5cGUocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgcGF0dGVybi50eXBlKSB7XG4gICAgICBjb25zdCBtYXRjaGVzID0gYnVpbGRNYXRjaChwYXR0ZXJuLm9ialBhdHRlcm4pO1xuICAgICAgcmV0dXJuIG1hdGNoZXModmFsdWUsIGFyZ3MpICYmIGFyZ3MucHVzaCh2YWx1ZSkgPiAwO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUFycmF5KHBhdHRlcm4pIHtcbiAgY29uc3QgbWF0Y2hlcyA9IHBhdHRlcm4ubWFwKHggPT4gYnVpbGRNYXRjaCh4KSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX2FycmF5KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggIT0gcGF0dGVybi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWUuZXZlcnkoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgIHJldHVybiBtYXRjaGVzW2ldKHZhbHVlW2ldLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU9iamVjdChwYXR0ZXJuKSB7XG4gIGxldCBtYXRjaGVzID0ge307XG5cbiAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHBhdHRlcm4pKSB7XG4gICAgbWF0Y2hlc1trZXldID0gYnVpbGRNYXRjaChwYXR0ZXJuW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX29iamVjdCh2YWx1ZSkgfHwgcGF0dGVybi5sZW5ndGggPiB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocGF0dGVybikpIHtcbiAgICAgIGlmICghKGtleSBpbiB2YWx1ZSkgfHwgIW1hdGNoZXNba2V5XSh2YWx1ZVtrZXldLCBhcmdzKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVOb01hdGNoKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxudmFyIFJlc29sdmVycyA9IHtcbiAgcmVzb2x2ZUJvdW5kLFxuICByZXNvbHZlV2lsZGNhcmQsXG4gIHJlc29sdmVWYXJpYWJsZSxcbiAgcmVzb2x2ZUhlYWRUYWlsLFxuICByZXNvbHZlQ2FwdHVyZSxcbiAgcmVzb2x2ZVN0YXJ0c1dpdGgsXG4gIHJlc29sdmVUeXBlLFxuICByZXNvbHZlQXJyYXksXG4gIHJlc29sdmVPYmplY3QsXG4gIHJlc29sdmVOb01hdGNoLFxuICByZXNvbHZlU3ltYm9sLFxuICByZXNvbHZlU3RyaW5nLFxuICByZXNvbHZlTnVtYmVyLFxuICByZXNvbHZlQm9vbGVhbixcbiAgcmVzb2x2ZUZ1bmN0aW9uLFxuICByZXNvbHZlTnVsbFxufTtcblxuZnVuY3Rpb24gYnVpbGRNYXRjaChwYXR0ZXJuKSB7XG5cbiAgaWYgKENoZWNrcy5pc192YXJpYWJsZShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVZhcmlhYmxlKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc193aWxkY2FyZChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVdpbGRjYXJkKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc191bmRlZmluZWQocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVXaWxkY2FyZChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfaGVhZFRhaWwocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVIZWFkVGFpbChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfc3RhcnRzV2l0aChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVN0YXJ0c1dpdGgocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2NhcHR1cmUocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVDYXB0dXJlKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19ib3VuZChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUJvdW5kKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc190eXBlKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlVHlwZShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfYXJyYXkocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVBcnJheShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfbnVtYmVyKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlTnVtYmVyKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19zdHJpbmcocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVTdHJpbmcocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2Jvb2xlYW4ocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVCb29sZWFuKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19zeW1ib2wocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVTeW1ib2wocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX251bGwocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVOdWxsKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19vYmplY3QocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVPYmplY3QocGF0dGVybik7XG4gIH1cblxuICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVOb01hdGNoKCk7XG59XG5cbmNsYXNzIE1hdGNoRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGFyZykge1xuICAgIHN1cGVyKCk7XG5cbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9ICdObyBtYXRjaCBmb3I6ICcgKyBhcmcudG9TdHJpbmcoKTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgbGV0IG1hcHBlZFZhbHVlcyA9IGFyZy5tYXAoeCA9PiB4LnRvU3RyaW5nKCkpO1xuICAgICAgdGhpcy5tZXNzYWdlID0gJ05vIG1hdGNoIGZvcjogJyArIG1hcHBlZFZhbHVlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tZXNzYWdlID0gJ05vIG1hdGNoIGZvcjogJyArIGFyZztcbiAgICB9XG5cbiAgICB0aGlzLnN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgdGhpcy5uYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICB9XG59XG5cbmNsYXNzIENhc2Uge1xuXG4gIGNvbnN0cnVjdG9yKHBhdHRlcm4sIGZuLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgICB0aGlzLnBhdHRlcm4gPSBidWlsZE1hdGNoKHBhdHRlcm4pO1xuICAgIHRoaXMuZm4gPSBmbjtcbiAgICB0aGlzLmd1YXJkID0gZ3VhcmQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZV9jYXNlKHBhdHRlcm4sIGZuLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgcmV0dXJuIG5ldyBDYXNlKHBhdHRlcm4sIGZuLCBndWFyZCk7XG59XG5cbmZ1bmN0aW9uIGRlZm1hdGNoKC4uLmNhc2VzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGZvciAobGV0IHByb2Nlc3NlZENhc2Ugb2YgY2FzZXMpIHtcbiAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgIGlmIChwcm9jZXNzZWRDYXNlLnBhdHRlcm4oYXJncywgcmVzdWx0KSAmJiBwcm9jZXNzZWRDYXNlLmd1YXJkLmFwcGx5KHRoaXMsIHJlc3VsdCkpIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NlZENhc2UuZm4uYXBwbHkodGhpcywgcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgTWF0Y2hFcnJvcihhcmdzKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWF0Y2gocGF0dGVybiwgZXhwciwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIGxldCByZXN1bHQgPSBbXTtcbiAgbGV0IHByb2Nlc3NlZFBhdHRlcm4gPSBidWlsZE1hdGNoKHBhdHRlcm4pO1xuICBpZiAocHJvY2Vzc2VkUGF0dGVybihleHByLCByZXN1bHQpICYmIGd1YXJkLmFwcGx5KHRoaXMsIHJlc3VsdCkpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBNYXRjaEVycm9yKGV4cHIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoX25vX3Rocm93KHBhdHRlcm4sIGV4cHIsIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICB0cnkge1xuICAgIHJldHVybiBtYXRjaChwYXR0ZXJuLCBleHByLCBndWFyZCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRocm93IGU7XG4gIH1cbn1cblxudmFyIFBhdHRlcm5zID0ge1xuICBkZWZtYXRjaCwgbWF0Y2gsIE1hdGNoRXJyb3IsIG1hdGNoX25vX3Rocm93LFxuICB2YXJpYWJsZSwgd2lsZGNhcmQsIHN0YXJ0c1dpdGgsXG4gIGNhcHR1cmUsIGhlYWRUYWlsLCB0eXBlLCBib3VuZCwgQ2FzZSwgbWFrZV9jYXNlXG59O1xuXG5jbGFzcyBCaXRTdHJpbmcge1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgdGhpcy5yYXdfdmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShhcmdzKTtcbiAgICB9O1xuXG4gICAgdGhpcy52YWx1ZSA9IE9iamVjdC5mcmVlemUodGhpcy5wcm9jZXNzKGFyZ3MpKTtcbiAgfVxuXG4gIGdldChpbmRleCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlW2luZGV4XTtcbiAgfVxuXG4gIGNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgfVxuXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHZhciBpLFxuICAgICAgICBzID0gXCJcIjtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5jb3VudCgpOyBpKyspIHtcbiAgICAgIGlmIChzICE9PSBcIlwiKSB7XG4gICAgICAgIHMgKz0gXCIsIFwiO1xuICAgICAgfVxuICAgICAgcyArPSB0aGlzW2ldLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiPDxcIiArIHMgKyBcIj4+XCI7XG4gIH1cblxuICBwcm9jZXNzKCkge1xuICAgIGxldCBwcm9jZXNzZWRfdmFsdWVzID0gW107XG5cbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5yYXdfdmFsdWUoKS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHByb2Nlc3NlZF92YWx1ZSA9IHRoaXNbXCJwcm9jZXNzX1wiICsgdGhpcy5yYXdfdmFsdWUoKVtpXS50eXBlXSh0aGlzLnJhd192YWx1ZSgpW2ldKTtcblxuICAgICAgZm9yIChsZXQgYXR0ciBvZiB0aGlzLnJhd192YWx1ZSgpW2ldLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcHJvY2Vzc2VkX3ZhbHVlID0gdGhpc1tcInByb2Nlc3NfXCIgKyBhdHRyXShwcm9jZXNzZWRfdmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBwcm9jZXNzZWRfdmFsdWVzID0gcHJvY2Vzc2VkX3ZhbHVlcy5jb25jYXQocHJvY2Vzc2VkX3ZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc2VkX3ZhbHVlcztcbiAgfVxuXG4gIHByb2Nlc3NfaW50ZWdlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS52YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfZmxvYXQodmFsdWUpIHtcbiAgICBpZiAodmFsdWUuc2l6ZSA9PT0gNjQpIHtcbiAgICAgIHJldHVybiBCaXRTdHJpbmcuZmxvYXQ2NFRvQnl0ZXModmFsdWUudmFsdWUpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUuc2l6ZSA9PT0gMzIpIHtcbiAgICAgIHJldHVybiBCaXRTdHJpbmcuZmxvYXQzMlRvQnl0ZXModmFsdWUudmFsdWUpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2l6ZSBmb3IgZmxvYXRcIik7XG4gIH1cblxuICBwcm9jZXNzX2JpdHN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS52YWx1ZS52YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfYmluYXJ5KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjhBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3V0ZjgodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLnRvVVRGOEFycmF5KHZhbHVlLnZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3NfdXRmMTYodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLnRvVVRGMTZBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3V0ZjMyKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjMyQXJyYXkodmFsdWUudmFsdWUpO1xuICB9XG5cbiAgcHJvY2Vzc19zaWduZWQodmFsdWUpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW3ZhbHVlXSlbMF07XG4gIH1cblxuICBwcm9jZXNzX3Vuc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc19uYXRpdmUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2JpZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfbGl0dGxlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJldmVyc2UoKTtcbiAgfVxuXG4gIHByb2Nlc3Nfc2l6ZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfdW5pdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHN0YXRpYyBpbnRlZ2VyKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImludGVnZXJcIiwgXCJ1bml0XCI6IDEsIFwic2l6ZVwiOiA4IH0pO1xuICB9XG5cbiAgc3RhdGljIGZsb2F0KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImZsb2F0XCIsIFwidW5pdFwiOiAxLCBcInNpemVcIjogNjQgfSk7XG4gIH1cblxuICBzdGF0aWMgYml0c3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImJpdHN0cmluZ1wiLCBcInVuaXRcIjogMSwgXCJzaXplXCI6IHZhbHVlLmxlbmd0aCB9KTtcbiAgfVxuXG4gIHN0YXRpYyBiaXRzKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy5iaXRzdHJpbmcodmFsdWUpO1xuICB9XG5cbiAgc3RhdGljIGJpbmFyeSh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJiaW5hcnlcIiwgXCJ1bml0XCI6IDgsIFwic2l6ZVwiOiB2YWx1ZS5sZW5ndGggfSk7XG4gIH1cblxuICBzdGF0aWMgYnl0ZXModmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLmJpbmFyeSh2YWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgdXRmOCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJ1dGY4XCIgfSk7XG4gIH1cblxuICBzdGF0aWMgdXRmMTYodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwidXRmMTZcIiB9KTtcbiAgfVxuXG4gIHN0YXRpYyB1dGYzMih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJ1dGYzMlwiIH0pO1xuICB9XG5cbiAgc3RhdGljIHNpZ25lZCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwge30sIFwic2lnbmVkXCIpO1xuICB9XG5cbiAgc3RhdGljIHVuc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJ1bnNpZ25lZFwiKTtcbiAgfVxuXG4gIHN0YXRpYyBuYXRpdmUodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcIm5hdGl2ZVwiKTtcbiAgfVxuXG4gIHN0YXRpYyBiaWcodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcImJpZ1wiKTtcbiAgfVxuXG4gIHN0YXRpYyBsaXR0bGUodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcImxpdHRsZVwiKTtcbiAgfVxuXG4gIHN0YXRpYyBzaXplKHZhbHVlLCBjb3VudCkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInNpemVcIjogY291bnQgfSk7XG4gIH1cblxuICBzdGF0aWMgdW5pdCh2YWx1ZSwgY291bnQpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ1bml0XCI6IGNvdW50IH0pO1xuICB9XG5cbiAgc3RhdGljIHdyYXAodmFsdWUsIG9wdCwgbmV3X2F0dHJpYnV0ZSA9IG51bGwpIHtcbiAgICBsZXQgdGhlX3ZhbHVlID0gdmFsdWU7XG5cbiAgICBpZiAoISh2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCkpIHtcbiAgICAgIHRoZV92YWx1ZSA9IHsgXCJ2YWx1ZVwiOiB2YWx1ZSwgXCJhdHRyaWJ1dGVzXCI6IFtdIH07XG4gICAgfVxuXG4gICAgdGhlX3ZhbHVlID0gT2JqZWN0LmFzc2lnbih0aGVfdmFsdWUsIG9wdCk7XG5cbiAgICBpZiAobmV3X2F0dHJpYnV0ZSkge1xuICAgICAgdGhlX3ZhbHVlLmF0dHJpYnV0ZXMucHVzaChuZXdfYXR0cmlidXRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhlX3ZhbHVlO1xuICB9XG5cbiAgc3RhdGljIHRvVVRGOEFycmF5KHN0cikge1xuICAgIHZhciB1dGY4ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGFyY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNoYXJjb2RlIDwgMTI4KSB7XG4gICAgICAgIHV0ZjgucHVzaChjaGFyY29kZSk7XG4gICAgICB9IGVsc2UgaWYgKGNoYXJjb2RlIDwgMjA0OCkge1xuICAgICAgICB1dGY4LnB1c2goMTkyIHwgY2hhcmNvZGUgPj4gNiwgMTI4IHwgY2hhcmNvZGUgJiA2Myk7XG4gICAgICB9IGVsc2UgaWYgKGNoYXJjb2RlIDwgNTUyOTYgfHwgY2hhcmNvZGUgPj0gNTczNDQpIHtcbiAgICAgICAgdXRmOC5wdXNoKDIyNCB8IGNoYXJjb2RlID4+IDEyLCAxMjggfCBjaGFyY29kZSA+PiA2ICYgNjMsIDEyOCB8IGNoYXJjb2RlICYgNjMpO1xuICAgICAgfVxuICAgICAgLy8gc3Vycm9nYXRlIHBhaXJcbiAgICAgIGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICAgIC8vIFVURi0xNiBlbmNvZGVzIDB4MTAwMDAtMHgxMEZGRkYgYnlcbiAgICAgICAgLy8gc3VidHJhY3RpbmcgMHgxMDAwMCBhbmQgc3BsaXR0aW5nIHRoZVxuICAgICAgICAvLyAyMCBiaXRzIG9mIDB4MC0weEZGRkZGIGludG8gdHdvIGhhbHZlc1xuICAgICAgICBjaGFyY29kZSA9IDY1NTM2ICsgKChjaGFyY29kZSAmIDEwMjMpIDw8IDEwIHwgc3RyLmNoYXJDb2RlQXQoaSkgJiAxMDIzKTtcbiAgICAgICAgdXRmOC5wdXNoKDI0MCB8IGNoYXJjb2RlID4+IDE4LCAxMjggfCBjaGFyY29kZSA+PiAxMiAmIDYzLCAxMjggfCBjaGFyY29kZSA+PiA2ICYgNjMsIDEyOCB8IGNoYXJjb2RlICYgNjMpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXRmODtcbiAgfVxuXG4gIHN0YXRpYyB0b1VURjE2QXJyYXkoc3RyKSB7XG4gICAgdmFyIHV0ZjE2ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb2RlUG9pbnQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG5cbiAgICAgIGlmIChjb2RlUG9pbnQgPD0gMjU1KSB7XG4gICAgICAgIHV0ZjE2LnB1c2goMCk7XG4gICAgICAgIHV0ZjE2LnB1c2goY29kZVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHV0ZjE2LnB1c2goY29kZVBvaW50ID4+IDggJiAyNTUpO1xuICAgICAgICB1dGYxNi5wdXNoKGNvZGVQb2ludCAmIDI1NSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1dGYxNjtcbiAgfVxuXG4gIHN0YXRpYyB0b1VURjMyQXJyYXkoc3RyKSB7XG4gICAgdmFyIHV0ZjMyID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb2RlUG9pbnQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG5cbiAgICAgIGlmIChjb2RlUG9pbnQgPD0gMjU1KSB7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goY29kZVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goY29kZVBvaW50ID4+IDggJiAyNTUpO1xuICAgICAgICB1dGYzMi5wdXNoKGNvZGVQb2ludCAmIDI1NSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1dGYzMjtcbiAgfVxuXG4gIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMDAzNDkzL2phdmFzY3JpcHQtZmxvYXQtZnJvbS10by1iaXRzXG4gIHN0YXRpYyBmbG9hdDMyVG9CeXRlcyhmKSB7XG4gICAgdmFyIGJ5dGVzID0gW107XG5cbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDQpO1xuICAgIG5ldyBGbG9hdDMyQXJyYXkoYnVmKVswXSA9IGY7XG5cbiAgICBsZXQgaW50VmVyc2lvbiA9IG5ldyBVaW50MzJBcnJheShidWYpWzBdO1xuXG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uID4+IDI0ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gPj4gMTYgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbiA+PiA4ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gJiAyNTUpO1xuXG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG5cbiAgc3RhdGljIGZsb2F0NjRUb0J5dGVzKGYpIHtcbiAgICB2YXIgYnl0ZXMgPSBbXTtcblxuICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoOCk7XG4gICAgbmV3IEZsb2F0NjRBcnJheShidWYpWzBdID0gZjtcblxuICAgIHZhciBpbnRWZXJzaW9uMSA9IG5ldyBVaW50MzJBcnJheShidWYpWzBdO1xuICAgIHZhciBpbnRWZXJzaW9uMiA9IG5ldyBVaW50MzJBcnJheShidWYpWzFdO1xuXG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiAyNCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiAxNiAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiA4ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24yICYgMjU1KTtcblxuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gMjQgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gMTYgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gOCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMSAmIDI1NSk7XG5cbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbn1cblxuLyogQGZsb3cgKi9cblxuY2xhc3MgTWFpbGJveCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICB9XG5cbiAgZGVsaXZlcihtZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzO1xuICB9XG5cbiAgaXNFbXB0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5tZXNzYWdlcy5sZW5ndGggPT09IDA7XG4gIH1cblxuICByZW1vdmVBdChpbmRleCkge1xuICAgIHRoaXMubWVzc2FnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG52YXIgU3RhdGVzID0ge1xuICBOT1JNQUw6IFN5bWJvbC5mb3IoXCJub3JtYWxcIiksXG4gIEtJTEw6IFN5bWJvbC5mb3IoXCJraWxsXCIpLFxuICBTVVNQRU5EOiBTeW1ib2wuZm9yKFwic3VzcGVuZFwiKSxcbiAgQ09OVElOVUU6IFN5bWJvbC5mb3IoXCJjb250aW51ZVwiKSxcbiAgUkVDRUlWRTogU3ltYm9sLmZvcihcInJlY2VpdmVcIiksXG4gIFNFTkQ6IFN5bWJvbC5mb3IoXCJzZW5kXCIpLFxuICBTTEVFUElORzogU3ltYm9sLmZvcihcInNsZWVwaW5nXCIpLFxuICBSVU5OSU5HOiBTeW1ib2wuZm9yKFwicnVubmluZ1wiKSxcbiAgU1VTUEVOREVEOiBTeW1ib2wuZm9yKFwic3VzcGVuZGVkXCIpLFxuICBTVE9QUEVEOiBTeW1ib2wuZm9yKFwic3RvcHBlZFwiKSxcbiAgU0xFRVA6IFN5bWJvbC5mb3IoXCJzbGVlcFwiKSxcbiAgRVhJVDogU3ltYm9sLmZvcihcImV4aXRcIiksXG4gIE5PTUFUQ0g6IFN5bWJvbC5mb3IoXCJub19tYXRjaFwiKVxufTtcblxuY2xhc3MgUHJvY2VzcyB7XG5cbiAgY29uc3RydWN0b3IocGlkLCBtYWlsYm94KSB7XG4gICAgdGhpcy5waWQgPSBwaWQ7XG4gICAgdGhpcy5tYWlsYm94ID0gbWFpbGJveDtcbiAgICB0aGlzLnN0YXR1cyA9IFN0YXRlcy5TVE9QUEVEO1xuICAgIHRoaXMuZGljdCA9IHt9O1xuICB9XG59XG5cbmNsYXNzIFByb2Nlc3NTeXN0ZW0ge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMucGlkcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLm1haWxib3hlcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLm5hbWVzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMubGlua3MgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLmN1cnJlbnRfcHJvY2VzcyA9IG51bGw7XG4gICAgdGhpcy5zdXNwZW5kZWQgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLm1haW5fcHJvY2Vzc19waWQgPSB0aGlzLnNwYXduKCk7XG4gICAgdGhpcy5zZXRfY3VycmVudCh0aGlzLm1haW5fcHJvY2Vzc19waWQpO1xuICB9XG5cbiAgc3Bhd24oKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkX3Byb2MoZmFsc2UpLnBpZDtcbiAgfVxuXG4gIHNwYXduX2xpbmsoKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkX3Byb2ModHJ1ZSkucGlkO1xuICB9XG5cbiAgbGluayhwaWQpIHtcbiAgICB0aGlzLmxpbmtzLmdldCh0aGlzLnBpZCgpKS5hZGQocGlkKTtcbiAgICB0aGlzLmxpbmtzLmdldChwaWQpLmFkZCh0aGlzLnBpZCgpKTtcbiAgfVxuXG4gIHVubGluayhwaWQpIHtcbiAgICB0aGlzLmxpbmtzLmdldCh0aGlzLnBpZCgpKS5kZWxldGUocGlkKTtcbiAgICB0aGlzLmxpbmtzLmdldChwaWQpLmRlbGV0ZSh0aGlzLnBpZCgpKTtcbiAgfVxuXG4gIHNldF9jdXJyZW50KGlkKSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIGlmIChwaWQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY3VycmVudF9wcm9jZXNzID0gdGhpcy5waWRzLmdldChwaWQpO1xuICAgICAgdGhpcy5jdXJyZW50X3Byb2Nlc3Muc3RhdHVzID0gU3RhdGVzLlJVTk5JTkc7XG4gICAgfVxuICB9XG5cbiAgYWRkX3Byb2MobGlua2VkKSB7XG4gICAgbGV0IG5ld3BpZCA9IG5ldyBQSUQoKTtcbiAgICBsZXQgbWFpbGJveCA9IG5ldyBNYWlsYm94KCk7XG4gICAgbGV0IG5ld3Byb2MgPSBuZXcgUHJvY2VzcyhuZXdwaWQsIG1haWxib3gpO1xuXG4gICAgdGhpcy5waWRzLnNldChuZXdwaWQsIG5ld3Byb2MpO1xuICAgIHRoaXMubWFpbGJveGVzLnNldChuZXdwaWQsIG1haWxib3gpO1xuICAgIHRoaXMubGlua3Muc2V0KG5ld3BpZCwgbmV3IFNldCgpKTtcblxuICAgIGlmIChsaW5rZWQpIHtcbiAgICAgIHRoaXMubGluayhuZXdwaWQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXdwcm9jO1xuICB9XG5cbiAgcmVtb3ZlX3Byb2MocGlkKSB7XG4gICAgdGhpcy5waWRzLmRlbGV0ZShwaWQpO1xuICAgIHRoaXMudW5yZWdpc3RlcihwaWQpO1xuXG4gICAgaWYgKHRoaXMubGlua3MuaGFzKHBpZCkpIHtcbiAgICAgIGZvciAobGV0IGxpbmtwaWQgb2YgdGhpcy5saW5rcy5nZXQocGlkKSkge1xuICAgICAgICB0aGlzLmxpbmtzLmdldChsaW5rcGlkKS5kZWxldGUocGlkKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5saW5rcy5kZWxldGUocGlkKTtcbiAgICB9XG4gIH1cblxuICBleGl0KGlkKSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIHRoaXMucmVtb3ZlX3Byb2MoaWQpO1xuICB9XG5cbiAgcmVnaXN0ZXIobmFtZSwgcGlkKSB7XG4gICAgaWYgKCF0aGlzLm5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgdGhpcy5uYW1lcy5zZXQobmFtZSwgcGlkKTtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYW1lIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCB0byBhbm90aGVyIHByb2Nlc3NcIik7XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJlZChuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZXMuaGFzKG5hbWUpID8gdGhpcy5uYW1lcy5nZXQobmFtZSkgOiBudWxsO1xuICB9XG5cbiAgdW5yZWdpc3RlcihwaWQpIHtcbiAgICBmb3IgKGxldCBuYW1lIG9mIHRoaXMubmFtZXMua2V5cygpKSB7XG4gICAgICBpZiAodGhpcy5uYW1lcy5oYXMobmFtZSkgJiYgdGhpcy5uYW1lcy5nZXQobmFtZSkgPT09IHBpZCkge1xuICAgICAgICB0aGlzLm5hbWVzLmRlbGV0ZShuYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudF9wcm9jZXNzLnBpZDtcbiAgfVxuXG4gIHBpZG9mKGlkKSB7XG4gICAgaWYgKGlkIGluc3RhbmNlb2YgUElEKSB7XG4gICAgICByZXR1cm4gdGhpcy5waWRzLmhhcyhpZCkgPyBpZCA6IG51bGw7XG4gICAgfSBlbHNlIGlmIChpZCBpbnN0YW5jZW9mIFByb2Nlc3MpIHtcbiAgICAgIHJldHVybiBpZC5waWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwaWQgPSB0aGlzLnJlZ2lzdGVyZWQoaWQpO1xuICAgICAgaWYgKHBpZCA9PT0gbnVsbCkgdGhyb3cgXCJQcm9jZXNzIG5hbWUgbm90IHJlZ2lzdGVyZWQ6IFwiICsgaWQgKyBcIiAoXCIgKyB0eXBlb2YgaWQgKyBcIilcIjtcbiAgICAgIHJldHVybiBwaWQ7XG4gICAgfVxuICB9XG5cbiAgcHV0KGlkLCBrZXksIHZhbHVlKSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIGxldCBwcm9jZXNzID0gdGhpcy5waWRzLmdldChwaWQpO1xuICAgIHByb2Nlc3MuZGljdFtrZXldID0gdmFsdWU7XG4gIH1cblxuICBnZXQoaWQsIGtleSkge1xuICAgIGxldCBwaWQgPSB0aGlzLnBpZG9mKGlkKTtcbiAgICBsZXQgcHJvY2VzcyA9IHRoaXMucGlkcy5nZXQocGlkKTtcblxuICAgIGlmIChrZXkgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHByb2Nlc3MuZGljdFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcHJvY2Vzcy5kaWN0O1xuICAgIH1cbiAgfVxuXG4gIGdldF9rZXlzKGlkKSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIGxldCBwcm9jZXNzID0gdGhpcy5waWRzLmdldChwaWQpO1xuXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHByb2Nlc3MuZGljdCk7XG4gIH1cblxuICBlcmFzZShpZCwga2V5KSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIGxldCBwcm9jZXNzID0gdGhpcy5waWRzLmdldChwaWQpO1xuXG4gICAgaWYgKGtleSAhPSBudWxsKSB7XG4gICAgICBkZWxldGUgcHJvY2Vzcy5kaWN0W2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2Nlc3MuZGljdCA9IHt9O1xuICAgIH1cbiAgfVxufVxuXG52YXIgQyA9IE9iamVjdC5mcmVlemUoe1xuXHRQcm9jZXNzU3lzdGVtOiBQcm9jZXNzU3lzdGVtLFxuXHRUdXBsZTogVHVwbGUkMSxcblx0UElEOiBQSUQsXG5cdEJpdFN0cmluZzogQml0U3RyaW5nLFxuXHRQYXR0ZXJuczogUGF0dGVybnMsXG5cdEludGVnZXJUeXBlOiBJbnRlZ2VyVHlwZSxcblx0RmxvYXRUeXBlOiBGbG9hdFR5cGUsXG5cdGNhbGxfcHJvcGVydHk6IGNhbGxfcHJvcGVydHlcbn0pO1xuXG5sZXQgRW51bSA9IHtcblxuICBhbGxfX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4gPSB4ID0+IHgpIHtcbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmICghZnVuKGVsZW0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcblxuICBhbnlfX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4gPSB4ID0+IHgpIHtcbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChmdW4oZWxlbSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIGF0OiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbiwgdGhlX2RlZmF1bHQgPSBudWxsKSB7XG4gICAgaWYgKG4gPiB0aGlzLmNvdW50KGNvbGxlY3Rpb24pIHx8IG4gPCAwKSB7XG4gICAgICByZXR1cm4gdGhlX2RlZmF1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb25bbl07XG4gIH0sXG5cbiAgY29uY2F0OiBmdW5jdGlvbiAoLi4uZW51bWFibGVzKSB7XG4gICAgcmV0dXJuIGVudW1hYmxlc1swXS5jb25jYXQoZW51bWFibGVzWzFdKTtcbiAgfSxcblxuICBjb3VudDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1biA9IG51bGwpIHtcbiAgICBpZiAoZnVuID09IG51bGwpIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uLmxlbmd0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uZmlsdGVyKGZ1bikubGVuZ3RoO1xuICAgIH1cbiAgfSxcblxuICBkcm9wOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgY291bnQpIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5zbGljZShjb3VudCk7XG4gIH0sXG5cbiAgZHJvcF93aGlsZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1bikge1xuICAgIGxldCBjb3VudCA9IDA7XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChmdW4oZWxlbSkpIHtcbiAgICAgICAgY291bnQgPSBjb3VudCArIDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29sbGVjdGlvbi5zbGljZShjb3VudCk7XG4gIH0sXG5cbiAgZWFjaDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1bikge1xuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgZnVuKGVsZW0pO1xuICAgIH1cbiAgfSxcblxuICBlbXB0eV9fcW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5sZW5ndGggPT09IDA7XG4gIH0sXG5cbiAgZmV0Y2g6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBuKSB7XG4gICAgaWYgKEtlcm5lbC5pc19saXN0KGNvbGxlY3Rpb24pKSB7XG4gICAgICBpZiAobiA8IHRoaXMuY291bnQoY29sbGVjdGlvbikgJiYgbiA+PSAwKSB7XG4gICAgICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbShcIm9rXCIpLCBjb2xsZWN0aW9uW25dKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oXCJlcnJvclwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb2xsZWN0aW9uIGlzIG5vdCBhbiBFbnVtZXJhYmxlXCIpO1xuICB9LFxuXG4gIGZldGNoX19lbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbikge1xuICAgIGlmIChLZXJuZWwuaXNfbGlzdChjb2xsZWN0aW9uKSkge1xuICAgICAgaWYgKG4gPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pICYmIG4gPj0gMCkge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbltuXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm91dCBvZiBib3VuZHMgZXJyb3JcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiY29sbGVjdGlvbiBpcyBub3QgYW4gRW51bWVyYWJsZVwiKTtcbiAgfSxcblxuICBmaWx0ZXI6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChmdW4oZWxlbSkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goZWxlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBmaWx0ZXJfbWFwOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZmlsdGVyLCBtYXBwZXIpIHtcbiAgICByZXR1cm4gRW51bS5tYXAoRW51bS5maWx0ZXIoY29sbGVjdGlvbiwgZmlsdGVyKSwgbWFwcGVyKTtcbiAgfSxcblxuICBmaW5kOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgaWZfbm9uZSA9IG51bGwsIGZ1bikge1xuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaWZfbm9uZTtcbiAgfSxcblxuICBpbnRvOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbGlzdCkge1xuICAgIHJldHVybiBsaXN0LmNvbmNhdChjb2xsZWN0aW9uKTtcbiAgfSxcblxuICBtYXA6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIHJlc3VsdC5wdXNoKGZ1bihlbGVtKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBtYXBfcmVkdWNlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgYWNjLCBmdW4pIHtcbiAgICBsZXQgbWFwcGVkID0gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KCk7XG4gICAgbGV0IHRoZV9hY2MgPSBhY2M7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY291bnQoY29sbGVjdGlvbik7IGkrKykge1xuICAgICAgbGV0IHR1cGxlID0gZnVuKGNvbGxlY3Rpb25baV0sIHRoZV9hY2MpO1xuXG4gICAgICB0aGVfYWNjID0gS2VybmVsLmVsZW0odHVwbGUsIDEpO1xuICAgICAgbWFwcGVkID0gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm1hcHBlZC5jb25jYXQoW0tlcm5lbC5lbGVtKHR1cGxlLCAwKV0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShtYXBwZWQsIHRoZV9hY2MpO1xuICB9LFxuXG4gIG1lbWJlcjogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIHZhbHVlKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uaW5jbHVkZXModmFsdWUpO1xuICB9LFxuXG4gIHJlZHVjZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGFjYywgZnVuKSB7XG4gICAgbGV0IHRoZV9hY2MgPSBhY2M7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY291bnQoY29sbGVjdGlvbik7IGkrKykge1xuICAgICAgbGV0IHR1cGxlID0gZnVuKGNvbGxlY3Rpb25baV0sIHRoZV9hY2MpO1xuXG4gICAgICB0aGVfYWNjID0gS2VybmVsLmVsZW0odHVwbGUsIDEpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGVfYWNjO1xuICB9LFxuXG4gIHRha2U6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb3VudCkge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLnNsaWNlKDAsIGNvdW50KTtcbiAgfSxcblxuICB0YWtlX2V2ZXJ5OiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbnRoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBpbmRleCA9IDA7XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChpbmRleCAlIG50aCA9PT0gMCkge1xuICAgICAgICByZXN1bHQucHVzaChlbGVtKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLnJlc3VsdCk7XG4gIH0sXG5cbiAgdGFrZV93aGlsZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1bikge1xuICAgIGxldCBjb3VudCA9IDA7XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChmdW4oZWxlbSkpIHtcbiAgICAgICAgY291bnQgPSBjb3VudCArIDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29sbGVjdGlvbi5zbGljZSgwLCBjb3VudCk7XG4gIH0sXG5cbiAgdG9fbGlzdDogZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxufTtcblxubGV0IFNwZWNpYWxGb3JtcyA9IHtcblxuICBfX0RJUl9fOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKF9fZGlybmFtZSkge1xuICAgICAgcmV0dXJuIF9fZGlybmFtZTtcbiAgICB9XG5cbiAgICBpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9LFxuXG4gIGF0b206IGZ1bmN0aW9uIChfdmFsdWUpIHtcbiAgICByZXR1cm4gU3ltYm9sLmZvcihfdmFsdWUpO1xuICB9LFxuXG4gIGxpc3Q6IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcmVlemUoYXJncyk7XG4gIH0sXG5cbiAgYml0c3RyaW5nOiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIHJldHVybiBuZXcgQml0U3RyaW5nKC4uLmFyZ3MpO1xuICB9LFxuXG4gIGJvdW5kOiBmdW5jdGlvbiAoX3Zhcikge1xuICAgIHJldHVybiBQYXR0ZXJucy5ib3VuZChfdmFyKTtcbiAgfSxcblxuICBfY2FzZTogZnVuY3Rpb24gKGNvbmRpdGlvbiwgY2xhdXNlcykge1xuICAgIHJldHVybiBQYXR0ZXJucy5kZWZtYXRjaCguLi5jbGF1c2VzKShjb25kaXRpb24pO1xuICB9LFxuXG4gIGNvbmQ6IGZ1bmN0aW9uIChjbGF1c2VzKSB7XG4gICAgZm9yIChsZXQgY2xhdXNlIG9mIGNsYXVzZXMpIHtcbiAgICAgIGlmIChjbGF1c2VbMF0pIHtcbiAgICAgICAgcmV0dXJuIGNsYXVzZVsxXSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcigpO1xuICB9LFxuXG4gIGZuOiBmdW5jdGlvbiAoY2xhdXNlcykge1xuICAgIHJldHVybiBQYXR0ZXJucy5kZWZtYXRjaChjbGF1c2VzKTtcbiAgfSxcblxuICBtYXA6IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShvYmopO1xuICB9LFxuXG4gIG1hcF91cGRhdGU6IGZ1bmN0aW9uIChtYXAsIHZhbHVlcykge1xuICAgIHJldHVybiBPYmplY3QuZnJlZXplKE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShtYXAuY29uc3RydWN0b3IucHJvdG90eXBlKSwgbWFwLCB2YWx1ZXMpKTtcbiAgfSxcblxuICBfZm9yOiBmdW5jdGlvbiAoY29sbGVjdGlvbnMsIGZ1biwgZmlsdGVyID0gKCkgPT4gdHJ1ZSwgaW50byA9IFtdLCBwcmV2aW91c1ZhbHVlcyA9IFtdKSB7XG4gICAgbGV0IHBhdHRlcm4gPSBjb2xsZWN0aW9uc1swXVswXTtcbiAgICBsZXQgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zWzBdWzFdO1xuXG4gICAgaWYgKGNvbGxlY3Rpb25zLmxlbmd0aCA9PT0gMSkge1xuXG4gICAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgbGV0IHIgPSBQYXR0ZXJucy5tYXRjaF9ub190aHJvdyhwYXR0ZXJuLCBlbGVtKTtcbiAgICAgICAgbGV0IGFyZ3MgPSBwcmV2aW91c1ZhbHVlcy5jb25jYXQocik7XG5cbiAgICAgICAgaWYgKHIgJiYgZmlsdGVyLmFwcGx5KHRoaXMsIGFyZ3MpKSB7XG4gICAgICAgICAgaW50byA9IEVudW0uaW50byhbZnVuLmFwcGx5KHRoaXMsIGFyZ3MpXSwgaW50byk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGludG87XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBfaW50byA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgbGV0IHIgPSBQYXR0ZXJucy5tYXRjaF9ub190aHJvdyhwYXR0ZXJuLCBlbGVtKTtcbiAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICBfaW50byA9IEVudW0uaW50byh0aGlzLl9mb3IoY29sbGVjdGlvbnMuc2xpY2UoMSksIGZ1biwgZmlsdGVyLCBfaW50bywgcHJldmlvdXNWYWx1ZXMuY29uY2F0KHIpKSwgaW50byk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF9pbnRvO1xuICAgIH1cbiAgfSxcblxuICByZWNlaXZlOiBmdW5jdGlvbiAocmVjZWl2ZV9mdW4sIHRpbWVvdXRfaW5fbXMgPSBudWxsLCB0aW1lb3V0X2ZuID0gdGltZSA9PiB0cnVlKSB7XG4gICAgaWYgKHRpbWVvdXRfaW5fbXMgPT0gbnVsbCB8fCB0aW1lb3V0X2luX21zID09PSBTeXN0ZW0uZm9yKCdpbmZpbml0eScpKSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAoc2VsZi5tYWlsYm94Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIGxldCBtZXNzYWdlID0gc2VsZi5tYWlsYm94WzBdO1xuICAgICAgICAgIHNlbGYubWFpbGJveCA9IHNlbGYubWFpbGJveC5zbGljZSgxKTtcbiAgICAgICAgICByZXR1cm4gcmVjZWl2ZV9mdW4obWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRpbWVvdXRfaW5fbXMgPT09IDApIHtcbiAgICAgIGlmIChzZWxmLm1haWxib3gubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGxldCBtZXNzYWdlID0gc2VsZi5tYWlsYm94WzBdO1xuICAgICAgICBzZWxmLm1haWxib3ggPSBzZWxmLm1haWxib3guc2xpY2UoMSk7XG4gICAgICAgIHJldHVybiByZWNlaXZlX2Z1bihtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIHdoaWxlIChEYXRlLm5vdygpIDwgbm93ICsgdGltZW91dF9pbl9tcykge1xuICAgICAgICBpZiAoc2VsZi5tYWlsYm94Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIGxldCBtZXNzYWdlID0gc2VsZi5tYWlsYm94WzBdO1xuICAgICAgICAgIHNlbGYubWFpbGJveCA9IHNlbGYubWFpbGJveC5zbGljZSgxKTtcbiAgICAgICAgICByZXR1cm4gcmVjZWl2ZV9mdW4obWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRpbWVvdXRfZm4odGltZW91dF9pbl9tcyk7XG4gICAgfVxuICB9LFxuXG4gIHR1cGxlOiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIHJldHVybiBuZXcgVHVwbGUkMSguLi5hcmdzKTtcbiAgfSxcblxuICBfdHJ5OiBmdW5jdGlvbiAoZG9fZnVuLCByZXNjdWVfZnVuY3Rpb24sIGNhdGNoX2Z1biwgZWxzZV9mdW5jdGlvbiwgYWZ0ZXJfZnVuY3Rpb24pIHtcbiAgICBsZXQgcmVzdWx0ID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBkb19mdW4oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsZXQgZXhfcmVzdWx0ID0gbnVsbDtcblxuICAgICAgaWYgKHJlc2N1ZV9mdW5jdGlvbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV4X3Jlc3VsdCA9IHJlc2N1ZV9mdW5jdGlvbihlKTtcbiAgICAgICAgICByZXR1cm4gZXhfcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGlmIChleCBpbnN0YW5jZW9mIFBhdHRlcm5zLk1hdGNoRXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2F0Y2hfZnVuKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXhfcmVzdWx0ID0gY2F0Y2hfZnVuKGUpO1xuICAgICAgICAgIHJldHVybiBleF9yZXN1bHQ7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgaWYgKGV4IGluc3RhbmNlb2YgUGF0dGVybnMuTWF0Y2hFcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRocm93IGU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChhZnRlcl9mdW5jdGlvbikge1xuICAgICAgICBhZnRlcl9mdW5jdGlvbigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbHNlX2Z1bmN0aW9uKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gZWxzZV9mdW5jdGlvbihyZXN1bHQpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgaWYgKGV4IGluc3RhbmNlb2YgUGF0dGVybnMuTWF0Y2hFcnJvcikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gTWF0Y2ggRm91bmQgaW4gRWxzZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgZXg7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbn07XG5cbmZ1bmN0aW9uIHRvX3N0cmluZyQxKHR1cGxlKSB7XG4gIHJldHVybiB0dXBsZS50b1N0cmluZygpO1xufTtcblxuZnVuY3Rpb24gZGVsZXRlX2F0KHR1cGxlLCBpbmRleCkge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHR1cGxlLmNvdW50KCk7IGkrKykge1xuICAgIGlmIChpICE9PSBpbmRleCkge1xuICAgICAgbmV3X2xpc3QucHVzaCh0dXBsZS5nZXQoaSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlLmFwcGx5KG51bGwsIG5ld19saXN0KTtcbn07XG5cbmZ1bmN0aW9uIGR1cGxpY2F0ZShkYXRhLCBzaXplKSB7XG4gIGxldCBhcnJheSA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSBzaXplIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBhcnJheS5wdXNoKGRhdGEpO1xuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUuYXBwbHkobnVsbCwgYXJyYXkpO1xufTtcblxuZnVuY3Rpb24gaW5zZXJ0X2F0KHR1cGxlLCBpbmRleCwgdGVybSkge1xuICBsZXQgbmV3X3R1cGxlID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPD0gdHVwbGUuY291bnQoKTsgaSsrKSB7XG4gICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICBuZXdfdHVwbGUucHVzaCh0ZXJtKTtcbiAgICAgIGkrKztcbiAgICAgIG5ld190dXBsZS5wdXNoKHR1cGxlLmdldChpKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld190dXBsZS5wdXNoKHR1cGxlLmdldChpKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUuYXBwbHkobnVsbCwgbmV3X3R1cGxlKTtcbn07XG5cbmZ1bmN0aW9uIGZyb21fbGlzdChsaXN0KSB7XG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlLmFwcGx5KG51bGwsIGxpc3QpO1xufTtcblxuZnVuY3Rpb24gdG9fbGlzdCh0dXBsZSkge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHR1cGxlLmNvdW50KCk7IGkrKykge1xuICAgIG5ld19saXN0LnB1c2godHVwbGUuZ2V0KGkpKTtcbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xufTtcblxudmFyIFR1cGxlID0ge1xuICB0b19zdHJpbmc6IHRvX3N0cmluZyQxLFxuICBkZWxldGVfYXQsXG4gIGR1cGxpY2F0ZSxcbiAgaW5zZXJ0X2F0LFxuICBmcm9tX2xpc3QsXG4gIHRvX2xpc3Rcbn07XG5cbi8vaHR0cHM6Ly9naXRodWIuY29tL2FpcnBvcnR5aC9wcm90b21vcnBoaXNtXG5jbGFzcyBQcm90b2NvbCB7XG4gIGNvbnN0cnVjdG9yKHNwZWMpIHtcbiAgICB0aGlzLnJlZ2lzdHJ5ID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuZmFsbGJhY2sgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgZnVuTmFtZSBpbiBzcGVjKSB7XG4gICAgICB0aGlzW2Z1bk5hbWVdID0gY3JlYXRlRnVuKGZ1bk5hbWUpLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlRnVuKGZ1bk5hbWUpIHtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGxldCB0aGluZyA9IGFyZ3NbMF07XG4gICAgICAgIGxldCBmdW4gPSBudWxsO1xuXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHRoaW5nKSAmJiB0aGlzLmhhc0ltcGxlbWVudGF0aW9uKEludGVnZXJUeXBlKSkge1xuICAgICAgICAgIGZ1biA9IHRoaXMucmVnaXN0cnkuZ2V0KEludGVnZXJUeXBlKVtmdW5OYW1lXTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpbmcgPT09IFwibnVtYmVyXCIgJiYgIU51bWJlci5pc0ludGVnZXIodGhpbmcpICYmIHRoaXMuaGFzSW1wbGVtZW50YXRpb24oRmxvYXRUeXBlKSkge1xuICAgICAgICAgIGZ1biA9IHRoaXMucmVnaXN0cnkuZ2V0KEZsb2F0VHlwZSlbZnVuTmFtZV07XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5oYXNJbXBsZW1lbnRhdGlvbih0aGluZykpIHtcbiAgICAgICAgICBmdW4gPSB0aGlzLnJlZ2lzdHJ5LmdldCh0aGluZy5jb25zdHJ1Y3RvcilbZnVuTmFtZV07XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5mYWxsYmFjaykge1xuICAgICAgICAgIGZ1biA9IHRoaXMuZmFsbGJhY2tbZnVuTmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZnVuICE9IG51bGwpIHtcbiAgICAgICAgICBsZXQgcmV0dmFsID0gZnVuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBpbXBsZW1lbnRhdGlvbiBmb3VuZCBmb3IgXCIgKyB0aGluZyk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGltcGxlbWVudGF0aW9uKHR5cGUsIGltcGxlbWVudGF0aW9uKSB7XG4gICAgaWYgKHR5cGUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuZmFsbGJhY2sgPSBpbXBsZW1lbnRhdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZWdpc3RyeS5zZXQodHlwZSwgaW1wbGVtZW50YXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIGhhc0ltcGxlbWVudGF0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMucmVnaXN0cnkuaGFzKHRoaW5nLmNvbnN0cnVjdG9yKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0bChsaXN0KSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMubGlzdCguLi5saXN0LnNsaWNlKDEpKTtcbn1cblxuZnVuY3Rpb24gaGQobGlzdCkge1xuICByZXR1cm4gbGlzdFswXTtcbn1cblxuZnVuY3Rpb24gaXNfbmlsKHgpIHtcbiAgcmV0dXJuIHggPT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzX2F0b20oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdzeW1ib2wnO1xufVxuXG5mdW5jdGlvbiBpc19iaW5hcnkoeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdzdHJpbmcnIHx8IHggaW5zdGFuY2VvZiBTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGlzX2Jvb2xlYW4oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdib29sZWFuJyB8fCB4IGluc3RhbmNlb2YgQm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gaXNfZnVuY3Rpb24oeCwgYXJpdHkgPSAtMSkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbicgfHwgeCBpbnN0YW5jZW9mIEZ1bmN0aW9uO1xufVxuXG5mdW5jdGlvbiBpc19mbG9hdCh4KSB7XG4gIHJldHVybiBpc19udW1iZXIoeCkgJiYgIU51bWJlci5pc0ludGVnZXIoeCk7XG59XG5cbmZ1bmN0aW9uIGlzX2ludGVnZXIoeCkge1xuICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcih4KTtcbn1cblxuZnVuY3Rpb24gaXNfbGlzdCh4KSB7XG4gIHJldHVybiB4IGluc3RhbmNlb2YgQXJyYXk7XG59XG5cbmZ1bmN0aW9uIGlzX21hcCh4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgfHwgeCBpbnN0YW5jZW9mIE9iamVjdDtcbn1cblxuZnVuY3Rpb24gaXNfbnVtYmVyKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNfdHVwbGUoeCkge1xuICByZXR1cm4geCBpbnN0YW5jZW9mIFR1cGxlJDE7XG59XG5cbmZ1bmN0aW9uIGxlbmd0aCh4KSB7XG4gIHJldHVybiB4Lmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gaXNfcGlkKHgpIHtcbiAgcmV0dXJuIHggaW5zdGFuY2VvZiBQSUQ7XG59XG5cbmZ1bmN0aW9uIGlzX3BvcnQoeCkge1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzX3JlZmVyZW5jZSh4KSB7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNfYml0c3RyaW5nKHgpIHtcbiAgcmV0dXJuIGlzX2JpbmFyeSh4KSB8fCB4IGluc3RhbmNlb2YgQml0U3RyaW5nO1xufVxuXG5mdW5jdGlvbiBfX2luX18obGVmdCwgcmlnaHQpIHtcbiAgZm9yIChsZXQgeCBvZiByaWdodCkge1xuICAgIGlmIChtYXRjaF9fcW1hcmtfXyhsZWZ0LCB4KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBhYnMobnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLmFicyhudW1iZXIpO1xufVxuXG5mdW5jdGlvbiByb3VuZChudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyKTtcbn1cblxuZnVuY3Rpb24gZWxlbSh0dXBsZSwgaW5kZXgpIHtcbiAgaWYgKGlzX2xpc3QodHVwbGUpKSB7XG4gICAgcmV0dXJuIHR1cGxlW2luZGV4XTtcbiAgfVxuXG4gIHJldHVybiB0dXBsZS5nZXQoaW5kZXgpO1xufVxuXG5mdW5jdGlvbiByZW0obGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgJSByaWdodDtcbn1cblxuZnVuY3Rpb24gZGl2KGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0IC8gcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGFuZChsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCAmJiByaWdodDtcbn1cblxuZnVuY3Rpb24gb3IobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgfHwgcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIG5vdChhcmcpIHtcbiAgcmV0dXJuICFhcmc7XG59XG5cbmZ1bmN0aW9uIGFwcGx5KC4uLmFyZ3MpIHtcbiAgaWYgKGFyZ3MubGVuZ3RoID09PSAzKSB7XG4gICAgbGV0IG1vZCA9IGFyZ3NbMF07XG4gICAgbGV0IGZ1bmMgPSBhcmdzWzFdO1xuICAgIGxldCBmdW5jX2FyZ3MgPSBhcmdzWzJdO1xuICAgIHJldHVybiBtb2RbZnVuY10uYXBwbHkobnVsbCwgZnVuY19hcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgZnVuYyA9IGFyZ3NbMF07XG4gICAgbGV0IGZ1bmNfYXJncyA9IGFyZ3NbMV07XG5cbiAgICByZXR1cm4gZnVuYy5hcHBseShudWxsLCBmdW5jX2FyZ3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvX3N0cmluZyhhcmcpIHtcbiAgaWYgKGlzX3R1cGxlKGFyZykpIHtcbiAgICByZXR1cm4gVHVwbGUudG9fc3RyaW5nKGFyZyk7XG4gIH1cblxuICByZXR1cm4gYXJnLnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoX19xbWFya19fKHBhdHRlcm4sIGV4cHIsIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICByZXR1cm4gUGF0dGVybnMubWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZXhwciwgZ3VhcmQpICE9IG51bGw7XG59XG5cbmZ1bmN0aW9uIGRlZnN0cnVjdChkZWZhdWx0cykge1xuICByZXR1cm4gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKHVwZGF0ZSA9IHt9KSB7XG4gICAgICBsZXQgdGhlX3ZhbHVlcyA9IE9iamVjdC5hc3NpZ24oZGVmYXVsdHMsIHVwZGF0ZSk7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHRoZV92YWx1ZXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGUodXBkYXRlcyA9IHt9KSB7XG4gICAgICBsZXQgeCA9IG5ldyB0aGlzKHVwZGF0ZXMpO1xuICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWZwcm90b2NvbChzcGVjKSB7XG4gIHJldHVybiBuZXcgUHJvdG9jb2woc3BlYyk7XG59XG5cbmZ1bmN0aW9uIGRlZmltcGwocHJvdG9jb2wsIHR5cGUsIGltcGwpIHtcbiAgcHJvdG9jb2wuaW1wbGVtZW50YXRpb24odHlwZSwgaW1wbCk7XG59XG5cbnZhciBLZXJuZWwgPSB7XG4gIFNwZWNpYWxGb3JtcyxcbiAgdGwsXG4gIGhkLFxuICBpc19uaWwsXG4gIGlzX2F0b20sXG4gIGlzX2JpbmFyeSxcbiAgaXNfYm9vbGVhbixcbiAgaXNfZnVuY3Rpb24sXG4gIGlzX2Zsb2F0LFxuICBpc19pbnRlZ2VyLFxuICBpc19saXN0LFxuICBpc19tYXAsXG4gIGlzX251bWJlcixcbiAgaXNfdHVwbGUsXG4gIGxlbmd0aCxcbiAgaXNfcGlkLFxuICBpc19wb3J0LFxuICBpc19yZWZlcmVuY2UsXG4gIGlzX2JpdHN0cmluZyxcbiAgaW46IF9faW5fXyxcbiAgYWJzLFxuICByb3VuZCxcbiAgZWxlbSxcbiAgcmVtLFxuICBkaXYsXG4gIGFuZCxcbiAgb3IsXG4gIG5vdCxcbiAgYXBwbHksXG4gIHRvX3N0cmluZyxcbiAgbWF0Y2hfX3FtYXJrX18sXG4gIGRlZnN0cnVjdCxcbiAgZGVmcHJvdG9jb2wsXG4gIGRlZmltcGxcbn07XG5cbmxldCBBdG9tID0ge307XG5cbkF0b20udG9fc3RyaW5nID0gZnVuY3Rpb24gKGF0b20pIHtcbiAgcmV0dXJuIFN5bWJvbC5rZXlGb3IoYXRvbSk7XG59O1xuXG5BdG9tLnRvX2NoYXJfbGlzdCA9IGZ1bmN0aW9uIChhdG9tKSB7XG4gIHJldHVybiBBdG9tLnRvX3N0cmluZyhhdG9tKS5zcGxpdCgnJyk7XG59O1xuXG5sZXQgSW50ZWdlciA9IHtcblxuICBpc19ldmVuOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBuICUgMiA9PT0gMDtcbiAgfSxcblxuICBpc19vZGQ6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIG4gJSAyICE9PSAwO1xuICB9LFxuXG4gIHBhcnNlOiBmdW5jdGlvbiAoYmluKSB7XG4gICAgbGV0IHJlc3VsdCA9IHBhcnNlSW50KGJpbik7XG5cbiAgICBpZiAoaXNOYU4ocmVzdWx0KSkge1xuICAgICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbShcImVycm9yXCIpO1xuICAgIH1cblxuICAgIGxldCBpbmRleE9mRG90ID0gYmluLmluZGV4T2YoXCIuXCIpO1xuXG4gICAgaWYgKGluZGV4T2ZEb3QgPj0gMCkge1xuICAgICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUocmVzdWx0LCBiaW4uc3Vic3RyaW5nKGluZGV4T2ZEb3QpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShyZXN1bHQsIFwiXCIpO1xuICB9LFxuXG4gIHRvX2NoYXJfbGlzdDogZnVuY3Rpb24gKG51bWJlciwgYmFzZSA9IDEwKSB7XG4gICAgcmV0dXJuIG51bWJlci50b1N0cmluZyhiYXNlKS5zcGxpdChcIlwiKTtcbiAgfSxcblxuICB0b19zdHJpbmc6IGZ1bmN0aW9uIChudW1iZXIsIGJhc2UgPSAxMCkge1xuICAgIHJldHVybiBudW1iZXIudG9TdHJpbmcoYmFzZSk7XG4gIH1cbn07XG5cbmxldCBDaGFycyQxID0gS2VybmVsLmRlZnByb3RvY29sKHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHt9XG59KTtcblxuS2VybmVsLmRlZmltcGwoQ2hhcnMkMSwgQml0U3RyaW5nLCB7XG4gIHRvX3N0cmluZzogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgaWYgKEtlcm5lbC5pc19iaW5hcnkodGhpbmcpKSB7XG4gICAgICByZXR1cm4gdGhpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaW5nLnRvU3RyaW5nKCk7XG4gIH1cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChDaGFycyQxLCBTeW1ib2wsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICBpZiAobmlsKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gQXRvbS50b19zdHJpbmcodGhpbmcpO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoQ2hhcnMkMSwgSW50ZWdlclR5cGUsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gSW50ZWdlci50b19zdHJpbmcodGhpbmcpO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoQ2hhcnMkMSwgRmxvYXRUeXBlLCB7XG4gIHRvX3N0cmluZzogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgcmV0dXJuIHRoaW5nLnRvU3RyaW5nO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoQ2hhcnMkMSwgQXJyYXksIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gdGhpbmcudG9TdHJpbmcoKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKENoYXJzJDEsIFR1cGxlJDEsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gVHVwbGUudG9fc3RyaW5nKHRoaW5nKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKENoYXJzJDEsIG51bGwsIHtcbiAgdG9fc3RyaW5nOiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gdGhpbmcudG9TdHJpbmcoKTtcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIHRvX2F0b20oc3RyaW5nKSB7XG4gIHJldHVybiBTeW1ib2wuZm9yKHN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIHRvX2V4aXN0aW5nX2F0b20oc3RyaW5nKSB7XG4gIHJldHVybiBTeW1ib2wuZm9yKHN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIHRvX2NoYXJfbGlzdChzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5zcGxpdCgnJyk7XG59XG5cbmZ1bmN0aW9uIHRvX2Zsb2F0KHN0cmluZykge1xuICByZXR1cm4gcGFyc2VGbG9hdChzdHJpbmcpO1xufVxuXG5mdW5jdGlvbiB0b19pbnRlZ2VyKHN0cmluZywgYmFzZSA9IDEwKSB7XG4gIHJldHVybiBwYXJzZUludChzdHJpbmcsIGJhc2UpO1xufVxuXG5mdW5jdGlvbiB1cGNhc2UoYmluYXJ5KSB7XG4gIHJldHVybiBiaW5hcnkudG9VcHBlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gZG93bmNhc2UoYmluYXJ5KSB7XG4gIHJldHVybiBiaW5hcnkudG9Mb3dlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gYXQoc3RyaW5nLCBwb3NpdGlvbikge1xuICBpZiAocG9zaXRpb24gPiBzdHJpbmcubGVuZ3RoIC0gMSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHN0cmluZ1twb3NpdGlvbl07XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nKSB7XG4gIGxldCByZXR1cm5TdHJpbmcgPSAnJztcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpID09PSAwKSB7XG4gICAgICByZXR1cm5TdHJpbmcgPSByZXR1cm5TdHJpbmcgKyBzdHJpbmdbaV0udG9VcHBlckNhc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuU3RyaW5nID0gcmV0dXJuU3RyaW5nICsgc3RyaW5nW2ldLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldHVyblN0cmluZztcbn1cblxuZnVuY3Rpb24gY29kZXBvaW50cyhzdHJpbmcpIHtcbiAgcmV0dXJuIHRvX2NoYXJfbGlzdChzdHJpbmcpLm1hcChmdW5jdGlvbiAoYykge1xuICAgIHJldHVybiBjLmNvZGVQb2ludEF0KDApO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udGFpbnNfX3FtX18oc3RyaW5nLCBjb250YWlucykge1xuICBpZiAoQXJyYXkuaXNBcnJheShjb250YWlucykpIHtcbiAgICByZXR1cm4gY29udGFpbnMuc29tZShmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIHN0cmluZy5pbmRleE9mKHMpID4gLTE7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gc3RyaW5nLmluZGV4T2YoY29udGFpbnMpID4gLTE7XG59XG5cbmZ1bmN0aW9uIGR1cGxpY2F0ZSQxKHN1YmplY3QsIG4pIHtcbiAgcmV0dXJuIHN1YmplY3QucmVwZWF0KG4pO1xufVxuXG5mdW5jdGlvbiBlbmRzX3dpdGhfX3FtX18oc3RyaW5nLCBzdWZmaXhlcykge1xuICBpZiAoQXJyYXkuaXNBcnJheShzdWZmaXhlcykpIHtcbiAgICByZXR1cm4gc3VmZml4ZXMuc29tZShmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIHN0cmluZy5lbmRzV2l0aChzKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBzdHJpbmcuZW5kc1dpdGgoc3VmZml4ZXMpO1xufVxuXG5mdW5jdGlvbiBmaXJzdChzdHJpbmcpIHtcbiAgaWYgKCFzdHJpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdbMF07XG59XG5cbmZ1bmN0aW9uIGdyYXBoZW1lcyhzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5zcGxpdCgnJyk7XG59XG5cbmZ1bmN0aW9uIGxhc3Qoc3RyaW5nKSB7XG4gIGlmICghc3RyaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gc3RyaW5nW3N0cmluZy5sZW5ndGggLSAxXTtcbn1cblxuZnVuY3Rpb24gbGVuZ3RoJDEoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBtYXRjaF9fcW1fXyhzdHJpbmcsIHJlZ2V4KSB7XG4gIHJldHVybiBzdHJpbmcubWF0Y2gocmVnZXgpICE9IG51bGw7XG59XG5cbmZ1bmN0aW9uIG5leHRfY29kZXBvaW50KHN0cmluZykge1xuICBpZiAoIXN0cmluZyB8fCBzdHJpbmcgPT09ICcnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShzdHJpbmdbMF0uY29kZVBvaW50QXQoMCksIHN0cmluZy5zdWJzdHIoMSkpO1xufVxuXG5mdW5jdGlvbiBuZXh0X2dyYXBoZW1lKHN0cmluZykge1xuICBpZiAoIXN0cmluZyB8fCBzdHJpbmcgPT09ICcnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShzdHJpbmdbMF0sIHN0cmluZy5zdWJzdHIoMSkpO1xufVxuXG5mdW5jdGlvbiByZXZlcnNlKHN0cmluZykge1xuICBsZXQgcmV0dXJuVmFsdWUgPSAnJztcblxuICBmb3IgKHZhciBpID0gc3RyaW5nLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgcmV0dXJuVmFsdWUgPSByZXR1cm5WYWx1ZSArIHN0cmluZ1tpXTtcbiAgfTtcblxuICByZXR1cm4gcmV0dXJuVmFsdWU7XG59XG5cbmZ1bmN0aW9uIHNwbGl0KHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnNwbGl0KCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0c193aXRoX19xbV9fKHN0cmluZywgcHJlZml4ZXMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkocHJlZml4ZXMpKSB7XG4gICAgcmV0dXJuIHByZWZpeGVzLnNvbWUoZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aChzKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aChwcmVmaXhlcyk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkX2NoYXJhY3Rlcl9fcW1fXyhjb2RlcG9pbnQpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21Db2RlUG9pbnQoY29kZXBvaW50KSAhPSBudWxsO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbnZhciBTdHJpbmckMSA9IHtcbiAgYXQsXG4gIGNhcGl0YWxpemUsXG4gIGNvZGVwb2ludHMsXG4gIGNvbnRhaW5zX19xbV9fLFxuICBkb3duY2FzZSxcbiAgZHVwbGljYXRlOiBkdXBsaWNhdGUkMSxcbiAgZW5kc193aXRoX19xbV9fLFxuICBmaXJzdCxcbiAgZ3JhcGhlbWVzLFxuICBsYXN0LFxuICBsZW5ndGg6IGxlbmd0aCQxLFxuICBtYXRjaF9fcW1fXyxcbiAgbmV4dF9jb2RlcG9pbnQsXG4gIG5leHRfZ3JhcGhlbWUsXG4gIHJldmVyc2UsXG4gIHNwbGl0LFxuICBzdGFydHNfd2l0aF9fcW1fXyxcbiAgdG9fYXRvbSxcbiAgdG9fY2hhcl9saXN0LFxuICB0b19leGlzdGluZ19hdG9tLFxuICB0b19mbG9hdCxcbiAgdG9faW50ZWdlcixcbiAgdXBjYXNlLFxuICB2YWxpZF9jaGFyYWN0ZXJfX3FtX18sXG4gIENoYXJzOiBDaGFycyQxXG59O1xuXG5sZXQgQ2hhcnMgPSBLZXJuZWwuZGVmcHJvdG9jb2woe1xuICB0b19jaGFyX2xpc3Q6IGZ1bmN0aW9uICh0aGluZykge31cbn0pO1xuXG5LZXJuZWwuZGVmaW1wbChDaGFycywgQml0U3RyaW5nLCB7XG4gIHRvX2NoYXJfbGlzdDogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgaWYgKEtlcm5lbC5pc19iaW5hcnkodGhpbmcpKSB7XG4gICAgICByZXR1cm4gU3RyaW5nJDEudG9fY2hhcl9saXN0KHRoaW5nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpbmcudG9TdHJpbmcoKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKENoYXJzLCBTeW1ib2wsIHtcbiAgdG9fY2hhcl9saXN0OiBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gQXRvbS50b19jaGFyX2xpc3QodGhpbmcpO1xuICB9XG59KTtcblxuS2VybmVsLmRlZmltcGwoQ2hhcnMsIEludGVnZXJUeXBlLCB7XG4gIHRvX2NoYXJfbGlzdDogZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgcmV0dXJuIEludGVnZXIudG9fY2hhcl9saXN0KHRoaW5nKTtcbiAgfVxufSk7XG5cbktlcm5lbC5kZWZpbXBsKENoYXJzLCBBcnJheSwge1xuICB0b19jaGFyX2xpc3Q6IGZ1bmN0aW9uICh0aGluZykge1xuICAgIHJldHVybiB0aGluZztcbiAgfVxufSk7XG5cbmxldCBMaXN0ID0ge307XG5cbkxpc3QuQ2hhcnMgPSBDaGFycztcblxuTGlzdC5kZWxldGUgPSBmdW5jdGlvbiAobGlzdCwgaXRlbSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG4gIGxldCB2YWx1ZV9mb3VuZCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IHggb2YgbGlzdCkge1xuICAgIGlmICh4ID09PSBpdGVtICYmIHZhbHVlX2ZvdW5kICE9PSBmYWxzZSkge1xuICAgICAgbmV3X3ZhbHVlLnB1c2goeCk7XG4gICAgICB2YWx1ZV9mb3VuZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh4ICE9PSBpdGVtKSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh4KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmRlbGV0ZV9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgIT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmR1cGxpY2F0ZSA9IGZ1bmN0aW9uIChlbGVtLCBuKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgIG5ld192YWx1ZS5wdXNoKGVsZW0pO1xuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC5maXJzdCA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gIHJldHVybiBsaXN0WzBdO1xufTtcblxuTGlzdC5mbGF0dGVuID0gZnVuY3Rpb24gKGxpc3QsIHRhaWwgPSBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoKSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgeCBvZiBsaXN0KSB7XG4gICAgaWYgKEtlcm5lbC5pc19saXN0KHgpKSB7XG4gICAgICBuZXdfdmFsdWUgPSBuZXdfdmFsdWUuY29uY2F0KExpc3QuZmxhdHRlbih4KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKHgpO1xuICAgIH1cbiAgfVxuXG4gIG5ld192YWx1ZSA9IG5ld192YWx1ZS5jb25jYXQodGFpbCk7XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC5mb2xkbCA9IGZ1bmN0aW9uIChsaXN0LCBhY2MsIGZ1bmMpIHtcbiAgcmV0dXJuIGxpc3QucmVkdWNlKGZ1bmMsIGFjYyk7XG59O1xuXG5MaXN0LmZvbGRyID0gZnVuY3Rpb24gKGxpc3QsIGFjYywgZnVuYykge1xuICBsZXQgbmV3X2FjYyA9IGFjYztcblxuICBmb3IgKHZhciBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIG5ld19hY2MgPSBmdW5jKGxpc3RbaV0sIG5ld19hY2MpO1xuICB9XG5cbiAgcmV0dXJuIG5ld19hY2M7XG59O1xuXG5MaXN0Lmluc2VydF9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCwgdmFsdWUpIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpID09PSBpbmRleCkge1xuICAgICAgbmV3X3ZhbHVlLnB1c2godmFsdWUpO1xuICAgICAgbmV3X3ZhbHVlLnB1c2gobGlzdFtpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGxpc3RbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3Qua2V5ZGVsZXRlID0gZnVuY3Rpb24gKGxpc3QsIGtleSwgcG9zaXRpb24pIHtcbiAgbGV0IG5ld19saXN0ID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIG5ld19saXN0LnB1c2gobGlzdFtpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0LmtleWZpbmQgPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbiwgX2RlZmF1bHQgPSBudWxsKSB7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgcmV0dXJuIGxpc3RbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIF9kZWZhdWx0O1xufTtcblxuTGlzdC5rZXltZW1iZXJfX3FtYXJrX18gPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbikge1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbkxpc3Qua2V5cmVwbGFjZSA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uLCBuZXdfdHVwbGUpIHtcbiAgbGV0IG5ld19saXN0ID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIG5ld19saXN0LnB1c2gobGlzdFtpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld19saXN0LnB1c2gobmV3X3R1cGxlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld19saXN0KTtcbn07XG5cbkxpc3Qua2V5c29ydCA9IGZ1bmN0aW9uIChsaXN0LCBwb3NpdGlvbikge1xuICBsZXQgbmV3X2xpc3QgPSBsaXN0O1xuXG4gIG5ld19saXN0LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBpZiAocG9zaXRpb24gPT09IDApIHtcbiAgICAgIGlmIChhW3Bvc2l0aW9uXS52YWx1ZSA8IGJbcG9zaXRpb25dLnZhbHVlKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFbcG9zaXRpb25dLnZhbHVlID4gYltwb3NpdGlvbl0udmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYVtwb3NpdGlvbl0gPCBiW3Bvc2l0aW9uXSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG5cbiAgICAgIGlmIChhW3Bvc2l0aW9uXSA+IGJbcG9zaXRpb25dKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xufTtcblxuTGlzdC5rZXlzdG9yZSA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uLCBuZXdfdHVwbGUpIHtcbiAgbGV0IG5ld19saXN0ID0gW107XG4gIGxldCByZXBsYWNlZCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmICghS2VybmVsLm1hdGNoX19xbWFya19fKGxpc3RbaV1bcG9zaXRpb25dLCBrZXkpKSB7XG4gICAgICBuZXdfbGlzdC5wdXNoKGxpc3RbaV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfbGlzdC5wdXNoKG5ld190dXBsZSk7XG4gICAgICByZXBsYWNlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFyZXBsYWNlZCkge1xuICAgIG5ld19saXN0LnB1c2gobmV3X3R1cGxlKTtcbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xufTtcblxuTGlzdC5sYXN0ID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIGxpc3RbbGlzdC5sZW5ndGggLSAxXTtcbn07XG5cbkxpc3QucmVwbGFjZV9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCwgdmFsdWUpIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpID09PSBpbmRleCkge1xuICAgICAgbmV3X3ZhbHVlLnB1c2godmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LnVwZGF0ZV9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCwgZnVuKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QuY291bnQoKTsgaSsrKSB7XG4gICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChmdW4obGlzdC5nZXQoaSkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3X3ZhbHVlLnB1c2gobGlzdC5nZXQoaSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXdfdmFsdWU7XG59O1xuXG5MaXN0LndyYXAgPSBmdW5jdGlvbiAobGlzdCkge1xuICBpZiAoS2VybmVsLmlzX2xpc3QobGlzdCkpIHtcbiAgICByZXR1cm4gbGlzdDtcbiAgfSBlbHNlIGlmIChsaXN0ID09IG51bGwpIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdChsaXN0KTtcbiAgfVxufTtcblxuTGlzdC56aXAgPSBmdW5jdGlvbiAobGlzdF9vZl9saXN0cykge1xuICBpZiAobGlzdF9vZl9saXN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KCk7XG4gIH1cblxuICBsZXQgbmV3X3ZhbHVlID0gW107XG4gIGxldCBzbWFsbGVzdF9sZW5ndGggPSBsaXN0X29mX2xpc3RzWzBdO1xuXG4gIGZvciAobGV0IHggb2YgbGlzdF9vZl9saXN0cykge1xuICAgIGlmICh4Lmxlbmd0aCA8IHNtYWxsZXN0X2xlbmd0aCkge1xuICAgICAgc21hbGxlc3RfbGVuZ3RoID0geC5sZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzbWFsbGVzdF9sZW5ndGg7IGkrKykge1xuICAgIGxldCBjdXJyZW50X3ZhbHVlID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBsaXN0X29mX2xpc3RzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjdXJyZW50X3ZhbHVlLnB1c2gobGlzdF9vZl9saXN0c1tqXVtpXSk7XG4gICAgfVxuXG4gICAgbmV3X3ZhbHVlLnB1c2goS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZSguLi5jdXJyZW50X3ZhbHVlKSk7XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LnRvX3R1cGxlID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUuYXBwbHkobnVsbCwgbGlzdCk7XG59O1xuXG5MaXN0LmFwcGVuZCA9IGZ1bmN0aW9uIChsaXN0LCB2YWx1ZSkge1xuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLmxpc3QuY29uY2F0KFt2YWx1ZV0pKTtcbn07XG5cbkxpc3QucHJlcGVuZCA9IGZ1bmN0aW9uIChsaXN0LCB2YWx1ZSkge1xuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLlt2YWx1ZV0uY29uY2F0KGxpc3QpKTtcbn07XG5cbkxpc3QuY29uY2F0ID0gZnVuY3Rpb24gKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0LmNvbmNhdChyaWdodCk7XG59O1xuXG5sZXQgUmFuZ2UgPSBmdW5jdGlvbiAoX2ZpcnN0LCBfbGFzdCkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmFuZ2UpKSB7XG4gICAgcmV0dXJuIG5ldyBSYW5nZShfZmlyc3QsIF9sYXN0KTtcbiAgfVxuXG4gIHRoaXMuZmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9maXJzdDtcbiAgfTtcblxuICB0aGlzLmxhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9sYXN0O1xuICB9O1xuXG4gIGxldCBfcmFuZ2UgPSBbXTtcblxuICBmb3IgKGxldCBpID0gX2ZpcnN0OyBpIDw9IF9sYXN0OyBpKyspIHtcbiAgICBfcmFuZ2UucHVzaChpKTtcbiAgfVxuXG4gIF9yYW5nZSA9IE9iamVjdC5mcmVlemUoX3JhbmdlKTtcblxuICB0aGlzLnZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfcmFuZ2U7XG4gIH07XG5cbiAgdGhpcy5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9yYW5nZS5sZW5ndGg7XG4gIH07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SYW5nZS5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudmFsdWUoKVtTeW1ib2wuaXRlcmF0b3JdKCk7XG59O1xuXG5SYW5nZS5uZXcgPSBmdW5jdGlvbiAoZmlyc3QsIGxhc3QpIHtcbiAgcmV0dXJuIFJhbmdlKGZpcnN0LCBsYXN0KTtcbn07XG5cblJhbmdlLnJhbmdlX19xbWFya19fID0gZnVuY3Rpb24gKHJhbmdlKSB7XG4gIHJldHVybiByYW5nZSBpbnN0YW5jZW9mIFJhbmdlO1xufTtcblxubGV0IEtleXdvcmQgPSB7fTtcblxuS2V5d29yZC5oYXNfa2V5X19xbV9fID0gZnVuY3Rpb24gKGtleXdvcmRzLCBrZXkpIHtcbiAgZm9yIChsZXQga2V5d29yZCBvZiBrZXl3b3Jkcykge1xuICAgIGlmIChLZXJuZWwuZWxlbShrZXl3b3JkLCAwKSA9PSBrZXkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbktleXdvcmQuZ2V0ID0gZnVuY3Rpb24gKGtleXdvcmRzLCBrZXksIHRoZV9kZWZhdWx0ID0gbnVsbCkge1xuICBmb3IgKGxldCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XG4gICAgaWYgKEtlcm5lbC5lbGVtKGtleXdvcmQsIDApID09IGtleSkge1xuICAgICAgcmV0dXJuIEtlcm5lbC5lbGVtKGtleXdvcmQsIDEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGVfZGVmYXVsdDtcbn07XG5cbmxldCBBZ2VudCA9IHt9O1xuXG5BZ2VudC5zdGFydCA9IGZ1bmN0aW9uIChmdW4sIG9wdGlvbnMgPSBbXSkge1xuICBsZXQgcGlkID0gc2VsZi5wcm9jZXNzZXMuc3Bhd24oKTtcblxuICBpZiAoS2V5d29yZC5oYXNfa2V5X19xbV9fKG9wdGlvbnMsIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnbmFtZScpKSkge1xuICAgIHBpZCA9IHNlbGYucHJvY2Vzc2VzLnJlZ2lzdGVyKEtleXdvcmQuZ2V0KG9wdGlvbnMsIEtlcm5lbC5TcGVjaWFsRm9ybXMuYXRvbSgnbmFtZScpKSwgcGlkKTtcbiAgfVxuXG4gIHNlbGYucHJvY2Vzc2VzLnB1dChwaWQsICdzdGF0ZScsIGZ1bigpKTtcbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUoS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpLCBwaWQpO1xufTtcblxuQWdlbnQuc3RvcCA9IGZ1bmN0aW9uIChhZ2VudCwgdGltZW91dCA9IDUwMDApIHtcbiAgc2VsZi5wcm9jZXNzZXMuZXhpdChhZ2VudCk7XG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ29rJyk7XG59O1xuXG5BZ2VudC51cGRhdGUgPSBmdW5jdGlvbiAoYWdlbnQsIGZ1biwgdGltZW91dCA9IDUwMDApIHtcblxuICBjb25zdCBjdXJyZW50X3N0YXRlID0gc2VsZi5wcm9jZXNzZXMuZ2V0KGFnZW50LCAnc3RhdGUnKTtcbiAgc2VsZi5wcm9jZXNzZXMucHV0KGFnZW50LCAnc3RhdGUnLCBmdW4oY3VycmVudF9zdGF0ZSkpO1xuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ29rJyk7XG59O1xuXG5BZ2VudC5nZXQgPSBmdW5jdGlvbiAoYWdlbnQsIGZ1biwgdGltZW91dCA9IDUwMDApIHtcbiAgcmV0dXJuIGZ1bihzZWxmLnByb2Nlc3Nlcy5nZXQoYWdlbnQsICdzdGF0ZScpKTtcbn07XG5cbkFnZW50LmdldF9hbmRfdXBkYXRlID0gZnVuY3Rpb24gKGFnZW50LCBmdW4sIHRpbWVvdXQgPSA1MDAwKSB7XG5cbiAgY29uc3QgZ2V0X2FuZF91cGRhdGVfdHVwbGUgPSBmdW4oc2VsZi5wcm9jZXNzZXMuZ2V0KGFnZW50LCAnc3RhdGUnKSk7XG4gIHNlbGYucHJvY2Vzc2VzLnB1dChhZ2VudCwgJ3N0YXRlJywgS2VybmVsLmVsZW0oZ2V0X2FuZF91cGRhdGVfdHVwbGUsIDEpKTtcblxuICByZXR1cm4gS2VybmVsLmVsZW0oZ2V0X2FuZF91cGRhdGVfdHVwbGUsIDApO1xufTtcblxuLy9odHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjU29sdXRpb25fMl8lRTIlODAlOTNfcmV3cml0ZV90aGVfRE9Nc19hdG9iKClfYW5kX2J0b2EoKV91c2luZ19KYXZhU2NyaXB0J3NfVHlwZWRBcnJheXNfYW5kX1VURi04XG5mdW5jdGlvbiBiNjRFbmNvZGVVbmljb2RlKHN0cikge1xuICByZXR1cm4gYnRvYShlbmNvZGVVUklDb21wb25lbnQoc3RyKS5yZXBsYWNlKC8lKFswLTlBLUZdezJ9KS9nLCBmdW5jdGlvbiAobWF0Y2gsIHAxKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoJzB4JyArIHAxKTtcbiAgfSkpO1xufVxuXG5mdW5jdGlvbiBlbmNvZGU2NChkYXRhKSB7XG4gIHJldHVybiBiNjRFbmNvZGVVbmljb2RlKGRhdGEpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGU2NChkYXRhKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUoS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpLCBhdG9iKGRhdGEpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ2Vycm9yJyk7XG4gIH1cbiAgcmV0dXJuIGJ0b2EoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZTY0X19lbV9fKGRhdGEpIHtcbiAgcmV0dXJuIGF0b2IoZGF0YSk7XG59XG5cbnZhciBiYXNlID0ge1xuICBlbmNvZGU2NCxcbiAgZGVjb2RlNjQsXG4gIGRlY29kZTY0X19lbV9fXG59O1xuXG5mdW5jdGlvbiBibm90KGV4cHIpIHtcbiAgcmV0dXJuIH5leHByO1xufVxuXG5mdW5jdGlvbiBiYW5kKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0ICYgcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGJvcihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCB8IHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBic2wobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgPDwgcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGJzcihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCA+PiByaWdodDtcbn1cblxuZnVuY3Rpb24gYnhvcihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCBeIHJpZ2h0O1xufVxuXG52YXIgYml0d2lzZSA9IHtcbiAgYm5vdCxcbiAgYmFuZCxcbiAgYm9yLFxuICBic2wsXG4gIGJzcixcbiAgYnhvclxufTtcblxubGV0IEVudW1lcmFibGUgPSBLZXJuZWwuZGVmcHJvdG9jb2woe1xuICBjb3VudDogZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHt9LFxuICBtZW1iZXJfcW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIHZhbHVlKSB7fSxcbiAgcmVkdWNlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgYWNjLCBmdW4pIHt9XG59KTtcblxubGV0IENvbGxlY3RhYmxlID0gS2VybmVsLmRlZnByb3RvY29sKHtcbiAgaW50bzogZnVuY3Rpb24gKGNvbGxlY3RhYmxlKSB7fVxufSk7XG5cbmxldCBJbnNwZWN0ID0gS2VybmVsLmRlZnByb3RvY29sKHtcbiAgaW5zcGVjdDogZnVuY3Rpb24gKHRoaW5nLCBvcHRzKSB7fVxufSk7XG5cbmZ1bmN0aW9uIF9fbmV3X18oKSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKHt9KTtcbn1cblxuZnVuY3Rpb24ga2V5cyhtYXApIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1hcCk7XG59XG5cbmZ1bmN0aW9uIHNpemUobWFwKSB7XG4gIHJldHVybiBrZXlzKG1hcCkubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiB0b19saXN0JDEobWFwKSB7XG4gIGxldCBtYXBfa2V5cyA9IGtleXMobWFwKTtcbiAgbGV0IGxpc3QgPSBbXTtcblxuICBmb3IgKGxldCBrZXkgb2YgbWFwX2tleXMpIHtcbiAgICBsaXN0LnB1c2goU3BlY2lhbEZvcm1zLnR1cGxlKGtleSwgbWFwW2tleV0pKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubGlzdCguLi5saXN0KTtcbn1cblxuZnVuY3Rpb24gdmFsdWVzKG1hcCkge1xuICBsZXQgbWFwX2tleXMgPSBrZXlzKG1hcCk7XG4gIGxldCBsaXN0ID0gW107XG5cbiAgZm9yIChsZXQga2V5IG9mIG1hcF9rZXlzKSB7XG4gICAgbGlzdC5wdXNoKG1hcFtrZXldKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubGlzdCguLi5saXN0KTtcbn1cblxuZnVuY3Rpb24gZnJvbV9zdHJ1Y3Qoc3RydWN0KSB7XG4gIGxldCBtYXAgPSBPYmplY3QuYXNzaWduKHt9LCBzdHJ1Y3QpO1xuICBkZWxldGUgbWFwW1N5bWJvbC5mb3IoXCJfX3N0cnVjdF9fXCIpXTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChtYXApO1xufVxuXG5mdW5jdGlvbiBfX2RlbGV0ZV9fKG1hcCwga2V5KSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgbWFwKTtcblxuICBkZWxldGUgbmV3X21hcFtrZXldO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBlcXVhbF9fcW1hcmtfXyhtYXAxLCBtYXAyKSB7XG4gIHJldHVybiBtYXAxID09PSBtYXAyO1xufVxuXG5mdW5jdGlvbiBmZXRjaF9fZW1hcmtfXyhtYXAsIGtleSkge1xuICBpZiAoa2V5IGluIG1hcCkge1xuICAgIHJldHVybiBtYXBba2V5XTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihcIktleSBub3QgZm91bmQuXCIpO1xufVxuXG5mdW5jdGlvbiBmZXRjaChtYXAsIGtleSkge1xuICBpZiAoa2V5IGluIG1hcCkge1xuICAgIHJldHVybiBTcGVjaWFsRm9ybXMudHVwbGUoU3BlY2lhbEZvcm1zLmF0b20oXCJva1wiKSwgbWFwW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5hdG9tKFwiZXJyb3JcIik7XG59XG5cbmZ1bmN0aW9uIGhhc19rZXlfX3FtYXJrX18obWFwLCBrZXkpIHtcbiAgcmV0dXJuIGtleSBpbiBtYXA7XG59XG5cbmZ1bmN0aW9uIHNwbGl0JDEobWFwLCBrZXlzKSB7XG4gIGxldCBzcGxpdDEgPSB7fTtcbiAgbGV0IHNwbGl0MiA9IHt9O1xuXG4gIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhtYXApKSB7XG4gICAgaWYgKGtleXMuaW5kZXhPZihrZXkpID4gLTEpIHtcbiAgICAgIHNwbGl0MVtrZXldID0gbWFwW2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHNwbGl0MltrZXldID0gbWFwW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy50dXBsZShTcGVjaWFsRm9ybXMubWFwKHNwbGl0MSksIFNwZWNpYWxGb3Jtcy5tYXAoc3BsaXQyKSk7XG59XG5cbmZ1bmN0aW9uIHRha2UobWFwLCBrZXlzKSB7XG4gIGxldCBzcGxpdDEgPSB7fTtcblxuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMobWFwKSkge1xuICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA+IC0xKSB7XG4gICAgICBzcGxpdDFba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKHNwbGl0MSk7XG59XG5cbmZ1bmN0aW9uIGRyb3AobWFwLCBrZXlzKSB7XG4gIGxldCBzcGxpdDEgPSB7fTtcblxuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMobWFwKSkge1xuICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA9PT0gLTEpIHtcbiAgICAgIHNwbGl0MVtrZXldID0gbWFwW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAoc3BsaXQxKTtcbn1cblxuZnVuY3Rpb24gcHV0X25ldyhtYXAsIGtleSwgdmFsdWUpIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSB2YWx1ZTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gcHV0X25ld19sYXp5KG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSBmdW4oKTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gZ2V0X2FuZF91cGRhdGUobWFwLCBrZXksIGZ1bikge1xuICBpZiAoa2V5IGluIG1hcCkge1xuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG4gIG5ld19tYXBba2V5XSA9IGZ1bihtYXBba2V5XSk7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHBvcF9sYXp5KG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKCFrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIFNwZWNpYWxGb3Jtcy50dXBsZShmdW4oKSwgbWFwKTtcbiAgfVxuXG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgbWFwKTtcbiAgbGV0IHZhbHVlID0gZnVuKG5ld19tYXBba2V5XSk7XG4gIGRlbGV0ZSBuZXdfbWFwW2tleV07XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy50dXBsZSh2YWx1ZSwgbmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHBvcChtYXAsIGtleSwgX2RlZmF1bHQgPSBudWxsKSB7XG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIHJldHVybiBTcGVjaWFsRm9ybXMudHVwbGUoX2RlZmF1bHQsIG1hcCk7XG4gIH1cblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG4gIGxldCB2YWx1ZSA9IG5ld19tYXBba2V5XTtcbiAgZGVsZXRlIG5ld19tYXBba2V5XTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLnR1cGxlKHZhbHVlLCBuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gZ2V0X2xhenkobWFwLCBrZXksIGZ1bikge1xuICBpZiAoIWtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gZnVuKCk7XG4gIH1cblxuICByZXR1cm4gZnVuKG1hcFtrZXldKTtcbn1cblxuZnVuY3Rpb24gZ2V0KG1hcCwga2V5LCBfZGVmYXVsdCA9IG51bGwpIHtcbiAgaWYgKCFrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIF9kZWZhdWx0O1xuICB9XG5cbiAgcmV0dXJuIG1hcFtrZXldO1xufVxuXG5mdW5jdGlvbiBwdXQobWFwLCBrZXksIHZhbCkge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdCh7fSwgbWFwKTtcbiAgbmV3X21hcFtrZXldID0gdmFsO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVfX2VtYXJrX18obWFwLCBrZXksIGZ1bikge1xuICBpZiAoIWtleSBpbiBtYXApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJLZXkgbm90IGZvdW5kXCIpO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3Qoe30sIG1hcCk7XG4gIG5ld19tYXBba2V5XSA9IGZ1bihtYXBba2V5XSk7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3Jtcy5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZShtYXAsIGtleSwgaW5pdGlhbCwgZnVuKSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0KHt9LCBtYXApO1xuXG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIG5ld19tYXBba2V5XSA9IGluaXRpYWw7XG4gIH0gZWxzZSB7XG4gICAgbmV3X21hcFtrZXldID0gZnVuKG1hcFtrZXldKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG52YXIgbWFwID0ge1xuICBuZXc6IF9fbmV3X18sXG4gIGtleXMsXG4gIHNpemUsXG4gIHRvX2xpc3Q6IHRvX2xpc3QkMSxcbiAgdmFsdWVzLFxuICBmcm9tX3N0cnVjdCxcbiAgZGVsZXRlOiBfX2RlbGV0ZV9fLFxuICBkcm9wLFxuICBlcXVhbF9fcW1hcmtfXyxcbiAgZmV0Y2hfX2VtYXJrX18sXG4gIGZldGNoLFxuICBoYXNfa2V5X19xbWFya19fLFxuICBzcGxpdDogc3BsaXQkMSxcbiAgdGFrZSxcbiAgcHV0X25ldyxcbiAgcHV0X25ld19sYXp5LFxuICBnZXRfYW5kX3VwZGF0ZSxcbiAgcG9wX2xhenksXG4gIHBvcCxcbiAgZ2V0X2xhenksXG4gIGdldCxcbiAgcHV0LFxuICB1cGRhdGVfX2VtYXJrX18sXG4gIHVwZGF0ZVxufTtcblxuZnVuY3Rpb24gX19uZXdfXyQxKCkge1xuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcCh7IFtTeW1ib2wuZm9yKCdfX3N0cnVjdF9fJyldOiBTeW1ib2wuZm9yKCdNYXBTZXQnKSwgc2V0OiBTcGVjaWFsRm9ybXMubGlzdCgpIH0pO1xufVxuXG5mdW5jdGlvbiBzaXplJDIobWFwKSB7XG4gIHJldHVybiBtYXAuc2V0Lmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gdG9fbGlzdCQzKG1hcCkge1xuICByZXR1cm4gbWFwLnNldDtcbn1cblxuZnVuY3Rpb24gX19kZWxldGVfXyQyKHNldCwgdGVybSkge1xuICBsZXQgbmV3X2xpc3QgPSBMaXN0LmRlbGV0ZShzZXQuc2V0LCB0ZXJtKTtcblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIHNldCk7XG4gIG5ld19tYXAuc2V0ID0gbmV3X2xpc3Q7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBwdXQkMihzZXQsIHRlcm0pIHtcbiAgaWYgKHNldC5zZXQuaW5kZXhPZih0ZXJtKSA9PT0gLTEpIHtcbiAgICBsZXQgbmV3X2xpc3QgPSBMaXN0LmFwcGVuZChzZXQuc2V0LCB0ZXJtKTtcblxuICAgIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbih7fSwgc2V0KTtcbiAgICBuZXdfbWFwLnNldCA9IG5ld19saXN0O1xuICAgIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xuICB9XG5cbiAgcmV0dXJuIHNldDtcbn1cblxuZnVuY3Rpb24gZGlmZmVyZW5jZSQxKHNldDEsIHNldDIpIHtcbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBzZXQxKTtcblxuICBmb3IgKGxldCB2YWwgb2Ygc2V0MS5zZXQpIHtcbiAgICBpZiAobWVtYmVyX19xbWFya19fJDEoc2V0MiwgdmFsKSkge1xuICAgICAgbmV3X21hcC5zZXQgPSBMaXN0LmRlbGV0ZShuZXdfbWFwLnNldCwgdmFsKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gaW50ZXJzZWN0aW9uJDEoc2V0MSwgc2V0Mikge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIHNldDEpO1xuXG4gIGZvciAobGV0IHZhbCBvZiBzZXQxLnNldCkge1xuICAgIGlmICghbWVtYmVyX19xbWFya19fJDEoc2V0MiwgdmFsKSkge1xuICAgICAgbmV3X21hcC5zZXQgPSBMaXN0LmRlbGV0ZShuZXdfbWFwLnNldCwgdmFsKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gdW5pb24kMShzZXQxLCBzZXQyKSB7XG4gIGxldCBuZXdfbWFwID0gc2V0MTtcblxuICBmb3IgKGxldCB2YWwgb2Ygc2V0Mi5zZXQpIHtcbiAgICBuZXdfbWFwID0gcHV0JDIobmV3X21hcCwgdmFsKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBkaXNqb2luX19xbWFya19fJDEoc2V0MSwgc2V0Mikge1xuICBmb3IgKGxldCB2YWwgb2Ygc2V0MS5zZXQpIHtcbiAgICBpZiAobWVtYmVyX19xbWFya19fJDEoc2V0MiwgdmFsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBtZW1iZXJfX3FtYXJrX18kMShzZXQsIHZhbHVlKSB7XG4gIHJldHVybiBzZXQuc2V0LmluZGV4T2YodmFsdWUpID49IDA7XG59XG5cbmZ1bmN0aW9uIGVxdWFsX19xbWFya19fJDIoc2V0MSwgc2V0Mikge1xuICByZXR1cm4gc2V0MS5zZXQgPT09IHNldDIuc2V0O1xufVxuXG5mdW5jdGlvbiBzdWJzZXRfX3FtYXJrX18kMShzZXQxLCBzZXQyKSB7XG4gIGZvciAobGV0IHZhbCBvZiBzZXQxLnNldCkge1xuICAgIGlmICghbWVtYmVyX19xbWFya19fJDEoc2V0MiwgdmFsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG52YXIgTWFwU2V0ID0ge1xuICBuZXc6IF9fbmV3X18kMSxcbiAgc2l6ZTogc2l6ZSQyLFxuICB0b19saXN0OiB0b19saXN0JDMsXG4gIGRpc2pvaW5fX3FtYXJrX186IGRpc2pvaW5fX3FtYXJrX18kMSxcbiAgZGVsZXRlOiBfX2RlbGV0ZV9fJDIsXG4gIHN1YnNldF9fcW1hcmtfXzogc3Vic2V0X19xbWFya19fJDEsXG4gIGVxdWFsX19xbWFya19fOiBlcXVhbF9fcW1hcmtfXyQyLFxuICBtZW1iZXJfX3FtYXJrX186IG1lbWJlcl9fcW1hcmtfXyQxLFxuICBwdXQ6IHB1dCQyLFxuICB1bmlvbjogdW5pb24kMSxcbiAgaW50ZXJzZWN0aW9uOiBpbnRlcnNlY3Rpb24kMSxcbiAgZGlmZmVyZW5jZTogZGlmZmVyZW5jZSQxXG59O1xuXG5mdW5jdGlvbiBzaXplJDEobWFwKSB7XG4gIHJldHVybiBNYXBTZXQuc2l6ZShtYXApO1xufVxuXG5mdW5jdGlvbiB0b19saXN0JDIobWFwKSB7XG4gIHJldHVybiBNYXBTZXQudG9fbGlzdChtYXApO1xufVxuXG5mdW5jdGlvbiBfX2RlbGV0ZV9fJDEoc2V0LCB0ZXJtKSB7XG4gIHJldHVybiBNYXBTZXQuZGVsZXRlKHNldCwgdGVybSk7XG59XG5cbmZ1bmN0aW9uIHB1dCQxKHNldCwgdGVybSkge1xuICByZXR1cm4gTWFwU2V0LnB1dChzZXQsIHRlcm0pO1xufVxuXG5mdW5jdGlvbiBkaWZmZXJlbmNlKHNldDEsIHNldDIpIHtcbiAgcmV0dXJuIE1hcFNldC5kaWZmZXJlbmNlKHNldDEsIHNldDIpO1xufVxuXG5mdW5jdGlvbiBpbnRlcnNlY3Rpb24oc2V0MSwgc2V0Mikge1xuICByZXR1cm4gTWFwU2V0LmludGVyc2VjdGlvbihzZXQxLCBzZXQyKTtcbn1cblxuZnVuY3Rpb24gdW5pb24oc2V0MSwgc2V0Mikge1xuICByZXR1cm4gTWFwU2V0LnVuaW9uKHNldDEsIHNldDIpO1xufVxuXG5mdW5jdGlvbiBkaXNqb2luX19xbWFya19fKHNldDEsIHNldDIpIHtcbiAgcmV0dXJuIE1hcFNldC5kaXNqb2luX19xbWFya19fKHNldDEsIHNldDIpO1xufVxuXG5mdW5jdGlvbiBtZW1iZXJfX3FtYXJrX18oc2V0LCB2YWx1ZSkge1xuICByZXR1cm4gTWFwU2V0Lm1lbWJlcl9fcW1hcmtfXyhzZXQxLCBzZXQyKTtcbn1cblxuZnVuY3Rpb24gZXF1YWxfX3FtYXJrX18kMShzZXQxLCBzZXQyKSB7XG4gIHJldHVybiBNYXBTZXQuZXF1YWxfX3FtYXJrX18oc2V0MSwgc2V0Mik7XG59XG5cbmZ1bmN0aW9uIHN1YnNldF9fcW1hcmtfXyhzZXQxLCBzZXQyKSB7XG4gIHJldHVybiBNYXBTZXQuc3Vic2V0X19xbWFya19fKHNldDEsIHNldDIpO1xufVxuXG52YXIgc2V0ID0ge1xuICBzaXplOiBzaXplJDEsXG4gIHRvX2xpc3Q6IHRvX2xpc3QkMixcbiAgZGlzam9pbl9fcW1hcmtfXyxcbiAgZGVsZXRlOiBfX2RlbGV0ZV9fJDEsXG4gIHN1YnNldF9fcW1hcmtfXyxcbiAgZXF1YWxfX3FtYXJrX186IGVxdWFsX19xbWFya19fJDEsXG4gIG1lbWJlcl9fcW1hcmtfXyxcbiAgcHV0OiBwdXQkMSxcbiAgdW5pb24sXG4gIGludGVyc2VjdGlvbixcbiAgZGlmZmVyZW5jZVxufTtcblxubGV0IFZpcnR1YWxET00gPSAoZnVuY3Rpb24gKGUpIHtcbiAgICByZXR1cm4gZSgpO1xufSkoZnVuY3Rpb24gKCkge1xuICAgIHZhciBkZWZpbmUsIG1vZHVsZSwgZXhwb3J0cztcbiAgICByZXR1cm4gKGZ1bmN0aW9uIGUodCwgbiwgcikge1xuICAgICAgICBmdW5jdGlvbiBzKG8sIHUpIHtcbiAgICAgICAgICAgIGlmICghbltvXSkge1xuICAgICAgICAgICAgICAgIGlmICghdFtvXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHR5cGVvZiByZXF1aXJlID09IFwiZnVuY3Rpb25cIiAmJiByZXF1aXJlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXUgJiYgYSkgcmV0dXJuIGEobywgITApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSkgcmV0dXJuIGkobywgITApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZiA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBvICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyAoZi5jb2RlID0gXCJNT0RVTEVfTk9UX0ZPVU5EXCIsIGYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbCA9IG5bb10gPSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cG9ydHM6IHt9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0W29dWzBdLmNhbGwobC5leHBvcnRzLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbiA9IHRbb11bMV1bZV07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzKG4gPyBuIDogZSk7XG4gICAgICAgICAgICAgICAgfSwgbCwgbC5leHBvcnRzLCBlLCB0LCBuLCByKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuW29dLmV4cG9ydHM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGkgPSB0eXBlb2YgcmVxdWlyZSA9PSBcImZ1bmN0aW9uXCIgJiYgcmVxdWlyZTtcbiAgICAgICAgZm9yICh2YXIgbyA9IDA7IG8gPCByLmxlbmd0aDsgbysrKSBzKHJbb10pO1xuICAgICAgICByZXR1cm4gcztcbiAgICB9KSh7XG4gICAgICAgIDE6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG5cbiAgICAgICAgICAgIHZhciBjcmVhdGVFbGVtZW50ID0gcmVxdWlyZShcIi4vdmRvbS9jcmVhdGUtZWxlbWVudC5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVFbGVtZW50O1xuICAgICAgICB9LCB7IFwiLi92ZG9tL2NyZWF0ZS1lbGVtZW50LmpzXCI6IDE1IH1dLCAyOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGRpZmYgPSByZXF1aXJlKFwiLi92dHJlZS9kaWZmLmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRpZmY7XG4gICAgICAgIH0sIHsgXCIuL3Z0cmVlL2RpZmYuanNcIjogMzUgfV0sIDM6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaCA9IHJlcXVpcmUoXCIuL3ZpcnR1YWwtaHlwZXJzY3JpcHQvaW5kZXguanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaDtcbiAgICAgICAgfSwgeyBcIi4vdmlydHVhbC1oeXBlcnNjcmlwdC9pbmRleC5qc1wiOiAyMiB9XSwgNDogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBkaWZmID0gcmVxdWlyZShcIi4vZGlmZi5qc1wiKTtcbiAgICAgICAgICAgIHZhciBwYXRjaCA9IHJlcXVpcmUoXCIuL3BhdGNoLmpzXCIpO1xuICAgICAgICAgICAgdmFyIGggPSByZXF1aXJlKFwiLi9oLmpzXCIpO1xuICAgICAgICAgICAgdmFyIGNyZWF0ZSA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1lbGVtZW50LmpzXCIpO1xuICAgICAgICAgICAgdmFyIFZOb2RlID0gcmVxdWlyZShcIi4vdm5vZGUvdm5vZGUuanNcIik7XG4gICAgICAgICAgICB2YXIgVlRleHQgPSByZXF1aXJlKFwiLi92bm9kZS92dGV4dC5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICAgICAgZGlmZjogZGlmZixcbiAgICAgICAgICAgICAgICBwYXRjaDogcGF0Y2gsXG4gICAgICAgICAgICAgICAgaDogaCxcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGNyZWF0ZSxcbiAgICAgICAgICAgICAgICBWTm9kZTogVk5vZGUsXG4gICAgICAgICAgICAgICAgVlRleHQ6IFZUZXh0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LCB7IFwiLi9jcmVhdGUtZWxlbWVudC5qc1wiOiAxLCBcIi4vZGlmZi5qc1wiOiAyLCBcIi4vaC5qc1wiOiAzLCBcIi4vcGF0Y2guanNcIjogMTMsIFwiLi92bm9kZS92bm9kZS5qc1wiOiAzMSwgXCIuL3Zub2RlL3Z0ZXh0LmpzXCI6IDMzIH1dLCA1OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgLyohXG4gICAgICAgICAgICAgKiBDcm9zcy1Ccm93c2VyIFNwbGl0IDEuMS4xXG4gICAgICAgICAgICAgKiBDb3B5cmlnaHQgMjAwNy0yMDEyIFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPlxuICAgICAgICAgICAgICogQXZhaWxhYmxlIHVuZGVyIHRoZSBNSVQgTGljZW5zZVxuICAgICAgICAgICAgICogRUNNQVNjcmlwdCBjb21wbGlhbnQsIHVuaWZvcm0gY3Jvc3MtYnJvd3NlciBzcGxpdCBtZXRob2RcbiAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNwbGl0cyBhIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mIHN0cmluZ3MgdXNpbmcgYSByZWdleCBvciBzdHJpbmcgc2VwYXJhdG9yLiBNYXRjaGVzIG9mIHRoZVxuICAgICAgICAgICAgICogc2VwYXJhdG9yIGFyZSBub3QgaW5jbHVkZWQgaW4gdGhlIHJlc3VsdCBhcnJheS4gSG93ZXZlciwgaWYgYHNlcGFyYXRvcmAgaXMgYSByZWdleCB0aGF0IGNvbnRhaW5zXG4gICAgICAgICAgICAgKiBjYXB0dXJpbmcgZ3JvdXBzLCBiYWNrcmVmZXJlbmNlcyBhcmUgc3BsaWNlZCBpbnRvIHRoZSByZXN1bHQgZWFjaCB0aW1lIGBzZXBhcmF0b3JgIGlzIG1hdGNoZWQuXG4gICAgICAgICAgICAgKiBGaXhlcyBicm93c2VyIGJ1Z3MgY29tcGFyZWQgdG8gdGhlIG5hdGl2ZSBgU3RyaW5nLnByb3RvdHlwZS5zcGxpdGAgYW5kIGNhbiBiZSB1c2VkIHJlbGlhYmx5XG4gICAgICAgICAgICAgKiBjcm9zcy1icm93c2VyLlxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBTdHJpbmcgdG8gc3BsaXQuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1JlZ0V4cHxTdHJpbmd9IHNlcGFyYXRvciBSZWdleCBvciBzdHJpbmcgdG8gdXNlIGZvciBzZXBhcmF0aW5nIHRoZSBzdHJpbmcuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW2xpbWl0XSBNYXhpbXVtIG51bWJlciBvZiBpdGVtcyB0byBpbmNsdWRlIGluIHRoZSByZXN1bHQgYXJyYXkuXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9IEFycmF5IG9mIHN1YnN0cmluZ3MuXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIEJhc2ljIHVzZVxuICAgICAgICAgICAgICogc3BsaXQoJ2EgYiBjIGQnLCAnICcpO1xuICAgICAgICAgICAgICogLy8gLT4gWydhJywgJ2InLCAnYycsICdkJ11cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyBXaXRoIGxpbWl0XG4gICAgICAgICAgICAgKiBzcGxpdCgnYSBiIGMgZCcsICcgJywgMik7XG4gICAgICAgICAgICAgKiAvLyAtPiBbJ2EnLCAnYiddXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLy8gQmFja3JlZmVyZW5jZXMgaW4gcmVzdWx0IGFycmF5XG4gICAgICAgICAgICAgKiBzcGxpdCgnLi53b3JkMSB3b3JkMi4uJywgLyhbYS16XSspKFxcZCspL2kpO1xuICAgICAgICAgICAgICogLy8gLT4gWycuLicsICd3b3JkJywgJzEnLCAnICcsICd3b3JkJywgJzInLCAnLi4nXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBzcGxpdCh1bmRlZikge1xuXG4gICAgICAgICAgICAgICAgdmFyIG5hdGl2ZVNwbGl0ID0gU3RyaW5nLnByb3RvdHlwZS5zcGxpdCxcbiAgICAgICAgICAgICAgICAgICAgY29tcGxpYW50RXhlY05wY2cgPSAvKCk/Py8uZXhlYyhcIlwiKVsxXSA9PT0gdW5kZWYsXG5cbiAgICAgICAgICAgICAgICAvLyBOUENHOiBub25wYXJ0aWNpcGF0aW5nIGNhcHR1cmluZyBncm91cFxuICAgICAgICAgICAgICAgIHNlbGY7XG5cbiAgICAgICAgICAgICAgICBzZWxmID0gZnVuY3Rpb24gKHN0ciwgc2VwYXJhdG9yLCBsaW1pdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBgc2VwYXJhdG9yYCBpcyBub3QgYSByZWdleCwgdXNlIGBuYXRpdmVTcGxpdGBcbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzZXBhcmF0b3IpICE9PSBcIltvYmplY3QgUmVnRXhwXVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmF0aXZlU3BsaXQuY2FsbChzdHIsIHNlcGFyYXRvciwgbGltaXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBvdXRwdXQgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzID0gKHNlcGFyYXRvci5pZ25vcmVDYXNlID8gXCJpXCIgOiBcIlwiKSArIChzZXBhcmF0b3IubXVsdGlsaW5lID8gXCJtXCIgOiBcIlwiKSArIChzZXBhcmF0b3IuZXh0ZW5kZWQgPyBcInhcIiA6IFwiXCIpICsgKHNlcGFyYXRvci5zdGlja3kgPyBcInlcIiA6IFwiXCIpLFxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggMytcbiAgICAgICAgICAgICAgICAgICAgbGFzdExhc3RJbmRleCA9IDAsXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTWFrZSBgZ2xvYmFsYCBhbmQgYXZvaWQgYGxhc3RJbmRleGAgaXNzdWVzIGJ5IHdvcmtpbmcgd2l0aCBhIGNvcHlcbiAgICAgICAgICAgICAgICAgICAgc2VwYXJhdG9yID0gbmV3IFJlZ0V4cChzZXBhcmF0b3Iuc291cmNlLCBmbGFncyArIFwiZ1wiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRvcjIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RMZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHN0ciArPSBcIlwiOyAvLyBUeXBlLWNvbnZlcnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb21wbGlhbnRFeGVjTnBjZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9lc24ndCBuZWVkIGZsYWdzIGd5LCBidXQgdGhleSBkb24ndCBodXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0b3IyID0gbmV3IFJlZ0V4cChcIl5cIiArIHNlcGFyYXRvci5zb3VyY2UgKyBcIiQoPyFcXFxccylcIiwgZmxhZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8qIFZhbHVlcyBmb3IgYGxpbWl0YCwgcGVyIHRoZSBzcGVjOlxuICAgICAgICAgICAgICAgICAgICAgKiBJZiB1bmRlZmluZWQ6IDQyOTQ5NjcyOTUgLy8gTWF0aC5wb3coMiwgMzIpIC0gMVxuICAgICAgICAgICAgICAgICAgICAgKiBJZiAwLCBJbmZpbml0eSwgb3IgTmFOOiAwXG4gICAgICAgICAgICAgICAgICAgICAqIElmIHBvc2l0aXZlIG51bWJlcjogbGltaXQgPSBNYXRoLmZsb29yKGxpbWl0KTsgaWYgKGxpbWl0ID4gNDI5NDk2NzI5NSkgbGltaXQgLT0gNDI5NDk2NzI5NjtcbiAgICAgICAgICAgICAgICAgICAgICogSWYgbmVnYXRpdmUgbnVtYmVyOiA0Mjk0OTY3Mjk2IC0gTWF0aC5mbG9vcihNYXRoLmFicyhsaW1pdCkpXG4gICAgICAgICAgICAgICAgICAgICAqIElmIG90aGVyOiBUeXBlLWNvbnZlcnQsIHRoZW4gdXNlIHRoZSBhYm92ZSBydWxlc1xuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgbGltaXQgPSBsaW1pdCA9PT0gdW5kZWYgPyAtMSA+Pj4gMCA6IC8vIE1hdGgucG93KDIsIDMyKSAtIDFcbiAgICAgICAgICAgICAgICAgICAgbGltaXQgPj4+IDA7IC8vIFRvVWludDMyKGxpbWl0KVxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAobWF0Y2ggPSBzZXBhcmF0b3IuZXhlYyhzdHIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBgc2VwYXJhdG9yLmxhc3RJbmRleGAgaXMgbm90IHJlbGlhYmxlIGNyb3NzLWJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RJbmRleCA+IGxhc3RMYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChzdHIuc2xpY2UobGFzdExhc3RJbmRleCwgbWF0Y2guaW5kZXgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXggYnJvd3NlcnMgd2hvc2UgYGV4ZWNgIG1ldGhvZHMgZG9uJ3QgY29uc2lzdGVudGx5IHJldHVybiBgdW5kZWZpbmVkYCBmb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub25wYXJ0aWNpcGF0aW5nIGNhcHR1cmluZyBncm91cHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbXBsaWFudEV4ZWNOcGNnICYmIG1hdGNoLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hbMF0ucmVwbGFjZShzZXBhcmF0b3IyLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAyOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzW2ldID09PSB1bmRlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaFtpXSA9IHVuZGVmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaC5sZW5ndGggPiAxICYmIG1hdGNoLmluZGV4IDwgc3RyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShvdXRwdXQsIG1hdGNoLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdExlbmd0aCA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0TGFzdEluZGV4ID0gbGFzdEluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXQubGVuZ3RoID49IGxpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXBhcmF0b3IubGFzdEluZGV4ID09PSBtYXRjaC5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRvci5sYXN0SW5kZXgrKzsgLy8gQXZvaWQgYW4gaW5maW5pdGUgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0TGFzdEluZGV4ID09PSBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdExlbmd0aCB8fCAhc2VwYXJhdG9yLnRlc3QoXCJcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKHN0ci5zbGljZShsYXN0TGFzdEluZGV4KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dHB1dC5sZW5ndGggPiBsaW1pdCA/IG91dHB1dC5zbGljZSgwLCBsaW1pdCkgOiBvdXRwdXQ7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfSwge31dLCA2OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge30sIHt9XSwgNzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICB2YXIgT25lVmVyc2lvbkNvbnN0cmFpbnQgPSByZXF1aXJlKFwiaW5kaXZpZHVhbC9vbmUtdmVyc2lvblwiKTtcblxuICAgICAgICAgICAgdmFyIE1ZX1ZFUlNJT04gPSBcIjdcIjtcbiAgICAgICAgICAgIE9uZVZlcnNpb25Db25zdHJhaW50KFwiZXYtc3RvcmVcIiwgTVlfVkVSU0lPTik7XG5cbiAgICAgICAgICAgIHZhciBoYXNoS2V5ID0gXCJfX0VWX1NUT1JFX0tFWUBcIiArIE1ZX1ZFUlNJT047XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gRXZTdG9yZTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gRXZTdG9yZShlbGVtKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSBlbGVtW2hhc2hLZXldO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFoYXNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc2ggPSBlbGVtW2hhc2hLZXldID0ge307XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhc2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCJpbmRpdmlkdWFsL29uZS12ZXJzaW9uXCI6IDkgfV0sIDg6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gKGdsb2JhbCkge1xuICAgICAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICAgICAgLypnbG9iYWwgd2luZG93LCBnbG9iYWwqL1xuXG4gICAgICAgICAgICAgICAgdmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHt9O1xuXG4gICAgICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBJbmRpdmlkdWFsO1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gSW5kaXZpZHVhbChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgaW4gcm9vdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3Rba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJvb3Rba2V5XSA9IHZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5jYWxsKHRoaXMsIHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pO1xuICAgICAgICB9LCB7fV0sIDk6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgdmFyIEluZGl2aWR1YWwgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBPbmVWZXJzaW9uO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBPbmVWZXJzaW9uKG1vZHVsZU5hbWUsIHZlcnNpb24sIGRlZmF1bHRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBcIl9fSU5ESVZJRFVBTF9PTkVfVkVSU0lPTl9cIiArIG1vZHVsZU5hbWU7XG4gICAgICAgICAgICAgICAgdmFyIGVuZm9yY2VLZXkgPSBrZXkgKyBcIl9FTkZPUkNFX1NJTkdMRVRPTlwiO1xuXG4gICAgICAgICAgICAgICAgdmFyIHZlcnNpb25WYWx1ZSA9IEluZGl2aWR1YWwoZW5mb3JjZUtleSwgdmVyc2lvbik7XG5cbiAgICAgICAgICAgICAgICBpZiAodmVyc2lvblZhbHVlICE9PSB2ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbiBvbmx5IGhhdmUgb25lIGNvcHkgb2YgXCIgKyBtb2R1bGVOYW1lICsgXCIuXFxuXCIgKyBcIllvdSBhbHJlYWR5IGhhdmUgdmVyc2lvbiBcIiArIHZlcnNpb25WYWx1ZSArIFwiIGluc3RhbGxlZC5cXG5cIiArIFwiVGhpcyBtZWFucyB5b3UgY2Fubm90IGluc3RhbGwgdmVyc2lvbiBcIiArIHZlcnNpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBJbmRpdmlkdWFsKGtleSwgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4vaW5kZXguanNcIjogOCB9XSwgMTA6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gKGdsb2JhbCkge1xuICAgICAgICAgICAgICAgIHZhciB0b3BMZXZlbCA9IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge307XG4gICAgICAgICAgICAgICAgdmFyIG1pbkRvYyA9IHJlcXVpcmUoXCJtaW4tZG9jdW1lbnRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvY2N5ID0gdG9wTGV2ZWxbXCJfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0XCJdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghZG9jY3kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY2N5ID0gdG9wTGV2ZWxbXCJfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0XCJdID0gbWluRG9jO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkb2NjeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5jYWxsKHRoaXMsIHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pO1xuICAgICAgICB9LCB7IFwibWluLWRvY3VtZW50XCI6IDYgfV0sIDExOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNPYmplY3QoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiAmJiB4ICE9PSBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSwge31dLCAxMjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBuYXRpdmVJc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbiAgICAgICAgICAgIHZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gbmF0aXZlSXNBcnJheSB8fCBpc0FycmF5O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc0FycmF5KG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge31dLCAxMzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBwYXRjaCA9IHJlcXVpcmUoXCIuL3Zkb20vcGF0Y2guanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gcGF0Y2g7XG4gICAgICAgIH0sIHsgXCIuL3Zkb20vcGF0Y2guanNcIjogMTggfV0sIDE0OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gcmVxdWlyZShcImlzLW9iamVjdFwiKTtcbiAgICAgICAgICAgIHZhciBpc0hvb2sgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdmhvb2suanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXBwbHlQcm9wZXJ0aWVzO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhcHBseVByb3BlcnRpZXMobm9kZSwgcHJvcHMsIHByZXZpb3VzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVByb3BlcnR5KG5vZGUsIHByb3BOYW1lLCBwcm9wVmFsdWUsIHByZXZpb3VzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc0hvb2socHJvcFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUHJvcGVydHkobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSwgcHJldmlvdXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BWYWx1ZS5ob29rKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcFZhbHVlLmhvb2sobm9kZSwgcHJvcE5hbWUsIHByZXZpb3VzID8gcHJldmlvdXNbcHJvcE5hbWVdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc09iamVjdChwcm9wVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hPYmplY3Qobm9kZSwgcHJvcHMsIHByZXZpb3VzLCBwcm9wTmFtZSwgcHJvcFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBwcm9wVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZVByb3BlcnR5KG5vZGUsIHByb3BOYW1lLCBwcm9wVmFsdWUsIHByZXZpb3VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aW91c1ZhbHVlID0gcHJldmlvdXNbcHJvcE5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNIb29rKHByZXZpb3VzVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcE5hbWUgPT09IFwiYXR0cmlidXRlc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYXR0ck5hbWUgaW4gcHJldmlvdXNWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wTmFtZSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc3R5bGVbaV0gPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHByZXZpb3VzVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcmV2aW91c1ZhbHVlLnVuaG9vaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNWYWx1ZS51bmhvb2sobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHBhdGNoT2JqZWN0KG5vZGUsIHByb3BzLCBwcmV2aW91cywgcHJvcE5hbWUsIHByb3BWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBwcmV2aW91c1ZhbHVlID0gcHJldmlvdXMgPyBwcmV2aW91c1twcm9wTmFtZV0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAvLyBTZXQgYXR0cmlidXRlc1xuICAgICAgICAgICAgICAgIGlmIChwcm9wTmFtZSA9PT0gXCJhdHRyaWJ1dGVzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYXR0ck5hbWUgaW4gcHJvcFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXR0clZhbHVlID0gcHJvcFZhbHVlW2F0dHJOYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0clZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocHJldmlvdXNWYWx1ZSAmJiBpc09iamVjdChwcmV2aW91c1ZhbHVlKSAmJiBnZXRQcm90b3R5cGUocHJldmlvdXNWYWx1ZSkgIT09IGdldFByb3RvdHlwZShwcm9wVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gcHJvcFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFpc09iamVjdChub2RlW3Byb3BOYW1lXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVwbGFjZXIgPSBwcm9wTmFtZSA9PT0gXCJzdHlsZVwiID8gXCJcIiA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gcHJvcFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHByb3BWYWx1ZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV1ba10gPSB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gcmVwbGFjZXIgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldFByb3RvdHlwZSh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS5fX3Byb3RvX18pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLl9fcHJvdG9fXztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi4vdm5vZGUvaXMtdmhvb2suanNcIjogMjYsIFwiaXMtb2JqZWN0XCI6IDExIH1dLCAxNTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBkb2N1bWVudCA9IHJlcXVpcmUoXCJnbG9iYWwvZG9jdW1lbnRcIik7XG5cbiAgICAgICAgICAgIHZhciBhcHBseVByb3BlcnRpZXMgPSByZXF1aXJlKFwiLi9hcHBseS1wcm9wZXJ0aWVzXCIpO1xuXG4gICAgICAgICAgICB2YXIgaXNWTm9kZSA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12bm9kZS5qc1wiKTtcbiAgICAgICAgICAgIHZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZ0ZXh0LmpzXCIpO1xuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBoYW5kbGVUaHVuayA9IHJlcXVpcmUoXCIuLi92bm9kZS9oYW5kbGUtdGh1bmsuanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gY3JlYXRlRWxlbWVudDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh2bm9kZSwgb3B0cykge1xuICAgICAgICAgICAgICAgIHZhciBkb2MgPSBvcHRzID8gb3B0cy5kb2N1bWVudCB8fCBkb2N1bWVudCA6IGRvY3VtZW50O1xuICAgICAgICAgICAgICAgIHZhciB3YXJuID0gb3B0cyA/IG9wdHMud2FybiA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICB2bm9kZSA9IGhhbmRsZVRodW5rKHZub2RlKS5hO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzV2lkZ2V0KHZub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGUuaW5pdCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNWVGV4dCh2bm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvYy5jcmVhdGVUZXh0Tm9kZSh2bm9kZS50ZXh0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFpc1ZOb2RlKHZub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAod2Fybikge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FybihcIkl0ZW0gaXMgbm90IGEgdmFsaWQgdmlydHVhbCBkb20gbm9kZVwiLCB2bm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB2bm9kZS5uYW1lc3BhY2UgPT09IG51bGwgPyBkb2MuY3JlYXRlRWxlbWVudCh2bm9kZS50YWdOYW1lKSA6IGRvYy5jcmVhdGVFbGVtZW50TlModm5vZGUubmFtZXNwYWNlLCB2bm9kZS50YWdOYW1lKTtcblxuICAgICAgICAgICAgICAgIHZhciBwcm9wcyA9IHZub2RlLnByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgYXBwbHlQcm9wZXJ0aWVzKG5vZGUsIHByb3BzKTtcblxuICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGROb2RlID0gY3JlYXRlRWxlbWVudChjaGlsZHJlbltpXSwgb3B0cyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi4vdm5vZGUvaGFuZGxlLXRodW5rLmpzXCI6IDI0LCBcIi4uL3Zub2RlL2lzLXZub2RlLmpzXCI6IDI3LCBcIi4uL3Zub2RlL2lzLXZ0ZXh0LmpzXCI6IDI4LCBcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiOiAyOSwgXCIuL2FwcGx5LXByb3BlcnRpZXNcIjogMTQsIFwiZ2xvYmFsL2RvY3VtZW50XCI6IDEwIH1dLCAxNjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIC8vIE1hcHMgYSB2aXJ0dWFsIERPTSB0cmVlIG9udG8gYSByZWFsIERPTSB0cmVlIGluIGFuIGVmZmljaWVudCBtYW5uZXIuXG4gICAgICAgICAgICAvLyBXZSBkb24ndCB3YW50IHRvIHJlYWQgYWxsIG9mIHRoZSBET00gbm9kZXMgaW4gdGhlIHRyZWUgc28gd2UgdXNlXG4gICAgICAgICAgICAvLyB0aGUgaW4tb3JkZXIgdHJlZSBpbmRleGluZyB0byBlbGltaW5hdGUgcmVjdXJzaW9uIGRvd24gY2VydGFpbiBicmFuY2hlcy5cbiAgICAgICAgICAgIC8vIFdlIG9ubHkgcmVjdXJzZSBpbnRvIGEgRE9NIG5vZGUgaWYgd2Uga25vdyB0aGF0IGl0IGNvbnRhaW5zIGEgY2hpbGQgb2ZcbiAgICAgICAgICAgIC8vIGludGVyZXN0LlxuXG4gICAgICAgICAgICB2YXIgbm9DaGlsZCA9IHt9O1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRvbUluZGV4O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBkb21JbmRleChyb290Tm9kZSwgdHJlZSwgaW5kaWNlcywgbm9kZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWluZGljZXMgfHwgaW5kaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGljZXMuc29ydChhc2NlbmRpbmcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjdXJzZShyb290Tm9kZSwgdHJlZSwgaW5kaWNlcywgbm9kZXMsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVjdXJzZShyb290Tm9kZSwgdHJlZSwgaW5kaWNlcywgbm9kZXMsIHJvb3RJbmRleCkge1xuICAgICAgICAgICAgICAgIG5vZGVzID0gbm9kZXMgfHwge307XG5cbiAgICAgICAgICAgICAgICBpZiAocm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4SW5SYW5nZShpbmRpY2VzLCByb290SW5kZXgsIHJvb3RJbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVzW3Jvb3RJbmRleF0gPSByb290Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciB2Q2hpbGRyZW4gPSB0cmVlLmNoaWxkcmVuO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2Q2hpbGRyZW4pIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSByb290Tm9kZS5jaGlsZE5vZGVzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRyZWUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290SW5kZXggKz0gMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2Q2hpbGQgPSB2Q2hpbGRyZW5baV0gfHwgbm9DaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dEluZGV4ID0gcm9vdEluZGV4ICsgKHZDaGlsZC5jb3VudCB8fCAwKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgcmVjdXJzaW9uIGRvd24gdGhlIHRyZWUgaWYgdGhlcmUgYXJlIG5vIG5vZGVzIGRvd24gaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleEluUmFuZ2UoaW5kaWNlcywgcm9vdEluZGV4LCBuZXh0SW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2UoY2hpbGROb2Rlc1tpXSwgdkNoaWxkLCBpbmRpY2VzLCBub2Rlcywgcm9vdEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290SW5kZXggPSBuZXh0SW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEJpbmFyeSBzZWFyY2ggZm9yIGFuIGluZGV4IGluIHRoZSBpbnRlcnZhbCBbbGVmdCwgcmlnaHRdXG4gICAgICAgICAgICBmdW5jdGlvbiBpbmRleEluUmFuZ2UoaW5kaWNlcywgbGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBtaW5JbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIG1heEluZGV4ID0gaW5kaWNlcy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SW5kZXg7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKG1pbkluZGV4IDw9IG1heEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleCA9IChtYXhJbmRleCArIG1pbkluZGV4KSAvIDIgPj4gMDtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEl0ZW0gPSBpbmRpY2VzW2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pbkluZGV4ID09PSBtYXhJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRJdGVtID49IGxlZnQgJiYgY3VycmVudEl0ZW0gPD0gcmlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudEl0ZW0gPCBsZWZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5JbmRleCA9IGN1cnJlbnRJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudEl0ZW0gPiByaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4SW5kZXggPSBjdXJyZW50SW5kZXggLSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFzY2VuZGluZyhhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEgPiBiID8gMSA6IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7fV0sIDE3OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGFwcGx5UHJvcGVydGllcyA9IHJlcXVpcmUoXCIuL2FwcGx5LXByb3BlcnRpZXNcIik7XG5cbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIik7XG4gICAgICAgICAgICB2YXIgVlBhdGNoID0gcmVxdWlyZShcIi4uL3Zub2RlL3ZwYXRjaC5qc1wiKTtcblxuICAgICAgICAgICAgdmFyIHVwZGF0ZVdpZGdldCA9IHJlcXVpcmUoXCIuL3VwZGF0ZS13aWRnZXRcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXBwbHlQYXRjaDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gYXBwbHlQYXRjaCh2cGF0Y2gsIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IHZwYXRjaC50eXBlO1xuICAgICAgICAgICAgICAgIHZhciB2Tm9kZSA9IHZwYXRjaC52Tm9kZTtcbiAgICAgICAgICAgICAgICB2YXIgcGF0Y2ggPSB2cGF0Y2gucGF0Y2g7XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guUkVNT1ZFOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZU5vZGUoZG9tTm9kZSwgdk5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5JTlNFUlQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zZXJ0Tm9kZShkb21Ob2RlLCBwYXRjaCwgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLlZURVhUOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0cmluZ1BhdGNoKGRvbU5vZGUsIHZOb2RlLCBwYXRjaCwgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLldJREdFVDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3aWRnZXRQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5WTk9ERTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2Tm9kZVBhdGNoKGRvbU5vZGUsIHZOb2RlLCBwYXRjaCwgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLk9SREVSOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVvcmRlckNoaWxkcmVuKGRvbU5vZGUsIHBhdGNoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkb21Ob2RlO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5QUk9QUzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5UHJvcGVydGllcyhkb21Ob2RlLCBwYXRjaCwgdk5vZGUucHJvcGVydGllcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9tTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guVEhVTks6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVwbGFjZVJvb3QoZG9tTm9kZSwgcmVuZGVyT3B0aW9ucy5wYXRjaChkb21Ob2RlLCBwYXRjaCwgcmVuZGVyT3B0aW9ucykpO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZW1vdmVOb2RlKGRvbU5vZGUsIHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGU7XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKGRvbU5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRlc3Ryb3lXaWRnZXQoZG9tTm9kZSwgdk5vZGUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGluc2VydE5vZGUocGFyZW50Tm9kZSwgdk5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZOb2RlLCByZW5kZXJPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobmV3Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHN0cmluZ1BhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgdlRleHQsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZTtcblxuICAgICAgICAgICAgICAgIGlmIChkb21Ob2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbU5vZGUucmVwbGFjZURhdGEoMCwgZG9tTm9kZS5sZW5ndGgsIHZUZXh0LnRleHQpO1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gZG9tTm9kZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZUZXh0LCByZW5kZXJPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSAmJiBuZXdOb2RlICE9PSBkb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdOb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB3aWRnZXRQYXRjaChkb21Ob2RlLCBsZWZ0Vk5vZGUsIHdpZGdldCwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciB1cGRhdGluZyA9IHVwZGF0ZVdpZGdldChsZWZ0Vk5vZGUsIHdpZGdldCk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld05vZGU7XG5cbiAgICAgICAgICAgICAgICBpZiAodXBkYXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHdpZGdldC51cGRhdGUobGVmdFZOb2RlLCBkb21Ob2RlKSB8fCBkb21Ob2RlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld05vZGUgPSByZW5kZXJPcHRpb25zLnJlbmRlcih3aWRnZXQsIHJlbmRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gZG9tTm9kZS5wYXJlbnROb2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXVwZGF0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlc3Ryb3lXaWRnZXQoZG9tTm9kZSwgbGVmdFZOb2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3Tm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdk5vZGVQYXRjaChkb21Ob2RlLCBsZWZ0Vk5vZGUsIHZOb2RlLCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgdmFyIG5ld05vZGUgPSByZW5kZXJPcHRpb25zLnJlbmRlcih2Tm9kZSwgcmVuZGVyT3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSAmJiBuZXdOb2RlICE9PSBkb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIGRvbU5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdOb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBkZXN0cm95V2lkZ2V0KGRvbU5vZGUsIHcpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHcuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiICYmIGlzV2lkZ2V0KHcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHcuZGVzdHJveShkb21Ob2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlb3JkZXJDaGlsZHJlbihkb21Ob2RlLCBtb3Zlcykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZE5vZGVzID0gZG9tTm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICAgICAgICAgIHZhciBrZXlNYXAgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZTtcbiAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlO1xuICAgICAgICAgICAgICAgIHZhciBpbnNlcnQ7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vdmVzLnJlbW92ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlID0gbW92ZXMucmVtb3Zlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IGNoaWxkTm9kZXNbcmVtb3ZlLmZyb21dO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVtb3ZlLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5TWFwW3JlbW92ZS5rZXldID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkb21Ob2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBjaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1vdmVzLmluc2VydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0ID0gbW92ZXMuaW5zZXJ0c1tqXTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IGtleU1hcFtpbnNlcnQua2V5XTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgd2VpcmRlc3QgYnVnIGkndmUgZXZlciBzZWVuIGluIHdlYmtpdFxuICAgICAgICAgICAgICAgICAgICBkb21Ob2RlLmluc2VydEJlZm9yZShub2RlLCBpbnNlcnQudG8gPj0gbGVuZ3RoKysgPyBudWxsIDogY2hpbGROb2Rlc1tpbnNlcnQudG9dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VSb290KG9sZFJvb3QsIG5ld1Jvb3QpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkUm9vdCAmJiBuZXdSb290ICYmIG9sZFJvb3QgIT09IG5ld1Jvb3QgJiYgb2xkUm9vdC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZFJvb3QucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Um9vdCwgb2xkUm9vdCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld1Jvb3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIjogMjksIFwiLi4vdm5vZGUvdnBhdGNoLmpzXCI6IDMyLCBcIi4vYXBwbHktcHJvcGVydGllc1wiOiAxNCwgXCIuL3VwZGF0ZS13aWRnZXRcIjogMTkgfV0sIDE4OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGRvY3VtZW50ID0gcmVxdWlyZShcImdsb2JhbC9kb2N1bWVudFwiKTtcbiAgICAgICAgICAgIHZhciBpc0FycmF5ID0gcmVxdWlyZShcIngtaXMtYXJyYXlcIik7XG5cbiAgICAgICAgICAgIHZhciByZW5kZXIgPSByZXF1aXJlKFwiLi9jcmVhdGUtZWxlbWVudFwiKTtcbiAgICAgICAgICAgIHZhciBkb21JbmRleCA9IHJlcXVpcmUoXCIuL2RvbS1pbmRleFwiKTtcbiAgICAgICAgICAgIHZhciBwYXRjaE9wID0gcmVxdWlyZShcIi4vcGF0Y2gtb3BcIik7XG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHBhdGNoO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBwYXRjaChyb290Tm9kZSwgcGF0Y2hlcywgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHJlbmRlck9wdGlvbnMgPSByZW5kZXJPcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgICAgIHJlbmRlck9wdGlvbnMucGF0Y2ggPSByZW5kZXJPcHRpb25zLnBhdGNoICYmIHJlbmRlck9wdGlvbnMucGF0Y2ggIT09IHBhdGNoID8gcmVuZGVyT3B0aW9ucy5wYXRjaCA6IHBhdGNoUmVjdXJzaXZlO1xuICAgICAgICAgICAgICAgIHJlbmRlck9wdGlvbnMucmVuZGVyID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIgfHwgcmVuZGVyO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbmRlck9wdGlvbnMucGF0Y2gocm9vdE5vZGUsIHBhdGNoZXMsIHJlbmRlck9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBwYXRjaFJlY3Vyc2l2ZShyb290Tm9kZSwgcGF0Y2hlcywgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBpbmRpY2VzID0gcGF0Y2hJbmRpY2VzKHBhdGNoZXMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBkb21JbmRleChyb290Tm9kZSwgcGF0Y2hlcy5hLCBpbmRpY2VzKTtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXJEb2N1bWVudCA9IHJvb3ROb2RlLm93bmVyRG9jdW1lbnQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlbmRlck9wdGlvbnMuZG9jdW1lbnQgJiYgb3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyT3B0aW9ucy5kb2N1bWVudCA9IG93bmVyRG9jdW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlSW5kZXggPSBpbmRpY2VzW2ldO1xuICAgICAgICAgICAgICAgICAgICByb290Tm9kZSA9IGFwcGx5UGF0Y2gocm9vdE5vZGUsIGluZGV4W25vZGVJbmRleF0sIHBhdGNoZXNbbm9kZUluZGV4XSwgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvb3ROb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBhcHBseVBhdGNoKHJvb3ROb2RlLCBkb21Ob2RlLCBwYXRjaExpc3QsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWRvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3ROb2RlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBuZXdOb2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkocGF0Y2hMaXN0KSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGNoTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHBhdGNoT3AocGF0Y2hMaXN0W2ldLCBkb21Ob2RlLCByZW5kZXJPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvbU5vZGUgPT09IHJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdE5vZGUgPSBuZXdOb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHBhdGNoT3AocGF0Y2hMaXN0LCBkb21Ob2RlLCByZW5kZXJPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZG9tTm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3ROb2RlID0gbmV3Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcGF0Y2hJbmRpY2VzKHBhdGNoZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kaWNlcyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHBhdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gXCJhXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGljZXMucHVzaChOdW1iZXIoa2V5KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kaWNlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4vY3JlYXRlLWVsZW1lbnRcIjogMTUsIFwiLi9kb20taW5kZXhcIjogMTYsIFwiLi9wYXRjaC1vcFwiOiAxNywgXCJnbG9iYWwvZG9jdW1lbnRcIjogMTAsIFwieC1pcy1hcnJheVwiOiAxMiB9XSwgMTk6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHVwZGF0ZVdpZGdldDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlV2lkZ2V0KGEsIGIpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNXaWRnZXQoYSkgJiYgaXNXaWRnZXQoYikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwibmFtZVwiIGluIGEgJiYgXCJuYW1lXCIgaW4gYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuaWQgPT09IGIuaWQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5pbml0ID09PSBiLmluaXQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIjogMjkgfV0sIDIwOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgIHZhciBFdlN0b3JlID0gcmVxdWlyZShcImV2LXN0b3JlXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEV2SG9vaztcblxuICAgICAgICAgICAgZnVuY3Rpb24gRXZIb29rKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEV2SG9vaykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFdkhvb2sodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgRXZIb29rLnByb3RvdHlwZS5ob29rID0gZnVuY3Rpb24gKG5vZGUsIHByb3BlcnR5TmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBlcyA9IEV2U3RvcmUobm9kZSk7XG4gICAgICAgICAgICAgICAgdmFyIHByb3BOYW1lID0gcHJvcGVydHlOYW1lLnN1YnN0cigzKTtcblxuICAgICAgICAgICAgICAgIGVzW3Byb3BOYW1lXSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBFdkhvb2sucHJvdG90eXBlLnVuaG9vayA9IGZ1bmN0aW9uIChub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXMgPSBFdlN0b3JlKG5vZGUpO1xuICAgICAgICAgICAgICAgIHZhciBwcm9wTmFtZSA9IHByb3BlcnR5TmFtZS5zdWJzdHIoMyk7XG5cbiAgICAgICAgICAgICAgICBlc1twcm9wTmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LCB7IFwiZXYtc3RvcmVcIjogNyB9XSwgMjE6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBTb2Z0U2V0SG9vaztcblxuICAgICAgICAgICAgZnVuY3Rpb24gU29mdFNldEhvb2sodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU29mdFNldEhvb2spKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU29mdFNldEhvb2sodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgU29mdFNldEhvb2sucHJvdG90eXBlLmhvb2sgPSBmdW5jdGlvbiAobm9kZSwgcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGVbcHJvcGVydHlOYW1lXSAhPT0gdGhpcy52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BlcnR5TmFtZV0gPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sIHt9XSwgMjI6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgdmFyIGlzQXJyYXkgPSByZXF1aXJlKFwieC1pcy1hcnJheVwiKTtcblxuICAgICAgICAgICAgdmFyIFZOb2RlID0gcmVxdWlyZShcIi4uL3Zub2RlL3Zub2RlLmpzXCIpO1xuICAgICAgICAgICAgdmFyIFZUZXh0ID0gcmVxdWlyZShcIi4uL3Zub2RlL3Z0ZXh0LmpzXCIpO1xuICAgICAgICAgICAgdmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdm5vZGVcIik7XG4gICAgICAgICAgICB2YXIgaXNWVGV4dCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12dGV4dFwiKTtcbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXRcIik7XG4gICAgICAgICAgICB2YXIgaXNIb29rID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZob29rXCIpO1xuICAgICAgICAgICAgdmFyIGlzVlRodW5rID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXRodW5rXCIpO1xuXG4gICAgICAgICAgICB2YXIgcGFyc2VUYWcgPSByZXF1aXJlKFwiLi9wYXJzZS10YWcuanNcIik7XG4gICAgICAgICAgICB2YXIgc29mdFNldEhvb2sgPSByZXF1aXJlKFwiLi9ob29rcy9zb2Z0LXNldC1ob29rLmpzXCIpO1xuICAgICAgICAgICAgdmFyIGV2SG9vayA9IHJlcXVpcmUoXCIuL2hvb2tzL2V2LWhvb2suanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaCh0YWdOYW1lLCBwcm9wZXJ0aWVzLCBjaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZE5vZGVzID0gW107XG4gICAgICAgICAgICAgICAgdmFyIHRhZywgcHJvcHMsIGtleSwgbmFtZXNwYWNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFjaGlsZHJlbiAmJiBpc0NoaWxkcmVuKHByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gcHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMgPSB7fTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHByb3BlcnRpZXMgfHwge307XG4gICAgICAgICAgICAgICAgdGFnID0gcGFyc2VUYWcodGFnTmFtZSwgcHJvcHMpO1xuXG4gICAgICAgICAgICAgICAgLy8gc3VwcG9ydCBrZXlzXG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KFwia2V5XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IHByb3BzLmtleTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMua2V5ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHN1cHBvcnQgbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KFwibmFtZXNwYWNlXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZSA9IHByb3BzLm5hbWVzcGFjZTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMubmFtZXNwYWNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGZpeCBjdXJzb3IgYnVnXG4gICAgICAgICAgICAgICAgaWYgKHRhZyA9PT0gXCJJTlBVVFwiICYmICFuYW1lc3BhY2UgJiYgcHJvcHMuaGFzT3duUHJvcGVydHkoXCJ2YWx1ZVwiKSAmJiBwcm9wcy52YWx1ZSAhPT0gdW5kZWZpbmVkICYmICFpc0hvb2socHJvcHMudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzLnZhbHVlID0gc29mdFNldEhvb2socHJvcHMudmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybVByb3BlcnRpZXMocHJvcHMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkcmVuICE9PSB1bmRlZmluZWQgJiYgY2hpbGRyZW4gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQ2hpbGQoY2hpbGRyZW4sIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVk5vZGUodGFnLCBwcm9wcywgY2hpbGROb2Rlcywga2V5LCBuYW1lc3BhY2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRDaGlsZChjLCBjaGlsZE5vZGVzLCB0YWcsIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTm9kZXMucHVzaChuZXcgVlRleHQoYykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGMgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGROb2Rlcy5wdXNoKG5ldyBWVGV4dChTdHJpbmcoYykpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzQ2hpbGQoYykpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGROb2Rlcy5wdXNoKGMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShjKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZENoaWxkKGNbaV0sIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjID09PSBudWxsIHx8IGMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgVW5leHBlY3RlZFZpcnR1YWxFbGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmVpZ25PYmplY3Q6IGMsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRWbm9kZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRyYW5zZm9ybVByb3BlcnRpZXMocHJvcHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0hvb2sodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wTmFtZS5zdWJzdHIoMCwgMykgPT09IFwiZXYtXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGQgZXYtZm9vIHN1cHBvcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wc1twcm9wTmFtZV0gPSBldkhvb2sodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc0NoaWxkKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNWTm9kZSh4KSB8fCBpc1ZUZXh0KHgpIHx8IGlzV2lkZ2V0KHgpIHx8IGlzVlRodW5rKHgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc0NoaWxkcmVuKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09IFwic3RyaW5nXCIgfHwgaXNBcnJheSh4KSB8fCBpc0NoaWxkKHgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBVbmV4cGVjdGVkVmlydHVhbEVsZW1lbnQoZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcblxuICAgICAgICAgICAgICAgIGVyci50eXBlID0gXCJ2aXJ0dWFsLWh5cGVyc2NyaXB0LnVuZXhwZWN0ZWQudmlydHVhbC1lbGVtZW50XCI7XG4gICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UgPSBcIlVuZXhwZWN0ZWQgdmlydHVhbCBjaGlsZCBwYXNzZWQgdG8gaCgpLlxcblwiICsgXCJFeHBlY3RlZCBhIFZOb2RlIC8gVnRodW5rIC8gVldpZGdldCAvIHN0cmluZyBidXQ6XFxuXCIgKyBcImdvdDpcXG5cIiArIGVycm9yU3RyaW5nKGRhdGEuZm9yZWlnbk9iamVjdCkgKyBcIi5cXG5cIiArIFwiVGhlIHBhcmVudCB2bm9kZSBpczpcXG5cIiArIGVycm9yU3RyaW5nKGRhdGEucGFyZW50Vm5vZGUpO1xuICAgICAgICAgICAgICAgIFwiXFxuXCIgKyBcIlN1Z2dlc3RlZCBmaXg6IGNoYW5nZSB5b3VyIGBoKC4uLiwgWyAuLi4gXSlgIGNhbGxzaXRlLlwiO1xuICAgICAgICAgICAgICAgIGVyci5mb3JlaWduT2JqZWN0ID0gZGF0YS5mb3JlaWduT2JqZWN0O1xuICAgICAgICAgICAgICAgIGVyci5wYXJlbnRWbm9kZSA9IGRhdGEucGFyZW50Vm5vZGU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBlcnJvclN0cmluZyhvYmopIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCBcIiAgICBcIik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKG9iaik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi4vdm5vZGUvaXMtdGh1bmtcIjogMjUsIFwiLi4vdm5vZGUvaXMtdmhvb2tcIjogMjYsIFwiLi4vdm5vZGUvaXMtdm5vZGVcIjogMjcsIFwiLi4vdm5vZGUvaXMtdnRleHRcIjogMjgsIFwiLi4vdm5vZGUvaXMtd2lkZ2V0XCI6IDI5LCBcIi4uL3Zub2RlL3Zub2RlLmpzXCI6IDMxLCBcIi4uL3Zub2RlL3Z0ZXh0LmpzXCI6IDMzLCBcIi4vaG9va3MvZXYtaG9vay5qc1wiOiAyMCwgXCIuL2hvb2tzL3NvZnQtc2V0LWhvb2suanNcIjogMjEsIFwiLi9wYXJzZS10YWcuanNcIjogMjMsIFwieC1pcy1hcnJheVwiOiAxMiB9XSwgMjM6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgdmFyIHNwbGl0ID0gcmVxdWlyZShcImJyb3dzZXItc3BsaXRcIik7XG5cbiAgICAgICAgICAgIHZhciBjbGFzc0lkU3BsaXQgPSAvKFtcXC4jXT9bYS16QS1aMC05XFx1MDA3Ri1cXHVGRkZGXzotXSspLztcbiAgICAgICAgICAgIHZhciBub3RDbGFzc0lkID0gL15cXC58Iy87XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gcGFyc2VUYWc7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHBhcnNlVGFnKHRhZywgcHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRhZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJESVZcIjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbm9JZCA9ICFwcm9wcy5oYXNPd25Qcm9wZXJ0eShcImlkXCIpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHRhZ1BhcnRzID0gc3BsaXQodGFnLCBjbGFzc0lkU3BsaXQpO1xuICAgICAgICAgICAgICAgIHZhciB0YWdOYW1lID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmIChub3RDbGFzc0lkLnRlc3QodGFnUGFydHNbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZ05hbWUgPSBcIkRJVlwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBjbGFzc2VzLCBwYXJ0LCB0eXBlLCBpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ1BhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnQgPSB0YWdQYXJ0c1tpXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHBhcnQuY2hhckF0KDApO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGFnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSA9IHBhcnQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCIuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKHBhcnQuc3Vic3RyaW5nKDEsIHBhcnQubGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCIjXCIgJiYgbm9JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuaWQgPSBwYXJ0LnN1YnN0cmluZygxLCBwYXJ0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY2xhc3Nlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcHMuY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2gocHJvcHMuY2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHByb3BzLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbihcIiBcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BzLm5hbWVzcGFjZSA/IHRhZ05hbWUgOiB0YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCJicm93c2VyLXNwbGl0XCI6IDUgfV0sIDI0OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi9pcy12bm9kZVwiKTtcbiAgICAgICAgICAgIHZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4vaXMtdnRleHRcIik7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi9pcy13aWRnZXRcIik7XG4gICAgICAgICAgICB2YXIgaXNUaHVuayA9IHJlcXVpcmUoXCIuL2lzLXRodW5rXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGhhbmRsZVRodW5rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVUaHVuayhhLCBiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlbmRlcmVkQSA9IGE7XG4gICAgICAgICAgICAgICAgdmFyIHJlbmRlcmVkQiA9IGI7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNUaHVuayhiKSkge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJlZEIgPSByZW5kZXJUaHVuayhiLCBhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNUaHVuayhhKSkge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJlZEEgPSByZW5kZXJUaHVuayhhLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBhOiByZW5kZXJlZEEsXG4gICAgICAgICAgICAgICAgICAgIGI6IHJlbmRlcmVkQlxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlbmRlclRodW5rKHRodW5rLCBwcmV2aW91cykge1xuICAgICAgICAgICAgICAgIHZhciByZW5kZXJlZFRodW5rID0gdGh1bmsudm5vZGU7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVkVGh1bmspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWRUaHVuayA9IHRodW5rLnZub2RlID0gdGh1bmsucmVuZGVyKHByZXZpb3VzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIShpc1ZOb2RlKHJlbmRlcmVkVGh1bmspIHx8IGlzVlRleHQocmVuZGVyZWRUaHVuaykgfHwgaXNXaWRnZXQocmVuZGVyZWRUaHVuaykpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRodW5rIGRpZCBub3QgcmV0dXJuIGEgdmFsaWQgbm9kZVwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVuZGVyZWRUaHVuaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4vaXMtdGh1bmtcIjogMjUsIFwiLi9pcy12bm9kZVwiOiAyNywgXCIuL2lzLXZ0ZXh0XCI6IDI4LCBcIi4vaXMtd2lkZ2V0XCI6IDI5IH1dLCAyNTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaXNUaHVuaztcblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNUaHVuayh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQgJiYgdC50eXBlID09PSBcIlRodW5rXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHt9XSwgMjY6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGlzSG9vaztcblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNIb29rKGhvb2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaG9vayAmJiAodHlwZW9mIGhvb2suaG9vayA9PT0gXCJmdW5jdGlvblwiICYmICFob29rLmhhc093blByb3BlcnR5KFwiaG9va1wiKSB8fCB0eXBlb2YgaG9vay51bmhvb2sgPT09IFwiZnVuY3Rpb25cIiAmJiAhaG9vay5oYXNPd25Qcm9wZXJ0eShcInVuaG9va1wiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHt9XSwgMjc6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaXNWaXJ0dWFsTm9kZTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNWaXJ0dWFsTm9kZSh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHggJiYgeC50eXBlID09PSBcIlZpcnR1YWxOb2RlXCIgJiYgeC52ZXJzaW9uID09PSB2ZXJzaW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi92ZXJzaW9uXCI6IDMwIH1dLCAyODogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBpc1ZpcnR1YWxUZXh0O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc1ZpcnR1YWxUZXh0KHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geCAmJiB4LnR5cGUgPT09IFwiVmlydHVhbFRleHRcIiAmJiB4LnZlcnNpb24gPT09IHZlcnNpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuL3ZlcnNpb25cIjogMzAgfV0sIDI5OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBpc1dpZGdldDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNXaWRnZXQodykge1xuICAgICAgICAgICAgICAgIHJldHVybiB3ICYmIHcudHlwZSA9PT0gXCJXaWRnZXRcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge31dLCAzMDogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gXCIyXCI7XG4gICAgICAgIH0sIHt9XSwgMzE6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIik7XG4gICAgICAgICAgICB2YXIgaXNWTm9kZSA9IHJlcXVpcmUoXCIuL2lzLXZub2RlXCIpO1xuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4vaXMtd2lkZ2V0XCIpO1xuICAgICAgICAgICAgdmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi9pcy10aHVua1wiKTtcbiAgICAgICAgICAgIHZhciBpc1ZIb29rID0gcmVxdWlyZShcIi4vaXMtdmhvb2tcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gVmlydHVhbE5vZGU7XG5cbiAgICAgICAgICAgIHZhciBub1Byb3BlcnRpZXMgPSB7fTtcbiAgICAgICAgICAgIHZhciBub0NoaWxkcmVuID0gW107XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFZpcnR1YWxOb2RlKHRhZ05hbWUsIHByb3BlcnRpZXMsIGNoaWxkcmVuLCBrZXksIG5hbWVzcGFjZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFnTmFtZSA9IHRhZ05hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gcHJvcGVydGllcyB8fCBub1Byb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuIHx8IG5vQ2hpbGRyZW47XG4gICAgICAgICAgICAgICAgdGhpcy5rZXkgPSBrZXkgIT0gbnVsbCA/IFN0cmluZyhrZXkpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZXNwYWNlID0gdHlwZW9mIG5hbWVzcGFjZSA9PT0gXCJzdHJpbmdcIiA/IG5hbWVzcGFjZSA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICB2YXIgY291bnQgPSBjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGggfHwgMDtcbiAgICAgICAgICAgICAgICB2YXIgZGVzY2VuZGFudHMgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBoYXNXaWRnZXRzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGhhc1RodW5rcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBkZXNjZW5kYW50SG9va3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgaG9va3M7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gcHJvcGVydGllc1twcm9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNWSG9vayhwcm9wZXJ0eSkgJiYgcHJvcGVydHkudW5ob29rKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFob29rcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tzW3Byb3BOYW1lXSA9IHByb3BlcnR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NlbmRhbnRzICs9IGNoaWxkLmNvdW50IHx8IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFzV2lkZ2V0cyAmJiBjaGlsZC5oYXNXaWRnZXRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzV2lkZ2V0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFzVGh1bmtzICYmIGNoaWxkLmhhc1RodW5rcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1RodW5rcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZGVzY2VuZGFudEhvb2tzICYmIChjaGlsZC5ob29rcyB8fCBjaGlsZC5kZXNjZW5kYW50SG9va3MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY2VuZGFudEhvb2tzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaGFzV2lkZ2V0cyAmJiBpc1dpZGdldChjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2hpbGQuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzV2lkZ2V0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWhhc1RodW5rcyAmJiBpc1RodW5rKGNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFzVGh1bmtzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgPSBjb3VudCArIGRlc2NlbmRhbnRzO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzV2lkZ2V0cyA9IGhhc1dpZGdldHM7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNUaHVua3MgPSBoYXNUaHVua3M7XG4gICAgICAgICAgICAgICAgdGhpcy5ob29rcyA9IGhvb2tzO1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzY2VuZGFudEhvb2tzID0gZGVzY2VuZGFudEhvb2tzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBWaXJ0dWFsTm9kZS5wcm90b3R5cGUudmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgICBWaXJ0dWFsTm9kZS5wcm90b3R5cGUudHlwZSA9IFwiVmlydHVhbE5vZGVcIjtcbiAgICAgICAgfSwgeyBcIi4vaXMtdGh1bmtcIjogMjUsIFwiLi9pcy12aG9va1wiOiAyNiwgXCIuL2lzLXZub2RlXCI6IDI3LCBcIi4vaXMtd2lkZ2V0XCI6IDI5LCBcIi4vdmVyc2lvblwiOiAzMCB9XSwgMzI6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIik7XG5cbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5OT05FID0gMDtcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5WVEVYVCA9IDE7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guVk5PREUgPSAyO1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLldJREdFVCA9IDM7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guUFJPUFMgPSA0O1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLk9SREVSID0gNTtcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5JTlNFUlQgPSA2O1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLlJFTU9WRSA9IDc7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guVEhVTksgPSA4O1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxQYXRjaDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gVmlydHVhbFBhdGNoKHR5cGUsIHZOb2RlLCBwYXRjaCkge1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IE51bWJlcih0eXBlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZOb2RlID0gdk5vZGU7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXRjaCA9IHBhdGNoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2gucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLnByb3RvdHlwZS50eXBlID0gXCJWaXJ0dWFsUGF0Y2hcIjtcbiAgICAgICAgfSwgeyBcIi4vdmVyc2lvblwiOiAzMCB9XSwgMzM6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gVmlydHVhbFRleHQ7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFZpcnR1YWxUZXh0KHRleHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHQgPSBTdHJpbmcodGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFZpcnR1YWxUZXh0LnByb3RvdHlwZS52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgIFZpcnR1YWxUZXh0LnByb3RvdHlwZS50eXBlID0gXCJWaXJ0dWFsVGV4dFwiO1xuICAgICAgICB9LCB7IFwiLi92ZXJzaW9uXCI6IDMwIH1dLCAzNDogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBpc09iamVjdCA9IHJlcXVpcmUoXCJpcy1vYmplY3RcIik7XG4gICAgICAgICAgICB2YXIgaXNIb29rID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZob29rXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRpZmZQcm9wcztcblxuICAgICAgICAgICAgZnVuY3Rpb24gZGlmZlByb3BzKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlmZjtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGFLZXkgaW4gYSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIShhS2V5IGluIGIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgYVZhbHVlID0gYVthS2V5XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJWYWx1ZSA9IGJbYUtleV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFWYWx1ZSA9PT0gYlZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc09iamVjdChhVmFsdWUpICYmIGlzT2JqZWN0KGJWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXRQcm90b3R5cGUoYlZhbHVlKSAhPT0gZ2V0UHJvdG90eXBlKGFWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gYlZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc0hvb2soYlZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBiVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvYmplY3REaWZmID0gZGlmZlByb3BzKGFWYWx1ZSwgYlZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0RGlmZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IG9iamVjdERpZmY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gYlZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYktleSBpbiBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKGJLZXkgaW4gYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZltiS2V5XSA9IGJbYktleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGlmZjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0UHJvdG90eXBlKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLl9fcHJvdG9fXykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuX19wcm90b19fO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9pcy12aG9va1wiOiAyNiwgXCJpcy1vYmplY3RcIjogMTEgfV0sIDM1OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGlzQXJyYXkgPSByZXF1aXJlKFwieC1pcy1hcnJheVwiKTtcblxuICAgICAgICAgICAgdmFyIFZQYXRjaCA9IHJlcXVpcmUoXCIuLi92bm9kZS92cGF0Y2hcIik7XG4gICAgICAgICAgICB2YXIgaXNWTm9kZSA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12bm9kZVwiKTtcbiAgICAgICAgICAgIHZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZ0ZXh0XCIpO1xuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldFwiKTtcbiAgICAgICAgICAgIHZhciBpc1RodW5rID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXRodW5rXCIpO1xuICAgICAgICAgICAgdmFyIGhhbmRsZVRodW5rID0gcmVxdWlyZShcIi4uL3Zub2RlL2hhbmRsZS10aHVua1wiKTtcblxuICAgICAgICAgICAgdmFyIGRpZmZQcm9wcyA9IHJlcXVpcmUoXCIuL2RpZmYtcHJvcHNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGlmZjtcblxuICAgICAgICAgICAgZnVuY3Rpb24gZGlmZihhLCBiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGNoID0geyBhOiBhIH07XG4gICAgICAgICAgICAgICAgd2FsayhhLCBiLCBwYXRjaCwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGNoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB3YWxrKGEsIGIsIHBhdGNoLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgYXBwbHkgPSBwYXRjaFtpbmRleF07XG4gICAgICAgICAgICAgICAgdmFyIGFwcGx5Q2xlYXIgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGlmIChpc1RodW5rKGEpIHx8IGlzVGh1bmsoYikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGh1bmtzKGEsIGIsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChiID09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBhIGlzIGEgd2lkZ2V0IHdlIHdpbGwgYWRkIGEgcmVtb3ZlIHBhdGNoIGZvciBpdFxuICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UgYW55IGNoaWxkIHdpZGdldHMvaG9va3MgbXVzdCBiZSBkZXN0cm95ZWQuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgcHJldmVudHMgYWRkaW5nIHR3byByZW1vdmUgcGF0Y2hlcyBmb3IgYSB3aWRnZXQuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNXaWRnZXQoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyU3RhdGUoYSwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gcGF0Y2hbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guUkVNT1ZFLCBhLCBiKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1ZOb2RlKGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZOb2RlKGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYS50YWdOYW1lID09PSBiLnRhZ05hbWUgJiYgYS5uYW1lc3BhY2UgPT09IGIubmFtZXNwYWNlICYmIGEua2V5ID09PSBiLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wc1BhdGNoID0gZGlmZlByb3BzKGEucHJvcGVydGllcywgYi5wcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcHNQYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5QUk9QUywgYSwgcHJvcHNQYXRjaCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGRpZmZDaGlsZHJlbihhLCBiLCBwYXRjaCwgYXBwbHksIGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guVk5PREUsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseUNsZWFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZOT0RFLCBhLCBiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseUNsZWFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNWVGV4dChiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzVlRleHQoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZURVhULCBhLCBiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseUNsZWFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhLnRleHQgIT09IGIudGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guVlRFWFQsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNXaWRnZXQoYikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1dpZGdldChhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5XSURHRVQsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYXBwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0Y2hbaW5kZXhdID0gYXBwbHk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFwcGx5Q2xlYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJTdGF0ZShhLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZGlmZkNoaWxkcmVuKGEsIGIsIHBhdGNoLCBhcHBseSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYUNoaWxkcmVuID0gYS5jaGlsZHJlbjtcbiAgICAgICAgICAgICAgICB2YXIgb3JkZXJlZFNldCA9IHJlb3JkZXIoYUNoaWxkcmVuLCBiLmNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB2YXIgYkNoaWxkcmVuID0gb3JkZXJlZFNldC5jaGlsZHJlbjtcblxuICAgICAgICAgICAgICAgIHZhciBhTGVuID0gYUNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgYkxlbiA9IGJDaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IGFMZW4gPiBiTGVuID8gYUxlbiA6IGJMZW47XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsZWZ0Tm9kZSA9IGFDaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJpZ2h0Tm9kZSA9IGJDaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWxlZnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmlnaHROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhjZXNzIG5vZGVzIGluIGIgbmVlZCB0byBiZSBhZGRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLklOU0VSVCwgbnVsbCwgcmlnaHROb2RlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YWxrKGxlZnROb2RlLCByaWdodE5vZGUsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShsZWZ0Tm9kZSkgJiYgbGVmdE5vZGUuY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IGxlZnROb2RlLmNvdW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9yZGVyZWRTZXQubW92ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVvcmRlciBub2RlcyBsYXN0XG4gICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLk9SREVSLCBhLCBvcmRlcmVkU2V0Lm1vdmVzKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwcGx5O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBjbGVhclN0YXRlKHZOb2RlLCBwYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBNYWtlIHRoaXMgYSBzaW5nbGUgd2Fsaywgbm90IHR3b1xuICAgICAgICAgICAgICAgIHVuaG9vayh2Tm9kZSwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICBkZXN0cm95V2lkZ2V0cyh2Tm9kZSwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUGF0Y2ggcmVjb3JkcyBmb3IgYWxsIGRlc3Ryb3llZCB3aWRnZXRzIG11c3QgYmUgYWRkZWQgYmVjYXVzZSB3ZSBuZWVkXG4gICAgICAgICAgICAvLyBhIERPTSBub2RlIHJlZmVyZW5jZSBmb3IgdGhlIGRlc3Ryb3kgZnVuY3Rpb25cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXRzKHZOb2RlLCBwYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNXaWRnZXQodk5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygdk5vZGUuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaFtpbmRleF0gPSBhcHBlbmRQYXRjaChwYXRjaFtpbmRleF0sIG5ldyBWUGF0Y2goVlBhdGNoLlJFTU9WRSwgdk5vZGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNWTm9kZSh2Tm9kZSkgJiYgKHZOb2RlLmhhc1dpZGdldHMgfHwgdk5vZGUuaGFzVGh1bmtzKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB2Tm9kZS5jaGlsZHJlbjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlbiA9IGNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0cm95V2lkZ2V0cyhjaGlsZCwgcGF0Y2gsIGluZGV4KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUoY2hpbGQpICYmIGNoaWxkLmNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gY2hpbGQuY291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVGh1bmsodk5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRodW5rcyh2Tm9kZSwgbnVsbCwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIHN1Yi1wYXRjaCBmb3IgdGh1bmtzXG4gICAgICAgICAgICBmdW5jdGlvbiB0aHVua3MoYSwgYiwgcGF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVzID0gaGFuZGxlVGh1bmsoYSwgYik7XG4gICAgICAgICAgICAgICAgdmFyIHRodW5rUGF0Y2ggPSBkaWZmKG5vZGVzLmEsIG5vZGVzLmIpO1xuICAgICAgICAgICAgICAgIGlmIChoYXNQYXRjaGVzKHRodW5rUGF0Y2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGNoW2luZGV4XSA9IG5ldyBWUGF0Y2goVlBhdGNoLlRIVU5LLCBudWxsLCB0aHVua1BhdGNoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhc1BhdGNoZXMocGF0Y2gpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpbmRleCBpbiBwYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IFwiYVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRXhlY3V0ZSBob29rcyB3aGVuIHR3byBub2RlcyBhcmUgaWRlbnRpY2FsXG4gICAgICAgICAgICBmdW5jdGlvbiB1bmhvb2sodk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChpc1ZOb2RlKHZOb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodk5vZGUuaG9va3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoW2luZGV4XSA9IGFwcGVuZFBhdGNoKHBhdGNoW2luZGV4XSwgbmV3IFZQYXRjaChWUGF0Y2guUFJPUFMsIHZOb2RlLCB1bmRlZmluZWRLZXlzKHZOb2RlLmhvb2tzKSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZOb2RlLmRlc2NlbmRhbnRIb29rcyB8fCB2Tm9kZS5oYXNUaHVua3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHZOb2RlLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxlbiA9IGNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5ob29rKGNoaWxkLCBwYXRjaCwgaW5kZXgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUoY2hpbGQpICYmIGNoaWxkLmNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IGNoaWxkLmNvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNUaHVuayh2Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGh1bmtzKHZOb2RlLCBudWxsLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdW5kZWZpbmVkS2V5cyhvYmopIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIExpc3QgZGlmZiwgbmFpdmUgbGVmdCB0byByaWdodCByZW9yZGVyaW5nXG4gICAgICAgICAgICBmdW5jdGlvbiByZW9yZGVyKGFDaGlsZHJlbiwgYkNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgLy8gTyhNKSB0aW1lLCBPKE0pIG1lbW9yeVxuICAgICAgICAgICAgICAgIHZhciBiQ2hpbGRJbmRleCA9IGtleUluZGV4KGJDaGlsZHJlbik7XG4gICAgICAgICAgICAgICAgdmFyIGJLZXlzID0gYkNoaWxkSW5kZXgua2V5cztcbiAgICAgICAgICAgICAgICB2YXIgYkZyZWUgPSBiQ2hpbGRJbmRleC5mcmVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGJGcmVlLmxlbmd0aCA9PT0gYkNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IGJDaGlsZHJlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVzOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTyhOKSB0aW1lLCBPKE4pIG1lbW9yeVxuICAgICAgICAgICAgICAgIHZhciBhQ2hpbGRJbmRleCA9IGtleUluZGV4KGFDaGlsZHJlbik7XG4gICAgICAgICAgICAgICAgdmFyIGFLZXlzID0gYUNoaWxkSW5kZXgua2V5cztcbiAgICAgICAgICAgICAgICB2YXIgYUZyZWUgPSBhQ2hpbGRJbmRleC5mcmVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFGcmVlLmxlbmd0aCA9PT0gYUNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IGJDaGlsZHJlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVzOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTyhNQVgoTiwgTSkpIG1lbW9yeVxuICAgICAgICAgICAgICAgIHZhciBuZXdDaGlsZHJlbiA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIGZyZWVJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGZyZWVDb3VudCA9IGJGcmVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgZGVsZXRlZEl0ZW1zID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhIGFuZCBtYXRjaCBhIG5vZGUgaW4gYlxuICAgICAgICAgICAgICAgIC8vIE8oTikgdGltZSxcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFDaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYUl0ZW0gPSBhQ2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtSW5kZXg7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJLZXlzLmhhc093blByb3BlcnR5KGFJdGVtLmtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXRjaCB1cCB0aGUgb2xkIGtleXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBiS2V5c1thSXRlbS5rZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2goYkNoaWxkcmVuW2l0ZW1JbmRleF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgb2xkIGtleWVkIGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbUluZGV4ID0gaSAtIGRlbGV0ZWRJdGVtcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXRjaCB0aGUgaXRlbSBpbiBhIHdpdGggdGhlIG5leHQgZnJlZSBpdGVtIGluIGJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcmVlSW5kZXggPCBmcmVlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBiRnJlZVtmcmVlSW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChiQ2hpbGRyZW5baXRlbUluZGV4XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGFyZSBubyBmcmVlIGl0ZW1zIGluIGIgdG8gbWF0Y2ggd2l0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBmcmVlIGl0ZW1zIGluIGEsIHNvIHRoZSBleHRyYSBmcmVlIG5vZGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXJlIGRlbGV0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbUluZGV4ID0gaSAtIGRlbGV0ZWRJdGVtcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbGFzdEZyZWVJbmRleCA9IGZyZWVJbmRleCA+PSBiRnJlZS5sZW5ndGggPyBiQ2hpbGRyZW4ubGVuZ3RoIDogYkZyZWVbZnJlZUluZGV4XTtcblxuICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBiIGFuZCBhcHBlbmQgYW55IG5ldyBrZXlzXG4gICAgICAgICAgICAgICAgLy8gTyhNKSB0aW1lXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBiQ2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0l0ZW0gPSBiQ2hpbGRyZW5bal07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld0l0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFLZXlzLmhhc093blByb3BlcnR5KG5ld0l0ZW0ua2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBhbnkgbmV3IGtleWVkIGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgYXJlIGFkZGluZyBuZXcgaXRlbXMgdG8gdGhlIGVuZCBhbmQgdGhlbiBzb3J0aW5nIHRoZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbiBwbGFjZS4gSW4gZnV0dXJlIHdlIHNob3VsZCBpbnNlcnQgbmV3IGl0ZW1zIGluIHBsYWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2gobmV3SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA+PSBsYXN0RnJlZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgYW55IGxlZnRvdmVyIG5vbi1rZXllZCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChuZXdJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBzaW11bGF0ZSA9IG5ld0NoaWxkcmVuLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNpbXVsYXRlSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIHZhciByZW1vdmVzID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGluc2VydHMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgc2ltdWxhdGVJdGVtO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBiQ2hpbGRyZW4ubGVuZ3RoOykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgd2FudGVkSXRlbSA9IGJDaGlsZHJlbltrXTtcbiAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJdGVtID0gc2ltdWxhdGVbc2ltdWxhdGVJbmRleF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChzaW11bGF0ZUl0ZW0gPT09IG51bGwgJiYgc2ltdWxhdGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2ltdWxhdGVJdGVtIHx8IHNpbXVsYXRlSXRlbS5rZXkgIT09IHdhbnRlZEl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSBuZWVkIGEga2V5IGluIHRoaXMgcG9zaXRpb24uLi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3YW50ZWRJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaW11bGF0ZUl0ZW0gJiYgc2ltdWxhdGVJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpbnNlcnQgZG9lc24ndCBwdXQgdGhpcyBrZXkgaW4gcGxhY2UsIGl0IG5lZWRzIHRvIG1vdmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJLZXlzW3NpbXVsYXRlSXRlbS5rZXldICE9PSBrICsgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3Zlcy5wdXNoKHJlbW92ZShzaW11bGF0ZSwgc2ltdWxhdGVJbmRleCwgc2ltdWxhdGVJdGVtLmtleSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJdGVtID0gc2ltdWxhdGVbc2ltdWxhdGVJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgcmVtb3ZlIGRpZG4ndCBwdXQgdGhlIHdhbnRlZCBpdGVtIGluIHBsYWNlLCB3ZSBuZWVkIHRvIGluc2VydCBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzaW11bGF0ZUl0ZW0gfHwgc2ltdWxhdGVJdGVtLmtleSAhPT0gd2FudGVkSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goeyBrZXk6IHdhbnRlZEl0ZW0ua2V5LCB0bzogayB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0ZW1zIGFyZSBtYXRjaGluZywgc28gc2tpcCBhaGVhZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0cy5wdXNoKHsga2V5OiB3YW50ZWRJdGVtLmtleSwgdG86IGsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goeyBrZXk6IHdhbnRlZEl0ZW0ua2V5LCB0bzogayB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYSBrZXkgaW4gc2ltdWxhdGUgaGFzIG5vIG1hdGNoaW5nIHdhbnRlZCBrZXksIHJlbW92ZSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2ltdWxhdGVJdGVtICYmIHNpbXVsYXRlSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBzaW11bGF0ZUl0ZW0ua2V5KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgYWxsIHRoZSByZW1haW5pbmcgbm9kZXMgZnJvbSBzaW11bGF0ZVxuICAgICAgICAgICAgICAgIHdoaWxlIChzaW11bGF0ZUluZGV4IDwgc2ltdWxhdGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBzaW11bGF0ZUl0ZW0gJiYgc2ltdWxhdGVJdGVtLmtleSkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBvbmx5IG1vdmVzIHdlIGhhdmUgYXJlIGRlbGV0ZXMgdGhlbiB3ZSBjYW4ganVzdFxuICAgICAgICAgICAgICAgIC8vIGxldCB0aGUgZGVsZXRlIHBhdGNoIHJlbW92ZSB0aGVzZSBpdGVtcy5cbiAgICAgICAgICAgICAgICBpZiAocmVtb3Zlcy5sZW5ndGggPT09IGRlbGV0ZWRJdGVtcyAmJiAhaW5zZXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBuZXdDaGlsZHJlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVzOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IG5ld0NoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICBtb3Zlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlczogcmVtb3ZlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHM6IGluc2VydHNcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZShhcnIsIGluZGV4LCBrZXkpIHtcbiAgICAgICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGZyb206IGluZGV4LFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGtleVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGtleUluZGV4KGNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleXMgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgZnJlZSA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBjaGlsZHJlbi5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXNbY2hpbGQua2V5XSA9IGk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmVlLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBrZXlzOiBrZXlzLCAvLyBBIGhhc2ggb2Yga2V5IG5hbWUgdG8gaW5kZXhcbiAgICAgICAgICAgICAgICAgICAgZnJlZTogZnJlZSAvLyBBbiBhcnJheSBvZiB1bmtleWVkIGl0ZW0gaW5kaWNlc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFwcGVuZFBhdGNoKGFwcGx5LCBwYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmIChhcHBseSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNBcnJheShhcHBseSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5LnB1c2gocGF0Y2gpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBbYXBwbHksIHBhdGNoXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcHBseTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0Y2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi4vdm5vZGUvaGFuZGxlLXRodW5rXCI6IDI0LCBcIi4uL3Zub2RlL2lzLXRodW5rXCI6IDI1LCBcIi4uL3Zub2RlL2lzLXZub2RlXCI6IDI3LCBcIi4uL3Zub2RlL2lzLXZ0ZXh0XCI6IDI4LCBcIi4uL3Zub2RlL2lzLXdpZGdldFwiOiAyOSwgXCIuLi92bm9kZS92cGF0Y2hcIjogMzIsIFwiLi9kaWZmLXByb3BzXCI6IDM0LCBcIngtaXMtYXJyYXlcIjogMTIgfV0gfSwge30sIFs0XSkoNCk7XG59KTtcblxuY29uc3Qgc3RhcnQgPSBmdW5jdGlvbiAoZG9tUm9vdCwgcmVuZGVyRm4sIGluaXRpYWxTdGF0ZSwgb3B0aW9ucyA9IFtdKSB7XG4gIGxldCBwaWQgPSBzZWxmLnByb2Nlc3Nlcy5zcGF3bigpO1xuXG4gIGlmIChLZXl3b3JkLmhhc19rZXlfX3FtX18ob3B0aW9ucywgS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCduYW1lJykpKSB7XG4gICAgcGlkID0gc2VsZi5wcm9jZXNzZXMucmVnaXN0ZXIoS2V5d29yZC5nZXQob3B0aW9ucywgS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCduYW1lJykpLCBwaWQpO1xuICB9XG5cbiAgY29uc3QgdHJlZSA9IHJlbmRlckZuLmFwcGx5KHRoaXMsIGluaXRpYWxTdGF0ZSk7XG4gIGNvbnN0IHJvb3ROb2RlID0gVmlydHVhbERPTS5jcmVhdGUodHJlZSk7XG5cbiAgZG9tUm9vdC5hcHBlbmRDaGlsZChyb290Tm9kZSk7XG5cbiAgc2VsZi5wcm9jZXNzZXMucHV0KHBpZCwgJ3N0YXRlJywgS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShyb290Tm9kZSwgdHJlZSwgcmVuZGVyRm4pKTtcbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUoS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpLCBwaWQpO1xufTtcblxuY29uc3Qgc3RvcCA9IGZ1bmN0aW9uIChhZ2VudCwgdGltZW91dCA9IDUwMDApIHtcbiAgc2VsZi5wcm9jZXNzZXMuZXhpdChhZ2VudCk7XG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ29rJyk7XG59O1xuXG5jb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoYWdlbnQsIHN0YXRlKSB7XG5cbiAgY29uc3QgY3VycmVudF9zdGF0ZSA9IHNlbGYucHJvY2Vzc2VzLmdldChhZ2VudCwgJ3N0YXRlJyk7XG5cbiAgbGV0IHJvb3ROb2RlID0gS2VybmVsLmVsZW0oY3VycmVudF9zdGF0ZSwgMCk7XG4gIGxldCB0cmVlID0gS2VybmVsLmVsZW0oY3VycmVudF9zdGF0ZSwgMSk7XG4gIGxldCByZW5kZXJGbiA9IEtlcm5lbC5lbGVtKGN1cnJlbnRfc3RhdGUsIDIpO1xuXG4gIGxldCBuZXdUcmVlID0gcmVuZGVyRm4uYXBwbHkodGhpcywgc3RhdGUpO1xuXG4gIGxldCBwYXRjaGVzID0gVmlydHVhbERPTS5kaWZmKHRyZWUsIG5ld1RyZWUpO1xuICByb290Tm9kZSA9IFZpcnR1YWxET00ucGF0Y2gocm9vdE5vZGUsIHBhdGNoZXMpO1xuXG4gIHNlbGYucHJvY2Vzc2VzLnB1dChhZ2VudCwgJ3N0YXRlJywgS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShyb290Tm9kZSwgbmV3VHJlZSwgcmVuZGVyRm4pKTtcblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCdvaycpO1xufTtcblxudmFyIHZpZXcgPSB7XG4gIHN0YXJ0LFxuICBzdG9wLFxuICByZW5kZXJcbn07XG5cbnNlbGYucHJvY2Vzc2VzID0gc2VsZi5wcm9jZXNzZXMgfHwgbmV3IFByb2Nlc3NTeXN0ZW0oKTtcblxuY29uc3QgQ29yZSA9IEM7XG5cbmV4cG9ydCB7IENvcmUsIEtlcm5lbCwgQXRvbSwgRW51bSwgSW50ZWdlciwgTGlzdCwgUmFuZ2UsIFR1cGxlLCBBZ2VudCwgS2V5d29yZCwgYmFzZSBhcyBCYXNlLCBTdHJpbmckMSBhcyBTdHJpbmcsIGJpdHdpc2UgYXMgQml0d2lzZSwgRW51bWVyYWJsZSwgQ29sbGVjdGFibGUsIEluc3BlY3QsIG1hcCBhcyBNYXAsIHNldCBhcyBTZXQsIE1hcFNldCwgVmlydHVhbERPTSwgdmlldyBhcyBWaWV3IH07Il0sImZpbGUiOiJlbGl4aXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==