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

class Tuple$1 {

  constructor(...args) {
    this.values = Object.freeze(args);
    this.length = this.values.length;
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

class Integer {}
class Float {}

function List$1(...args) {
  return Object.freeze(args);
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

function is_number$2(value) {
  return typeof value === 'number';
}

function is_string(value) {
  return typeof value === 'string';
}

function is_boolean$2(value) {
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

function is_function$2(value) {
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
  is_number: is_number$2,
  is_string,
  is_boolean: is_boolean$2,
  is_symbol,
  is_null,
  is_undefined,
  is_function: is_function$2,
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

  for (let key of Object.keys(pattern).concat(Object.getOwnPropertySymbols(pattern))) {
    matches[key] = buildMatch(pattern[key]);
  }

  return function (value, args) {
    if (!Checks.is_object(value) || pattern.length > value.length) {
      return false;
    }

    for (let key of Object.keys(pattern).concat(Object.getOwnPropertySymbols(pattern))) {
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

function is_instance_of(value, type) {
  return value instanceof type;
}

function size$2(term) {
  return term.length;
}

function is_nil$1(x) {
  return x === null;
}

function is_atom$1(x) {
  return typeof x === 'symbol';
}

function is_binary$1(x) {
  return typeof x === 'string' || x instanceof String;
}

function is_boolean$1(x) {
  return typeof x === 'boolean' || x instanceof Boolean;
}

function is_function$1(x, arity = -1) {
  return typeof x === 'function' || x instanceof Function;
}

function is_float$1(x) {
  return is_number$1(x) && !Number.isInteger(x);
}

function is_integer$1(x) {
  return Number.isInteger(x);
}

function is_list$1(x) {
  return x instanceof Array;
}

function is_map$1(x) {
  return typeof x === 'object' || x instanceof Object;
}

function is_number$1(x) {
  return typeof x === 'number';
}

function is_tuple$1(x) {
  return x instanceof Tuple$1;
}

function is_pid$1(x) {
  return x instanceof PID;
}

function is_port$1(x) {
  return false;
}

function is_reference$1(x) {
  return false;
}

function is_bitstring$1(x) {
  return is_binary$1(x) || x instanceof BitString;
}

function add(one, two) {
  return one + two;
}

function subtract(one, two) {
  return one + two;
}

function multiply(one, two) {
  return one + two;
}

function divide(one, two) {
  return one + two;
}

function remainder(one, two) {
  return one + two;
}

function apply$1(...args) {
  if (args.length === 2) {
    args[0].apply(null, args.slice(1));
  } else {
    args[0][args[1]].apply(null, args.slice(2));
  }
}

function new_tuple(...args) {
  return new Tuple$1(...args);
}

function duplicate(data, size) {
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return array;
}

function contains(left, right) {
  for (let x of right) {
    if (Patterns.match_no_throw(left, x) != null) {
      return true;
    }
  }

  return false;
}

function reverse(list) {
  return list.concat([]).reverse();
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

function concat_lists(left, right) {
  return left.concat(right);
}

function prepend_to_list(list, item) {
  return [item].concat(list);
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

function get_object_keys(obj) {
  return Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));
}

function is_valid_character(codepoint) {
  try {
    return String.fromCodePoint(codepoint) != null;
  } catch (e) {
    return false;
  }
}

//https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_rewrite_the_DOMs_atob()_and_btoa()_using_JavaScript's_TypedArrays_and_UTF-8
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}

var Functions = {
  call_property,
  is_instance_of,
  size: size$2,
  is_nil: is_nil$1,
  is_atom: is_atom$1,
  is_binary: is_binary$1,
  is_boolean: is_boolean$1,
  is_function: is_function$1,
  is_float: is_float$1,
  is_integer: is_integer$1,
  is_list: is_list$1,
  is_map: is_map$1,
  is_number: is_number$1,
  is_tuple: is_tuple$1,
  is_pid: is_pid$1,
  is_port: is_port$1,
  is_reference: is_reference$1,
  is_bitstring: is_bitstring$1,
  add,
  subtract,
  multiply,
  divide,
  remainder,
  apply: apply$1,
  new_tuple,
  duplicate,
  contains,
  reverse,
  get_global,
  concat_lists,
  prepend_to_list,
  defstruct,
  defexception,
  defprotocol,
  defimpl,
  get_object_keys,
  is_valid_character,
  b64EncodeUnicode
};

function list(...args) {
  return Object.freeze(args);
}

function bitstring(...args) {
  return new BitString(...args);
}

function tuple(...args) {
  return new Tuple(...args);
}

function _case(condition, clauses) {
  return Patterns.defmatch(...clauses)(condition);
}

function cond(clauses) {
  for (let clause of clauses) {
    if (clause[0]) {
      return clause[1]();
    }
  }

  throw new Error();
}

function map$1(obj) {
  return Object.freeze(obj);
}

function map_update(map, values) {
  return Object.freeze(Object.assign(Object.create(map.constructor.prototype), map, values));
}

function _for(collections, fun, filter = () => true, into = [], previousValues = []) {
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
}

function _try(do_fun, rescue_function, catch_fun, else_function, after_function) {
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

var SpecialForms$1 = {
  list,
  bitstring,
  tuple,
  _case,
  cond,
  map: map$1,
  map_update,
  _for,
  _try
};

Functions.get_global().processes = Functions.get_global().processes || new ProcessSystem();



var C = Object.freeze({
	ProcessSystem: ProcessSystem,
	Tuple: Tuple$1,
	PID: PID,
	BitString: BitString,
	Patterns: Patterns,
	Integer: Integer,
	Float: Float,
	Functions: Functions,
	List: List$1,
	SpecialForms: SpecialForms$1
});

function tl(list) {
  return SpecialForms$1.list(...list.slice(1));
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
    return arg.toString();
  }

  return arg.toString();
}

function match__qmark__(pattern, expr, guard = () => true) {
  return Patterns.match_no_throw(pattern, expr, guard) != null;
}

var Kernel = {
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
  match__qmark__
};

let Enum$1 = {

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
        return new Tuple$1(Symbol.for('ok'), collection[n]);
      } else {
        return Symbol.for('error');
      }
    }

    throw new Error('collection is not an Enumerable');
  },

  fetch__emark__: function (collection, n) {
    if (Kernel.is_list(collection)) {
      if (n < this.count(collection) && n >= 0) {
        return collection[n];
      } else {
        throw new Error('out of bounds error');
      }
    }

    throw new Error('collection is not an Enumerable');
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
    return Enum$1.map(Enum$1.filter(collection, filter), mapper);
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
    let mapped = List$1();
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = tuple.get(1);
      mapped = List$1(...mapped.concat([tuple.get(0)]));
    }

    return new Tuple$1(mapped, the_acc);
  },

  member__qmark__: function (collection, value) {
    return collection.includes(value);
  },

  reduce: function (collection, acc, fun) {
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = tuple.get(1);
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

    return List$1(...result);
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

let List = {};

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

  return SpecialForms$1.list(...new_value);
};

List.delete_at = function (list, index) {
  let new_value = [];

  for (let i = 0; i < list.length; i++) {
    if (i !== index) {
      new_value.push(list[i]);
    }
  }

  return SpecialForms$1.list(...new_value);
};

List.duplicate = function (elem, n) {
  let new_value = [];

  for (var i = 0; i < n; i++) {
    new_value.push(elem);
  }

  return SpecialForms$1.list(...new_value);
};

List.first = function (list) {
  return list[0];
};

List.flatten = function (list, tail = SpecialForms$1.list()) {
  let new_value = [];

  for (let x of list) {
    if (Kernel.is_list(x)) {
      new_value = new_value.concat(List.flatten(x));
    } else {
      new_value.push(x);
    }
  }

  new_value = new_value.concat(tail);

  return SpecialForms$1.list(...new_value);
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

  return SpecialForms$1.list(...new_value);
};

List.keydelete = function (list, key, position) {
  let new_list = [];

  for (let i = 0; i < list.length; i++) {
    if (!Kernel.match__qmark__(list[i][position], key)) {
      new_list.push(list[i]);
    }
  }

  return SpecialForms$1.list(...new_list);
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

  return SpecialForms$1.list(...new_list);
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

  return SpecialForms$1.list(...new_list);
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

  return SpecialForms$1.list(...new_list);
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

  return SpecialForms$1.list(...new_value);
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
    return SpecialForms$1.list();
  } else {
    return SpecialForms$1.list(list);
  }
};

List.zip = function (list_of_lists) {
  if (list_of_lists.length === 0) {
    return SpecialForms$1.list();
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

    new_value.push(new Tuple$1(...current_value));
  }

  return SpecialForms$1.list(...new_value);
};

List.to_tuple = function (list) {
  return new Tuple$1(...list);
};

List.append = function (list, value) {
  return SpecialForms$1.list(...list.concat([value]));
};

List.prepend = function (list, value) {
  return SpecialForms$1.list(...[value].concat(list));
};

List.concat = function (left, right) {
  return left.concat(right);
};

let Keyword = {};

Keyword.has_key__qmark__ = function (keywords, key) {
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

function __new__() {
  return SpecialForms$1.map({});
}

function keys(map) {
  return Functions.get_object_keys(map);
}

function size(map) {
  return keys(map).length;
}

function to_list(map) {
  let map_keys = keys(map);
  let list = [];

  for (let key of map_keys) {
    list.push(new Tuple$1(key, map[key]));
  }

  return List$1(...list);
}

function values(map) {
  let map_keys = keys(map);
  let list = [];

  for (let key of map_keys) {
    list.push(map[key]);
  }

  return List$1(...list);
}

function from_struct(struct) {
  let map = Object.assign({}, struct);
  delete map[Symbol.for("__struct__")];

  return SpecialForms$1.map(map);
}

function __delete__(map, key) {
  let new_map = Object.assign({}, map);

  delete new_map[key];

  return SpecialForms$1.map(new_map);
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
    return new Tuple$1(Symbol.for("ok"), map[key]);
  }

  return Symbol.for("error");
}

function has_key__qmark__(map, key) {
  return key in map;
}

function split(map, keys) {
  let split1 = {};
  let split2 = {};

  for (let key of Functions.get_object_keys(map)) {
    if (keys.indexOf(key) > -1) {
      split1[key] = map[key];
    } else {
      split2[key] = map[key];
    }
  }

  return new Tuple$1(SpecialForms$1.map(split1), SpecialForms$1.map(split2));
}

function take(map, keys) {
  let split1 = {};

  for (let key of Functions.get_object_keys(map)) {
    if (keys.indexOf(key) > -1) {
      split1[key] = map[key];
    }
  }

  return SpecialForms$1.map(split1);
}

function drop(map, keys) {
  let split1 = {};

  for (let key of Functions.get_object_keys(map)) {
    if (keys.indexOf(key) === -1) {
      split1[key] = map[key];
    }
  }

  return SpecialForms$1.map(split1);
}

function put_new(map, key, value) {
  if (key in map) {
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = value;

  return SpecialForms$1.map(new_map);
}

function put_new_lazy(map, key, fun) {
  if (key in map) {
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = fun();

  return SpecialForms$1.map(new_map);
}

function get_and_update(map, key, fun) {
  if (key in map) {
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = fun(map[key]);

  return SpecialForms$1.map(new_map);
}

function pop_lazy(map, key, fun) {
  if (!key in map) {
    return new Tuple$1(fun(), map);
  }

  let new_map = Object.assign({}, map);
  let value = fun(new_map[key]);
  delete new_map[key];

  return new Tuple$1(value, new_map);
}

function pop(map, key, _default = null) {
  if (!key in map) {
    return new Tuple$1(_default, map);
  }

  let new_map = Object.assign({}, map);
  let value = new_map[key];
  delete new_map[key];

  return new Tuple$1(value, new_map);
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

  return SpecialForms$1.map(new_map);
}

function update__emark__(map, key, fun) {
  if (!key in map) {
    throw new Error("Key not found");
  }

  let new_map = Object({}, map);
  new_map[key] = fun(map[key]);

  return SpecialForms$1.map(new_map);
}

function update(map, key, initial, fun) {
  let new_map = Object({}, map);

  if (!key in map) {
    new_map[key] = initial;
  } else {
    new_map[key] = fun(map[key]);
  }

  return SpecialForms$1.map(new_map);
}

var map = {
  new: __new__,
  keys,
  size,
  to_list,
  values,
  from_struct,
  delete: __delete__,
  drop,
  equal__qmark__,
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
  put,
  update__emark__,
  update
};

function __new__$1() {
  return SpecialForms$1.map({ [Symbol.for('__struct__')]: Symbol.for('MapSet'), set: List$1() });
}

function size$1(map) {
  return map.set.length;
}

function to_list$1(map) {
  return map.set;
}

function __delete__$1(set, term) {
  let new_list = List.delete(set.set, term);

  let new_map = Object.assign({}, set);
  new_map.set = new_list;
  return SpecialForms$1.map(new_map);
}

function put$1(set, term) {
  if (set.set.indexOf(term) === -1) {
    let new_list = List.append(set.set, term);

    let new_map = Object.assign({}, set);
    new_map.set = new_list;
    return SpecialForms$1.map(new_map);
  }

  return set;
}

function difference(set1, set2) {
  let new_map = Object.assign({}, set1);

  for (let val of set1.set) {
    if (member__qmark__(set2, val)) {
      new_map.set = List.delete(new_map.set, val);
    }
  }

  return SpecialForms$1.map(new_map);
}

function intersection(set1, set2) {
  let new_map = Object.assign({}, set1);

  for (let val of set1.set) {
    if (!member__qmark__(set2, val)) {
      new_map.set = List.delete(new_map.set, val);
    }
  }

  return SpecialForms$1.map(new_map);
}

function union(set1, set2) {
  let new_map = set1;

  for (let val of set2.set) {
    new_map = put$1(new_map, val);
  }

  return SpecialForms$1.map(new_map);
}

function disjoin__qmark__(set1, set2) {
  for (let val of set1.set) {
    if (member__qmark__(set2, val)) {
      return false;
    }
  }

  return true;
}

function member__qmark__(set, value) {
  return set.set.indexOf(value) >= 0;
}

function equal__qmark__$1(set1, set2) {
  return set1.set === set2.set;
}

function subset__qmark__(set1, set2) {
  for (let val of set1.set) {
    if (!member__qmark__(set2, val)) {
      return false;
    }
  }

  return true;
}

var map_set = {
  new: __new__$1,
  size: size$1,
  to_list: to_list$1,
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

const Core = C;

export { Core, Kernel, Enum, List, Keyword, bitwise as Bitwise, map as Map, map_set as MapSet, VirtualDOM };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJFbGl4aXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuY2xhc3MgTWFpbGJveCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICB9XG5cbiAgZGVsaXZlcihtZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzO1xuICB9XG5cbiAgaXNFbXB0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5tZXNzYWdlcy5sZW5ndGggPT09IDA7XG4gIH1cblxuICByZW1vdmVBdChpbmRleCkge1xuICAgIHRoaXMubWVzc2FnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG52YXIgU3RhdGVzID0ge1xuICBOT1JNQUw6IFN5bWJvbC5mb3IoXCJub3JtYWxcIiksXG4gIEtJTEw6IFN5bWJvbC5mb3IoXCJraWxsXCIpLFxuICBTVVNQRU5EOiBTeW1ib2wuZm9yKFwic3VzcGVuZFwiKSxcbiAgQ09OVElOVUU6IFN5bWJvbC5mb3IoXCJjb250aW51ZVwiKSxcbiAgUkVDRUlWRTogU3ltYm9sLmZvcihcInJlY2VpdmVcIiksXG4gIFNFTkQ6IFN5bWJvbC5mb3IoXCJzZW5kXCIpLFxuICBTTEVFUElORzogU3ltYm9sLmZvcihcInNsZWVwaW5nXCIpLFxuICBSVU5OSU5HOiBTeW1ib2wuZm9yKFwicnVubmluZ1wiKSxcbiAgU1VTUEVOREVEOiBTeW1ib2wuZm9yKFwic3VzcGVuZGVkXCIpLFxuICBTVE9QUEVEOiBTeW1ib2wuZm9yKFwic3RvcHBlZFwiKSxcbiAgU0xFRVA6IFN5bWJvbC5mb3IoXCJzbGVlcFwiKSxcbiAgRVhJVDogU3ltYm9sLmZvcihcImV4aXRcIiksXG4gIE5PTUFUQ0g6IFN5bWJvbC5mb3IoXCJub19tYXRjaFwiKVxufTtcblxuY2xhc3MgUHJvY2VzcyB7XG5cbiAgY29uc3RydWN0b3IocGlkLCBtYWlsYm94KSB7XG4gICAgdGhpcy5waWQgPSBwaWQ7XG4gICAgdGhpcy5tYWlsYm94ID0gbWFpbGJveDtcbiAgICB0aGlzLnN0YXR1cyA9IFN0YXRlcy5TVE9QUEVEO1xuICAgIHRoaXMuZGljdCA9IHt9O1xuICB9XG59XG5cbmNsYXNzIFR1cGxlJDEge1xuXG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICB0aGlzLnZhbHVlcyA9IE9iamVjdC5mcmVlemUoYXJncyk7XG4gICAgdGhpcy5sZW5ndGggPSB0aGlzLnZhbHVlcy5sZW5ndGg7XG4gIH1cblxuICBnZXQoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICB9XG5cbiAgY291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmxlbmd0aDtcbiAgfVxuXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlc1tTeW1ib2wuaXRlcmF0b3JdKCk7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICB2YXIgaSxcbiAgICAgICAgcyA9IFwiXCI7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMudmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocyAhPT0gXCJcIikge1xuICAgICAgICBzICs9IFwiLCBcIjtcbiAgICAgIH1cbiAgICAgIHMgKz0gdGhpcy52YWx1ZXNbaV0udG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJ7XCIgKyBzICsgXCJ9XCI7XG4gIH1cblxufVxuXG5sZXQgcHJvY2Vzc19jb3VudGVyID0gLTE7XG5cbmNsYXNzIFBJRCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHByb2Nlc3NfY291bnRlciA9IHByb2Nlc3NfY291bnRlciArIDE7XG4gICAgdGhpcy5pZCA9IHByb2Nlc3NfY291bnRlcjtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBcIlBJRCM8MC5cIiArIHRoaXMuaWQgKyBcIi4wPlwiO1xuICB9XG59XG5cbmNsYXNzIEludGVnZXIge31cbmNsYXNzIEZsb2F0IHt9XG5cbmZ1bmN0aW9uIExpc3QkMSguLi5hcmdzKSB7XG4gIHJldHVybiBPYmplY3QuZnJlZXplKGFyZ3MpO1xufVxuXG5jbGFzcyBQcm9jZXNzU3lzdGVtIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnBpZHMgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5tYWlsYm94ZXMgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5uYW1lcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmxpbmtzID0gbmV3IE1hcCgpO1xuXG4gICAgdGhpcy5jdXJyZW50X3Byb2Nlc3MgPSBudWxsO1xuICAgIHRoaXMuc3VzcGVuZGVkID0gbmV3IE1hcCgpO1xuXG4gICAgdGhpcy5tYWluX3Byb2Nlc3NfcGlkID0gdGhpcy5zcGF3bigpO1xuICAgIHRoaXMuc2V0X2N1cnJlbnQodGhpcy5tYWluX3Byb2Nlc3NfcGlkKTtcbiAgfVxuXG4gIHNwYXduKCkge1xuICAgIHJldHVybiB0aGlzLmFkZF9wcm9jKGZhbHNlKS5waWQ7XG4gIH1cblxuICBzcGF3bl9saW5rKCkge1xuICAgIHJldHVybiB0aGlzLmFkZF9wcm9jKHRydWUpLnBpZDtcbiAgfVxuXG4gIGxpbmsocGlkKSB7XG4gICAgdGhpcy5saW5rcy5nZXQodGhpcy5waWQoKSkuYWRkKHBpZCk7XG4gICAgdGhpcy5saW5rcy5nZXQocGlkKS5hZGQodGhpcy5waWQoKSk7XG4gIH1cblxuICB1bmxpbmsocGlkKSB7XG4gICAgdGhpcy5saW5rcy5nZXQodGhpcy5waWQoKSkuZGVsZXRlKHBpZCk7XG4gICAgdGhpcy5saW5rcy5nZXQocGlkKS5kZWxldGUodGhpcy5waWQoKSk7XG4gIH1cblxuICBzZXRfY3VycmVudChpZCkge1xuICAgIGxldCBwaWQgPSB0aGlzLnBpZG9mKGlkKTtcbiAgICBpZiAocGlkICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmN1cnJlbnRfcHJvY2VzcyA9IHRoaXMucGlkcy5nZXQocGlkKTtcbiAgICAgIHRoaXMuY3VycmVudF9wcm9jZXNzLnN0YXR1cyA9IFN0YXRlcy5SVU5OSU5HO1xuICAgIH1cbiAgfVxuXG4gIGFkZF9wcm9jKGxpbmtlZCkge1xuICAgIGxldCBuZXdwaWQgPSBuZXcgUElEKCk7XG4gICAgbGV0IG1haWxib3ggPSBuZXcgTWFpbGJveCgpO1xuICAgIGxldCBuZXdwcm9jID0gbmV3IFByb2Nlc3MobmV3cGlkLCBtYWlsYm94KTtcblxuICAgIHRoaXMucGlkcy5zZXQobmV3cGlkLCBuZXdwcm9jKTtcbiAgICB0aGlzLm1haWxib3hlcy5zZXQobmV3cGlkLCBtYWlsYm94KTtcbiAgICB0aGlzLmxpbmtzLnNldChuZXdwaWQsIG5ldyBTZXQoKSk7XG5cbiAgICBpZiAobGlua2VkKSB7XG4gICAgICB0aGlzLmxpbmsobmV3cGlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3cHJvYztcbiAgfVxuXG4gIHJlbW92ZV9wcm9jKHBpZCkge1xuICAgIHRoaXMucGlkcy5kZWxldGUocGlkKTtcbiAgICB0aGlzLnVucmVnaXN0ZXIocGlkKTtcblxuICAgIGlmICh0aGlzLmxpbmtzLmhhcyhwaWQpKSB7XG4gICAgICBmb3IgKGxldCBsaW5rcGlkIG9mIHRoaXMubGlua3MuZ2V0KHBpZCkpIHtcbiAgICAgICAgdGhpcy5saW5rcy5nZXQobGlua3BpZCkuZGVsZXRlKHBpZCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubGlua3MuZGVsZXRlKHBpZCk7XG4gICAgfVxuICB9XG5cbiAgZXhpdChpZCkge1xuICAgIGxldCBwaWQgPSB0aGlzLnBpZG9mKGlkKTtcbiAgICB0aGlzLnJlbW92ZV9wcm9jKGlkKTtcbiAgfVxuXG4gIHJlZ2lzdGVyKG5hbWUsIHBpZCkge1xuICAgIGlmICghdGhpcy5uYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgIHRoaXMubmFtZXMuc2V0KG5hbWUsIHBpZCk7XG4gICAgICByZXR1cm4gbmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmFtZSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQgdG8gYW5vdGhlciBwcm9jZXNzXCIpO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyZWQobmFtZSkge1xuICAgIHJldHVybiB0aGlzLm5hbWVzLmhhcyhuYW1lKSA/IHRoaXMubmFtZXMuZ2V0KG5hbWUpIDogbnVsbDtcbiAgfVxuXG4gIHVucmVnaXN0ZXIocGlkKSB7XG4gICAgZm9yIChsZXQgbmFtZSBvZiB0aGlzLm5hbWVzLmtleXMoKSkge1xuICAgICAgaWYgKHRoaXMubmFtZXMuaGFzKG5hbWUpICYmIHRoaXMubmFtZXMuZ2V0KG5hbWUpID09PSBwaWQpIHtcbiAgICAgICAgdGhpcy5uYW1lcy5kZWxldGUobmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGlkKCkge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfcHJvY2Vzcy5waWQ7XG4gIH1cblxuICBwaWRvZihpZCkge1xuICAgIGlmIChpZCBpbnN0YW5jZW9mIFBJRCkge1xuICAgICAgcmV0dXJuIHRoaXMucGlkcy5oYXMoaWQpID8gaWQgOiBudWxsO1xuICAgIH0gZWxzZSBpZiAoaWQgaW5zdGFuY2VvZiBQcm9jZXNzKSB7XG4gICAgICByZXR1cm4gaWQucGlkO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGlkID0gdGhpcy5yZWdpc3RlcmVkKGlkKTtcbiAgICAgIGlmIChwaWQgPT09IG51bGwpIHRocm93IFwiUHJvY2VzcyBuYW1lIG5vdCByZWdpc3RlcmVkOiBcIiArIGlkICsgXCIgKFwiICsgdHlwZW9mIGlkICsgXCIpXCI7XG4gICAgICByZXR1cm4gcGlkO1xuICAgIH1cbiAgfVxuXG4gIHB1dChpZCwga2V5LCB2YWx1ZSkge1xuICAgIGxldCBwaWQgPSB0aGlzLnBpZG9mKGlkKTtcbiAgICBsZXQgcHJvY2VzcyA9IHRoaXMucGlkcy5nZXQocGlkKTtcbiAgICBwcm9jZXNzLmRpY3Rba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0KGlkLCBrZXkpIHtcbiAgICBsZXQgcGlkID0gdGhpcy5waWRvZihpZCk7XG4gICAgbGV0IHByb2Nlc3MgPSB0aGlzLnBpZHMuZ2V0KHBpZCk7XG5cbiAgICBpZiAoa2V5ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzLmRpY3Rba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByb2Nlc3MuZGljdDtcbiAgICB9XG4gIH1cblxuICBnZXRfa2V5cyhpZCkge1xuICAgIGxldCBwaWQgPSB0aGlzLnBpZG9mKGlkKTtcbiAgICBsZXQgcHJvY2VzcyA9IHRoaXMucGlkcy5nZXQocGlkKTtcblxuICAgIHJldHVybiBPYmplY3Qua2V5cyhwcm9jZXNzLmRpY3QpO1xuICB9XG5cbiAgZXJhc2UoaWQsIGtleSkge1xuICAgIGxldCBwaWQgPSB0aGlzLnBpZG9mKGlkKTtcbiAgICBsZXQgcHJvY2VzcyA9IHRoaXMucGlkcy5nZXQocGlkKTtcblxuICAgIGlmIChrZXkgIT0gbnVsbCkge1xuICAgICAgZGVsZXRlIHByb2Nlc3MuZGljdFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm9jZXNzLmRpY3QgPSB7fTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgQml0U3RyaW5nIHtcbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHRoaXMucmF3X3ZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoYXJncyk7XG4gICAgfTtcblxuICAgIHRoaXMudmFsdWUgPSBPYmplY3QuZnJlZXplKHRoaXMucHJvY2VzcyhhcmdzKSk7XG4gIH1cblxuICBnZXQoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZVtpbmRleF07XG4gIH1cblxuICBjb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5sZW5ndGg7XG4gIH1cblxuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZVtTeW1ib2wuaXRlcmF0b3JdKCk7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICB2YXIgaSxcbiAgICAgICAgcyA9IFwiXCI7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuY291bnQoKTsgaSsrKSB7XG4gICAgICBpZiAocyAhPT0gXCJcIikge1xuICAgICAgICBzICs9IFwiLCBcIjtcbiAgICAgIH1cbiAgICAgIHMgKz0gdGhpc1tpXS50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHJldHVybiBcIjw8XCIgKyBzICsgXCI+PlwiO1xuICB9XG5cbiAgcHJvY2VzcygpIHtcbiAgICBsZXQgcHJvY2Vzc2VkX3ZhbHVlcyA9IFtdO1xuXG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMucmF3X3ZhbHVlKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBwcm9jZXNzZWRfdmFsdWUgPSB0aGlzW1wicHJvY2Vzc19cIiArIHRoaXMucmF3X3ZhbHVlKClbaV0udHlwZV0odGhpcy5yYXdfdmFsdWUoKVtpXSk7XG5cbiAgICAgIGZvciAobGV0IGF0dHIgb2YgdGhpcy5yYXdfdmFsdWUoKVtpXS5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIHByb2Nlc3NlZF92YWx1ZSA9IHRoaXNbXCJwcm9jZXNzX1wiICsgYXR0cl0ocHJvY2Vzc2VkX3ZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgcHJvY2Vzc2VkX3ZhbHVlcyA9IHByb2Nlc3NlZF92YWx1ZXMuY29uY2F0KHByb2Nlc3NlZF92YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2Nlc3NlZF92YWx1ZXM7XG4gIH1cblxuICBwcm9jZXNzX2ludGVnZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUudmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2Zsb2F0KHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlLnNpemUgPT09IDY0KSB7XG4gICAgICByZXR1cm4gQml0U3RyaW5nLmZsb2F0NjRUb0J5dGVzKHZhbHVlLnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlLnNpemUgPT09IDMyKSB7XG4gICAgICByZXR1cm4gQml0U3RyaW5nLmZsb2F0MzJUb0J5dGVzKHZhbHVlLnZhbHVlKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHNpemUgZm9yIGZsb2F0XCIpO1xuICB9XG5cbiAgcHJvY2Vzc19iaXRzdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUudmFsdWUudmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2JpbmFyeSh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcudG9VVEY4QXJyYXkodmFsdWUudmFsdWUpO1xuICB9XG5cbiAgcHJvY2Vzc191dGY4KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjhBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3V0ZjE2KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjE2QXJyYXkodmFsdWUudmFsdWUpO1xuICB9XG5cbiAgcHJvY2Vzc191dGYzMih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcudG9VVEYzMkFycmF5KHZhbHVlLnZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3Nfc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFt2YWx1ZV0pWzBdO1xuICB9XG5cbiAgcHJvY2Vzc191bnNpZ25lZCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfbmF0aXZlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc19iaWcodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2xpdHRsZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXZlcnNlKCk7XG4gIH1cblxuICBwcm9jZXNzX3NpemUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX3VuaXQodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBzdGF0aWMgaW50ZWdlcih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJpbnRlZ2VyXCIsIFwidW5pdFwiOiAxLCBcInNpemVcIjogOCB9KTtcbiAgfVxuXG4gIHN0YXRpYyBmbG9hdCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJmbG9hdFwiLCBcInVuaXRcIjogMSwgXCJzaXplXCI6IDY0IH0pO1xuICB9XG5cbiAgc3RhdGljIGJpdHN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJiaXRzdHJpbmdcIiwgXCJ1bml0XCI6IDEsIFwic2l6ZVwiOiB2YWx1ZS5sZW5ndGggfSk7XG4gIH1cblxuICBzdGF0aWMgYml0cyh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcuYml0c3RyaW5nKHZhbHVlKTtcbiAgfVxuXG4gIHN0YXRpYyBiaW5hcnkodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwiYmluYXJ5XCIsIFwidW5pdFwiOiA4LCBcInNpemVcIjogdmFsdWUubGVuZ3RoIH0pO1xuICB9XG5cbiAgc3RhdGljIGJ5dGVzKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy5iaW5hcnkodmFsdWUpO1xuICB9XG5cbiAgc3RhdGljIHV0ZjgodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwidXRmOFwiIH0pO1xuICB9XG5cbiAgc3RhdGljIHV0ZjE2KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcInV0ZjE2XCIgfSk7XG4gIH1cblxuICBzdGF0aWMgdXRmMzIodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwidXRmMzJcIiB9KTtcbiAgfVxuXG4gIHN0YXRpYyBzaWduZWQodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcInNpZ25lZFwiKTtcbiAgfVxuXG4gIHN0YXRpYyB1bnNpZ25lZCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwge30sIFwidW5zaWduZWRcIik7XG4gIH1cblxuICBzdGF0aWMgbmF0aXZlKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJuYXRpdmVcIik7XG4gIH1cblxuICBzdGF0aWMgYmlnKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJiaWdcIik7XG4gIH1cblxuICBzdGF0aWMgbGl0dGxlKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJsaXR0bGVcIik7XG4gIH1cblxuICBzdGF0aWMgc2l6ZSh2YWx1ZSwgY291bnQpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJzaXplXCI6IGNvdW50IH0pO1xuICB9XG5cbiAgc3RhdGljIHVuaXQodmFsdWUsIGNvdW50KSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidW5pdFwiOiBjb3VudCB9KTtcbiAgfVxuXG4gIHN0YXRpYyB3cmFwKHZhbHVlLCBvcHQsIG5ld19hdHRyaWJ1dGUgPSBudWxsKSB7XG4gICAgbGV0IHRoZV92YWx1ZSA9IHZhbHVlO1xuXG4gICAgaWYgKCEodmFsdWUgaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICB0aGVfdmFsdWUgPSB7IFwidmFsdWVcIjogdmFsdWUsIFwiYXR0cmlidXRlc1wiOiBbXSB9O1xuICAgIH1cblxuICAgIHRoZV92YWx1ZSA9IE9iamVjdC5hc3NpZ24odGhlX3ZhbHVlLCBvcHQpO1xuXG4gICAgaWYgKG5ld19hdHRyaWJ1dGUpIHtcbiAgICAgIHRoZV92YWx1ZS5hdHRyaWJ1dGVzLnB1c2gobmV3X2F0dHJpYnV0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoZV92YWx1ZTtcbiAgfVxuXG4gIHN0YXRpYyB0b1VURjhBcnJheShzdHIpIHtcbiAgICB2YXIgdXRmOCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hhcmNvZGUgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjaGFyY29kZSA8IDEyOCkge1xuICAgICAgICB1dGY4LnB1c2goY2hhcmNvZGUpO1xuICAgICAgfSBlbHNlIGlmIChjaGFyY29kZSA8IDIwNDgpIHtcbiAgICAgICAgdXRmOC5wdXNoKDE5MiB8IGNoYXJjb2RlID4+IDYsIDEyOCB8IGNoYXJjb2RlICYgNjMpO1xuICAgICAgfSBlbHNlIGlmIChjaGFyY29kZSA8IDU1Mjk2IHx8IGNoYXJjb2RlID49IDU3MzQ0KSB7XG4gICAgICAgIHV0ZjgucHVzaCgyMjQgfCBjaGFyY29kZSA+PiAxMiwgMTI4IHwgY2hhcmNvZGUgPj4gNiAmIDYzLCAxMjggfCBjaGFyY29kZSAmIDYzKTtcbiAgICAgIH1cbiAgICAgIC8vIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBlbHNlIHtcbiAgICAgICAgaSsrO1xuICAgICAgICAvLyBVVEYtMTYgZW5jb2RlcyAweDEwMDAwLTB4MTBGRkZGIGJ5XG4gICAgICAgIC8vIHN1YnRyYWN0aW5nIDB4MTAwMDAgYW5kIHNwbGl0dGluZyB0aGVcbiAgICAgICAgLy8gMjAgYml0cyBvZiAweDAtMHhGRkZGRiBpbnRvIHR3byBoYWx2ZXNcbiAgICAgICAgY2hhcmNvZGUgPSA2NTUzNiArICgoY2hhcmNvZGUgJiAxMDIzKSA8PCAxMCB8IHN0ci5jaGFyQ29kZUF0KGkpICYgMTAyMyk7XG4gICAgICAgIHV0ZjgucHVzaCgyNDAgfCBjaGFyY29kZSA+PiAxOCwgMTI4IHwgY2hhcmNvZGUgPj4gMTIgJiA2MywgMTI4IHwgY2hhcmNvZGUgPj4gNiAmIDYzLCAxMjggfCBjaGFyY29kZSAmIDYzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHV0Zjg7XG4gIH1cblxuICBzdGF0aWMgdG9VVEYxNkFycmF5KHN0cikge1xuICAgIHZhciB1dGYxNiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY29kZVBvaW50ID0gc3RyLmNvZGVQb2ludEF0KGkpO1xuXG4gICAgICBpZiAoY29kZVBvaW50IDw9IDI1NSkge1xuICAgICAgICB1dGYxNi5wdXNoKDApO1xuICAgICAgICB1dGYxNi5wdXNoKGNvZGVQb2ludCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1dGYxNi5wdXNoKGNvZGVQb2ludCA+PiA4ICYgMjU1KTtcbiAgICAgICAgdXRmMTYucHVzaChjb2RlUG9pbnQgJiAyNTUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXRmMTY7XG4gIH1cblxuICBzdGF0aWMgdG9VVEYzMkFycmF5KHN0cikge1xuICAgIHZhciB1dGYzMiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY29kZVBvaW50ID0gc3RyLmNvZGVQb2ludEF0KGkpO1xuXG4gICAgICBpZiAoY29kZVBvaW50IDw9IDI1NSkge1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKGNvZGVQb2ludCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKDApO1xuICAgICAgICB1dGYzMi5wdXNoKGNvZGVQb2ludCA+PiA4ICYgMjU1KTtcbiAgICAgICAgdXRmMzIucHVzaChjb2RlUG9pbnQgJiAyNTUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXRmMzI7XG4gIH1cblxuICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjAwMzQ5My9qYXZhc2NyaXB0LWZsb2F0LWZyb20tdG8tYml0c1xuICBzdGF0aWMgZmxvYXQzMlRvQnl0ZXMoZikge1xuICAgIHZhciBieXRlcyA9IFtdO1xuXG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcig0KTtcbiAgICBuZXcgRmxvYXQzMkFycmF5KGJ1ZilbMF0gPSBmO1xuXG4gICAgbGV0IGludFZlcnNpb24gPSBuZXcgVWludDMyQXJyYXkoYnVmKVswXTtcblxuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbiA+PiAyNCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uID4+IDE2ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gPj4gOCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uICYgMjU1KTtcblxuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHN0YXRpYyBmbG9hdDY0VG9CeXRlcyhmKSB7XG4gICAgdmFyIGJ5dGVzID0gW107XG5cbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDgpO1xuICAgIG5ldyBGbG9hdDY0QXJyYXkoYnVmKVswXSA9IGY7XG5cbiAgICB2YXIgaW50VmVyc2lvbjEgPSBuZXcgVWludDMyQXJyYXkoYnVmKVswXTtcbiAgICB2YXIgaW50VmVyc2lvbjIgPSBuZXcgVWludDMyQXJyYXkoYnVmKVsxXTtcblxuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjIgPj4gMjQgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjIgPj4gMTYgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjIgPj4gOCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiAmIDI1NSk7XG5cbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24xID4+IDI0ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24xID4+IDE2ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24xID4+IDggJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgJiAyNTUpO1xuXG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG59XG5cbi8qIEBmbG93ICovXG5cbmNsYXNzIFZhcmlhYmxlIHtcblxuICBjb25zdHJ1Y3RvcihuYW1lID0gbnVsbCkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cbn1cblxuY2xhc3MgV2lsZGNhcmQge1xuICBjb25zdHJ1Y3RvcigpIHt9XG59XG5cbmNsYXNzIFN0YXJ0c1dpdGgge1xuXG4gIGNvbnN0cnVjdG9yKHByZWZpeCkge1xuICAgIHRoaXMucHJlZml4ID0gcHJlZml4O1xuICB9XG59XG5cbmNsYXNzIENhcHR1cmUge1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG59XG5cbmNsYXNzIEhlYWRUYWlsIHtcbiAgY29uc3RydWN0b3IoKSB7fVxufVxuXG5jbGFzcyBUeXBlIHtcblxuICBjb25zdHJ1Y3Rvcih0eXBlLCBvYmpQYXR0ZXJuID0ge30pIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMub2JqUGF0dGVybiA9IG9ialBhdHRlcm47XG4gIH1cbn1cblxuY2xhc3MgQm91bmQge1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhcmlhYmxlKG5hbWUgPSBudWxsKSB7XG4gIHJldHVybiBuZXcgVmFyaWFibGUobmFtZSk7XG59XG5cbmZ1bmN0aW9uIHdpbGRjYXJkKCkge1xuICByZXR1cm4gbmV3IFdpbGRjYXJkKCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0c1dpdGgocHJlZml4KSB7XG4gIHJldHVybiBuZXcgU3RhcnRzV2l0aChwcmVmaXgpO1xufVxuXG5mdW5jdGlvbiBjYXB0dXJlKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2FwdHVyZSh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGhlYWRUYWlsKCkge1xuICByZXR1cm4gbmV3IEhlYWRUYWlsKCk7XG59XG5cbmZ1bmN0aW9uIHR5cGUodHlwZSwgb2JqUGF0dGVybiA9IHt9KSB7XG4gIHJldHVybiBuZXcgVHlwZSh0eXBlLCBvYmpQYXR0ZXJuKTtcbn1cblxuZnVuY3Rpb24gYm91bmQodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBCb3VuZCh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGlzX251bWJlciQyKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc19zdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7XG59XG5cbmZ1bmN0aW9uIGlzX2Jvb2xlYW4kMih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XG59XG5cbmZ1bmN0aW9uIGlzX3N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3ltYm9sJztcbn1cblxuZnVuY3Rpb24gaXNfbnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzX3VuZGVmaW5lZCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJztcbn1cblxuZnVuY3Rpb24gaXNfZnVuY3Rpb24kMih2YWx1ZSkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSA9PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufVxuXG5mdW5jdGlvbiBpc192YXJpYWJsZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBWYXJpYWJsZTtcbn1cblxuZnVuY3Rpb24gaXNfd2lsZGNhcmQodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgV2lsZGNhcmQ7XG59XG5cbmZ1bmN0aW9uIGlzX2hlYWRUYWlsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEhlYWRUYWlsO1xufVxuXG5mdW5jdGlvbiBpc19jYXB0dXJlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIENhcHR1cmU7XG59XG5cbmZ1bmN0aW9uIGlzX3R5cGUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgVHlwZTtcbn1cblxuZnVuY3Rpb24gaXNfc3RhcnRzV2l0aCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBTdGFydHNXaXRoO1xufVxuXG5mdW5jdGlvbiBpc19ib3VuZCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBCb3VuZDtcbn1cblxuZnVuY3Rpb24gaXNfb2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnO1xufVxuXG5mdW5jdGlvbiBpc19hcnJheSh2YWx1ZSkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG5cbnZhciBDaGVja3MgPSB7XG4gIGlzX251bWJlcjogaXNfbnVtYmVyJDIsXG4gIGlzX3N0cmluZyxcbiAgaXNfYm9vbGVhbjogaXNfYm9vbGVhbiQyLFxuICBpc19zeW1ib2wsXG4gIGlzX251bGwsXG4gIGlzX3VuZGVmaW5lZCxcbiAgaXNfZnVuY3Rpb246IGlzX2Z1bmN0aW9uJDIsXG4gIGlzX3ZhcmlhYmxlLFxuICBpc193aWxkY2FyZCxcbiAgaXNfaGVhZFRhaWwsXG4gIGlzX2NhcHR1cmUsXG4gIGlzX3R5cGUsXG4gIGlzX3N0YXJ0c1dpdGgsXG4gIGlzX2JvdW5kLFxuICBpc19vYmplY3QsXG4gIGlzX2FycmF5XG59O1xuXG5mdW5jdGlvbiByZXNvbHZlU3ltYm9sKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfc3ltYm9sKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0cmluZyhwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX3N0cmluZyh2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVOdW1iZXIocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19udW1iZXIodmFsdWUpICYmIHZhbHVlID09PSBwYXR0ZXJuO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlQm9vbGVhbihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX2Jvb2xlYW4odmFsdWUpICYmIHZhbHVlID09PSBwYXR0ZXJuO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlRnVuY3Rpb24ocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19mdW5jdGlvbih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVOdWxsKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfbnVsbCh2YWx1ZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVCb3VuZChwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSB0eXBlb2YgcGF0dGVybi52YWx1ZSAmJiB2YWx1ZSA9PT0gcGF0dGVybi52YWx1ZSkge1xuICAgICAgYXJncy5wdXNoKHZhbHVlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVdpbGRjYXJkKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlVmFyaWFibGUoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlSGVhZFRhaWwoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAoIUNoZWNrcy5pc19hcnJheSh2YWx1ZSkgfHwgdmFsdWUubGVuZ3RoIDwgMikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWQgPSB2YWx1ZVswXTtcbiAgICBjb25zdCB0YWlsID0gdmFsdWUuc2xpY2UoMSk7XG5cbiAgICBhcmdzLnB1c2goaGVhZCk7XG4gICAgYXJncy5wdXNoKHRhaWwpO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVDYXB0dXJlKHBhdHRlcm4pIHtcbiAgY29uc3QgbWF0Y2hlcyA9IGJ1aWxkTWF0Y2gocGF0dGVybi52YWx1ZSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmIChtYXRjaGVzKHZhbHVlLCBhcmdzKSkge1xuICAgICAgYXJncy5wdXNoKHZhbHVlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0YXJ0c1dpdGgocGF0dGVybikge1xuICBjb25zdCBwcmVmaXggPSBwYXR0ZXJuLnByZWZpeDtcblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKENoZWNrcy5pc19zdHJpbmcodmFsdWUpICYmIHZhbHVlLnN0YXJ0c1dpdGgocHJlZml4KSkge1xuICAgICAgYXJncy5wdXNoKHZhbHVlLnN1YnN0cmluZyhwcmVmaXgubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVUeXBlKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHBhdHRlcm4udHlwZSkge1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IGJ1aWxkTWF0Y2gocGF0dGVybi5vYmpQYXR0ZXJuKTtcbiAgICAgIHJldHVybiBtYXRjaGVzKHZhbHVlLCBhcmdzKSAmJiBhcmdzLnB1c2godmFsdWUpID4gMDtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVBcnJheShwYXR0ZXJuKSB7XG4gIGNvbnN0IG1hdGNoZXMgPSBwYXR0ZXJuLm1hcCh4ID0+IGJ1aWxkTWF0Y2goeCkpO1xuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAoIUNoZWNrcy5pc19hcnJheSh2YWx1ZSkgfHwgdmFsdWUubGVuZ3RoICE9IHBhdHRlcm4ubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlLmV2ZXJ5KGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlc1tpXSh2YWx1ZVtpXSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVPYmplY3QocGF0dGVybikge1xuICBsZXQgbWF0Y2hlcyA9IHt9O1xuXG4gIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhwYXR0ZXJuKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhwYXR0ZXJuKSkpIHtcbiAgICBtYXRjaGVzW2tleV0gPSBidWlsZE1hdGNoKHBhdHRlcm5ba2V5XSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKCFDaGVja3MuaXNfb2JqZWN0KHZhbHVlKSB8fCBwYXR0ZXJuLmxlbmd0aCA+IHZhbHVlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhwYXR0ZXJuKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhwYXR0ZXJuKSkpIHtcbiAgICAgIGlmICghKGtleSBpbiB2YWx1ZSkgfHwgIW1hdGNoZXNba2V5XSh2YWx1ZVtrZXldLCBhcmdzKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVOb01hdGNoKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxudmFyIFJlc29sdmVycyA9IHtcbiAgcmVzb2x2ZUJvdW5kLFxuICByZXNvbHZlV2lsZGNhcmQsXG4gIHJlc29sdmVWYXJpYWJsZSxcbiAgcmVzb2x2ZUhlYWRUYWlsLFxuICByZXNvbHZlQ2FwdHVyZSxcbiAgcmVzb2x2ZVN0YXJ0c1dpdGgsXG4gIHJlc29sdmVUeXBlLFxuICByZXNvbHZlQXJyYXksXG4gIHJlc29sdmVPYmplY3QsXG4gIHJlc29sdmVOb01hdGNoLFxuICByZXNvbHZlU3ltYm9sLFxuICByZXNvbHZlU3RyaW5nLFxuICByZXNvbHZlTnVtYmVyLFxuICByZXNvbHZlQm9vbGVhbixcbiAgcmVzb2x2ZUZ1bmN0aW9uLFxuICByZXNvbHZlTnVsbFxufTtcblxuZnVuY3Rpb24gYnVpbGRNYXRjaChwYXR0ZXJuKSB7XG5cbiAgaWYgKENoZWNrcy5pc192YXJpYWJsZShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVZhcmlhYmxlKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc193aWxkY2FyZChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVdpbGRjYXJkKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc191bmRlZmluZWQocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVXaWxkY2FyZChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfaGVhZFRhaWwocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVIZWFkVGFpbChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfc3RhcnRzV2l0aChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVN0YXJ0c1dpdGgocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2NhcHR1cmUocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVDYXB0dXJlKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19ib3VuZChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUJvdW5kKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc190eXBlKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlVHlwZShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfYXJyYXkocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVBcnJheShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfbnVtYmVyKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlTnVtYmVyKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19zdHJpbmcocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVTdHJpbmcocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2Jvb2xlYW4ocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVCb29sZWFuKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19zeW1ib2wocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVTeW1ib2wocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX251bGwocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVOdWxsKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19vYmplY3QocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVPYmplY3QocGF0dGVybik7XG4gIH1cblxuICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVOb01hdGNoKCk7XG59XG5cbmNsYXNzIE1hdGNoRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGFyZykge1xuICAgIHN1cGVyKCk7XG5cbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9ICdObyBtYXRjaCBmb3I6ICcgKyBhcmcudG9TdHJpbmcoKTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgbGV0IG1hcHBlZFZhbHVlcyA9IGFyZy5tYXAoeCA9PiB4LnRvU3RyaW5nKCkpO1xuICAgICAgdGhpcy5tZXNzYWdlID0gJ05vIG1hdGNoIGZvcjogJyArIG1hcHBlZFZhbHVlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tZXNzYWdlID0gJ05vIG1hdGNoIGZvcjogJyArIGFyZztcbiAgICB9XG5cbiAgICB0aGlzLnN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgdGhpcy5uYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICB9XG59XG5cbmNsYXNzIENhc2Uge1xuXG4gIGNvbnN0cnVjdG9yKHBhdHRlcm4sIGZuLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgICB0aGlzLnBhdHRlcm4gPSBidWlsZE1hdGNoKHBhdHRlcm4pO1xuICAgIHRoaXMuZm4gPSBmbjtcbiAgICB0aGlzLmd1YXJkID0gZ3VhcmQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZV9jYXNlKHBhdHRlcm4sIGZuLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgcmV0dXJuIG5ldyBDYXNlKHBhdHRlcm4sIGZuLCBndWFyZCk7XG59XG5cbmZ1bmN0aW9uIGRlZm1hdGNoKC4uLmNhc2VzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGZvciAobGV0IHByb2Nlc3NlZENhc2Ugb2YgY2FzZXMpIHtcbiAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgIGlmIChwcm9jZXNzZWRDYXNlLnBhdHRlcm4oYXJncywgcmVzdWx0KSAmJiBwcm9jZXNzZWRDYXNlLmd1YXJkLmFwcGx5KHRoaXMsIHJlc3VsdCkpIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NlZENhc2UuZm4uYXBwbHkodGhpcywgcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgTWF0Y2hFcnJvcihhcmdzKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWF0Y2gocGF0dGVybiwgZXhwciwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIGxldCByZXN1bHQgPSBbXTtcbiAgbGV0IHByb2Nlc3NlZFBhdHRlcm4gPSBidWlsZE1hdGNoKHBhdHRlcm4pO1xuICBpZiAocHJvY2Vzc2VkUGF0dGVybihleHByLCByZXN1bHQpICYmIGd1YXJkLmFwcGx5KHRoaXMsIHJlc3VsdCkpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBNYXRjaEVycm9yKGV4cHIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoX25vX3Rocm93KHBhdHRlcm4sIGV4cHIsIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICB0cnkge1xuICAgIHJldHVybiBtYXRjaChwYXR0ZXJuLCBleHByLCBndWFyZCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRocm93IGU7XG4gIH1cbn1cblxudmFyIFBhdHRlcm5zID0ge1xuICBkZWZtYXRjaCwgbWF0Y2gsIE1hdGNoRXJyb3IsIG1hdGNoX25vX3Rocm93LFxuICB2YXJpYWJsZSwgd2lsZGNhcmQsIHN0YXJ0c1dpdGgsXG4gIGNhcHR1cmUsIGhlYWRUYWlsLCB0eXBlLCBib3VuZCwgQ2FzZSwgbWFrZV9jYXNlXG59O1xuXG5mdW5jdGlvbiBjYWxsX3Byb3BlcnR5KGl0ZW0sIHByb3BlcnR5KSB7XG4gIGlmIChwcm9wZXJ0eSBpbiBpdGVtKSB7XG4gICAgaXRlbVtwcm9wZXJ0eV07XG4gICAgaWYgKGl0ZW1bcHJvcGVydHldIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BlcnR5XSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaXRlbVtwcm9wZXJ0eV07XG4gICAgfVxuICB9IGVsc2UgaWYgKFN5bWJvbC5mb3IocHJvcGVydHkpIGluIGl0ZW0pIHtcbiAgICBsZXQgcHJvcCA9IFN5bWJvbC5mb3IocHJvcGVydHkpO1xuICAgIGlmIChpdGVtW3Byb3BdIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BdKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BdO1xuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihgUHJvcGVydHkgJHsgcHJvcGVydHkgfSBub3QgZm91bmQgaW4gJHsgaXRlbSB9YCk7XG59XG5cbmZ1bmN0aW9uIGlzX2luc3RhbmNlX29mKHZhbHVlLCB0eXBlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIHR5cGU7XG59XG5cbmZ1bmN0aW9uIHNpemUkMih0ZXJtKSB7XG4gIHJldHVybiB0ZXJtLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gaXNfbmlsJDEoeCkge1xuICByZXR1cm4geCA9PT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNfYXRvbSQxKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnc3ltYm9sJztcbn1cblxuZnVuY3Rpb24gaXNfYmluYXJ5JDEoeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdzdHJpbmcnIHx8IHggaW5zdGFuY2VvZiBTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGlzX2Jvb2xlYW4kMSh4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Jvb2xlYW4nIHx8IHggaW5zdGFuY2VvZiBCb29sZWFuO1xufVxuXG5mdW5jdGlvbiBpc19mdW5jdGlvbiQxKHgsIGFyaXR5ID0gLTEpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8IHggaW5zdGFuY2VvZiBGdW5jdGlvbjtcbn1cblxuZnVuY3Rpb24gaXNfZmxvYXQkMSh4KSB7XG4gIHJldHVybiBpc19udW1iZXIkMSh4KSAmJiAhTnVtYmVyLmlzSW50ZWdlcih4KTtcbn1cblxuZnVuY3Rpb24gaXNfaW50ZWdlciQxKHgpIHtcbiAgcmV0dXJuIE51bWJlci5pc0ludGVnZXIoeCk7XG59XG5cbmZ1bmN0aW9uIGlzX2xpc3QkMSh4KSB7XG4gIHJldHVybiB4IGluc3RhbmNlb2YgQXJyYXk7XG59XG5cbmZ1bmN0aW9uIGlzX21hcCQxKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyB8fCB4IGluc3RhbmNlb2YgT2JqZWN0O1xufVxuXG5mdW5jdGlvbiBpc19udW1iZXIkMSh4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzX3R1cGxlJDEoeCkge1xuICByZXR1cm4geCBpbnN0YW5jZW9mIFR1cGxlJDE7XG59XG5cbmZ1bmN0aW9uIGlzX3BpZCQxKHgpIHtcbiAgcmV0dXJuIHggaW5zdGFuY2VvZiBQSUQ7XG59XG5cbmZ1bmN0aW9uIGlzX3BvcnQkMSh4KSB7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNfcmVmZXJlbmNlJDEoeCkge1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzX2JpdHN0cmluZyQxKHgpIHtcbiAgcmV0dXJuIGlzX2JpbmFyeSQxKHgpIHx8IHggaW5zdGFuY2VvZiBCaXRTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGFkZChvbmUsIHR3bykge1xuICByZXR1cm4gb25lICsgdHdvO1xufVxuXG5mdW5jdGlvbiBzdWJ0cmFjdChvbmUsIHR3bykge1xuICByZXR1cm4gb25lICsgdHdvO1xufVxuXG5mdW5jdGlvbiBtdWx0aXBseShvbmUsIHR3bykge1xuICByZXR1cm4gb25lICsgdHdvO1xufVxuXG5mdW5jdGlvbiBkaXZpZGUob25lLCB0d28pIHtcbiAgcmV0dXJuIG9uZSArIHR3bztcbn1cblxuZnVuY3Rpb24gcmVtYWluZGVyKG9uZSwgdHdvKSB7XG4gIHJldHVybiBvbmUgKyB0d287XG59XG5cbmZ1bmN0aW9uIGFwcGx5JDEoLi4uYXJncykge1xuICBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICBhcmdzWzBdLmFwcGx5KG51bGwsIGFyZ3Muc2xpY2UoMSkpO1xuICB9IGVsc2Uge1xuICAgIGFyZ3NbMF1bYXJnc1sxXV0uYXBwbHkobnVsbCwgYXJncy5zbGljZSgyKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbmV3X3R1cGxlKC4uLmFyZ3MpIHtcbiAgcmV0dXJuIG5ldyBUdXBsZSQxKC4uLmFyZ3MpO1xufVxuXG5mdW5jdGlvbiBkdXBsaWNhdGUoZGF0YSwgc2l6ZSkge1xuICBsZXQgYXJyYXkgPSBbXTtcblxuICBmb3IgKHZhciBpID0gc2l6ZSAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgYXJyYXkucHVzaChkYXRhKTtcbiAgfVxuXG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY29udGFpbnMobGVmdCwgcmlnaHQpIHtcbiAgZm9yIChsZXQgeCBvZiByaWdodCkge1xuICAgIGlmIChQYXR0ZXJucy5tYXRjaF9ub190aHJvdyhsZWZ0LCB4KSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJldmVyc2UobGlzdCkge1xuICByZXR1cm4gbGlzdC5jb25jYXQoW10pLnJldmVyc2UoKTtcbn1cblxuZnVuY3Rpb24gZ2V0X2dsb2JhbCgpIHtcbiAgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBzZWxmO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIHdpbmRvdztcbiAgfSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBnbG9iYWw7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdsb2JhbCBzdGF0ZSBmb3VuZCcpO1xufVxuXG5mdW5jdGlvbiBjb25jYXRfbGlzdHMobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQuY29uY2F0KHJpZ2h0KTtcbn1cblxuZnVuY3Rpb24gcHJlcGVuZF90b19saXN0KGxpc3QsIGl0ZW0pIHtcbiAgcmV0dXJuIFtpdGVtXS5jb25jYXQobGlzdCk7XG59XG5cbmZ1bmN0aW9uIGRlZnN0cnVjdChkZWZhdWx0cykge1xuICByZXR1cm4gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKHVwZGF0ZSA9IHt9KSB7XG4gICAgICBsZXQgdGhlX3ZhbHVlcyA9IE9iamVjdC5hc3NpZ24oZGVmYXVsdHMsIHVwZGF0ZSk7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHRoZV92YWx1ZXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGUodXBkYXRlcyA9IHt9KSB7XG4gICAgICBsZXQgeCA9IG5ldyB0aGlzKHVwZGF0ZXMpO1xuICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWZleGNlcHRpb24oZGVmYXVsdHMpIHtcbiAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKHVwZGF0ZSA9IHt9KSB7XG4gICAgICBsZXQgbWVzc2FnZSA9IHVwZGF0ZS5tZXNzYWdlIHx8ICcnO1xuICAgICAgc3VwZXIobWVzc2FnZSk7XG5cbiAgICAgIGxldCB0aGVfdmFsdWVzID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgdXBkYXRlKTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgdGhlX3ZhbHVlcyk7XG5cbiAgICAgIHRoaXMubmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB0aGlzW1NwZWNpYWxGb3Jtcy5hdG9tKCdfX2V4Y2VwdGlvbl9fJyldID0gdHJ1ZTtcbiAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IubmFtZSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZSh1cGRhdGVzID0ge30pIHtcbiAgICAgIGxldCB4ID0gbmV3IHRoaXModXBkYXRlcyk7XG4gICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh4KTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlZnByb3RvY29sKHNwZWMpIHtcbiAgcmV0dXJuIG5ldyBQcm90b2NvbChzcGVjKTtcbn1cblxuZnVuY3Rpb24gZGVmaW1wbChwcm90b2NvbCwgdHlwZSwgaW1wbCkge1xuICBwcm90b2NvbC5pbXBsZW1lbnRhdGlvbih0eXBlLCBpbXBsKTtcbn1cblxuZnVuY3Rpb24gZ2V0X29iamVjdF9rZXlzKG9iaikge1xuICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmopKTtcbn1cblxuZnVuY3Rpb24gaXNfdmFsaWRfY2hhcmFjdGVyKGNvZGVwb2ludCkge1xuICB0cnkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludChjb2RlcG9pbnQpICE9IG51bGw7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLy9odHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjU29sdXRpb25fMl8lRTIlODAlOTNfcmV3cml0ZV90aGVfRE9Nc19hdG9iKClfYW5kX2J0b2EoKV91c2luZ19KYXZhU2NyaXB0J3NfVHlwZWRBcnJheXNfYW5kX1VURi04XG5mdW5jdGlvbiBiNjRFbmNvZGVVbmljb2RlKHN0cikge1xuICByZXR1cm4gYnRvYShlbmNvZGVVUklDb21wb25lbnQoc3RyKS5yZXBsYWNlKC8lKFswLTlBLUZdezJ9KS9nLCBmdW5jdGlvbiAobWF0Y2gsIHAxKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoJzB4JyArIHAxKTtcbiAgfSkpO1xufVxuXG52YXIgRnVuY3Rpb25zID0ge1xuICBjYWxsX3Byb3BlcnR5LFxuICBpc19pbnN0YW5jZV9vZixcbiAgc2l6ZTogc2l6ZSQyLFxuICBpc19uaWw6IGlzX25pbCQxLFxuICBpc19hdG9tOiBpc19hdG9tJDEsXG4gIGlzX2JpbmFyeTogaXNfYmluYXJ5JDEsXG4gIGlzX2Jvb2xlYW46IGlzX2Jvb2xlYW4kMSxcbiAgaXNfZnVuY3Rpb246IGlzX2Z1bmN0aW9uJDEsXG4gIGlzX2Zsb2F0OiBpc19mbG9hdCQxLFxuICBpc19pbnRlZ2VyOiBpc19pbnRlZ2VyJDEsXG4gIGlzX2xpc3Q6IGlzX2xpc3QkMSxcbiAgaXNfbWFwOiBpc19tYXAkMSxcbiAgaXNfbnVtYmVyOiBpc19udW1iZXIkMSxcbiAgaXNfdHVwbGU6IGlzX3R1cGxlJDEsXG4gIGlzX3BpZDogaXNfcGlkJDEsXG4gIGlzX3BvcnQ6IGlzX3BvcnQkMSxcbiAgaXNfcmVmZXJlbmNlOiBpc19yZWZlcmVuY2UkMSxcbiAgaXNfYml0c3RyaW5nOiBpc19iaXRzdHJpbmckMSxcbiAgYWRkLFxuICBzdWJ0cmFjdCxcbiAgbXVsdGlwbHksXG4gIGRpdmlkZSxcbiAgcmVtYWluZGVyLFxuICBhcHBseTogYXBwbHkkMSxcbiAgbmV3X3R1cGxlLFxuICBkdXBsaWNhdGUsXG4gIGNvbnRhaW5zLFxuICByZXZlcnNlLFxuICBnZXRfZ2xvYmFsLFxuICBjb25jYXRfbGlzdHMsXG4gIHByZXBlbmRfdG9fbGlzdCxcbiAgZGVmc3RydWN0LFxuICBkZWZleGNlcHRpb24sXG4gIGRlZnByb3RvY29sLFxuICBkZWZpbXBsLFxuICBnZXRfb2JqZWN0X2tleXMsXG4gIGlzX3ZhbGlkX2NoYXJhY3RlcixcbiAgYjY0RW5jb2RlVW5pY29kZVxufTtcblxuZnVuY3Rpb24gbGlzdCguLi5hcmdzKSB7XG4gIHJldHVybiBPYmplY3QuZnJlZXplKGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBiaXRzdHJpbmcoLi4uYXJncykge1xuICByZXR1cm4gbmV3IEJpdFN0cmluZyguLi5hcmdzKTtcbn1cblxuZnVuY3Rpb24gdHVwbGUoLi4uYXJncykge1xuICByZXR1cm4gbmV3IFR1cGxlKC4uLmFyZ3MpO1xufVxuXG5mdW5jdGlvbiBfY2FzZShjb25kaXRpb24sIGNsYXVzZXMpIHtcbiAgcmV0dXJuIFBhdHRlcm5zLmRlZm1hdGNoKC4uLmNsYXVzZXMpKGNvbmRpdGlvbik7XG59XG5cbmZ1bmN0aW9uIGNvbmQoY2xhdXNlcykge1xuICBmb3IgKGxldCBjbGF1c2Ugb2YgY2xhdXNlcykge1xuICAgIGlmIChjbGF1c2VbMF0pIHtcbiAgICAgIHJldHVybiBjbGF1c2VbMV0oKTtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoKTtcbn1cblxuZnVuY3Rpb24gbWFwJDEob2JqKSB7XG4gIHJldHVybiBPYmplY3QuZnJlZXplKG9iaik7XG59XG5cbmZ1bmN0aW9uIG1hcF91cGRhdGUobWFwLCB2YWx1ZXMpIHtcbiAgcmV0dXJuIE9iamVjdC5mcmVlemUoT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG1hcC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpLCBtYXAsIHZhbHVlcykpO1xufVxuXG5mdW5jdGlvbiBfZm9yKGNvbGxlY3Rpb25zLCBmdW4sIGZpbHRlciA9ICgpID0+IHRydWUsIGludG8gPSBbXSwgcHJldmlvdXNWYWx1ZXMgPSBbXSkge1xuICBsZXQgcGF0dGVybiA9IGNvbGxlY3Rpb25zWzBdWzBdO1xuICBsZXQgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zWzBdWzFdO1xuXG4gIGlmIChjb2xsZWN0aW9ucy5sZW5ndGggPT09IDEpIHtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgbGV0IHIgPSBQYXR0ZXJucy5tYXRjaF9ub190aHJvdyhwYXR0ZXJuLCBlbGVtKTtcbiAgICAgIGxldCBhcmdzID0gcHJldmlvdXNWYWx1ZXMuY29uY2F0KHIpO1xuXG4gICAgICBpZiAociAmJiBmaWx0ZXIuYXBwbHkodGhpcywgYXJncykpIHtcbiAgICAgICAgaW50byA9IEVudW0uaW50byhbZnVuLmFwcGx5KHRoaXMsIGFyZ3MpXSwgaW50byk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGludG87XG4gIH0gZWxzZSB7XG4gICAgbGV0IF9pbnRvID0gW107XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGxldCByID0gUGF0dGVybnMubWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZWxlbSk7XG4gICAgICBpZiAocikge1xuICAgICAgICBfaW50byA9IEVudW0uaW50byh0aGlzLl9mb3IoY29sbGVjdGlvbnMuc2xpY2UoMSksIGZ1biwgZmlsdGVyLCBfaW50bywgcHJldmlvdXNWYWx1ZXMuY29uY2F0KHIpKSwgaW50byk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIF9pbnRvO1xuICB9XG59XG5cbmZ1bmN0aW9uIF90cnkoZG9fZnVuLCByZXNjdWVfZnVuY3Rpb24sIGNhdGNoX2Z1biwgZWxzZV9mdW5jdGlvbiwgYWZ0ZXJfZnVuY3Rpb24pIHtcbiAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgdHJ5IHtcbiAgICByZXN1bHQgPSBkb19mdW4oKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxldCBleF9yZXN1bHQgPSBudWxsO1xuXG4gICAgaWYgKHJlc2N1ZV9mdW5jdGlvbikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZXhfcmVzdWx0ID0gcmVzY3VlX2Z1bmN0aW9uKGUpO1xuICAgICAgICByZXR1cm4gZXhfcmVzdWx0O1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgaWYgKGV4IGluc3RhbmNlb2YgUGF0dGVybnMuTWF0Y2hFcnJvcikge1xuICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNhdGNoX2Z1bikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZXhfcmVzdWx0ID0gY2F0Y2hfZnVuKGUpO1xuICAgICAgICByZXR1cm4gZXhfcmVzdWx0O1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgaWYgKGV4IGluc3RhbmNlb2YgUGF0dGVybnMuTWF0Y2hFcnJvcikge1xuICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgZTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoYWZ0ZXJfZnVuY3Rpb24pIHtcbiAgICAgIGFmdGVyX2Z1bmN0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVsc2VfZnVuY3Rpb24pIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGVsc2VfZnVuY3Rpb24ocmVzdWx0KTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgaWYgKGV4IGluc3RhbmNlb2YgUGF0dGVybnMuTWF0Y2hFcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIE1hdGNoIEZvdW5kIGluIEVsc2UnKTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZXg7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxudmFyIFNwZWNpYWxGb3JtcyQxID0ge1xuICBsaXN0LFxuICBiaXRzdHJpbmcsXG4gIHR1cGxlLFxuICBfY2FzZSxcbiAgY29uZCxcbiAgbWFwOiBtYXAkMSxcbiAgbWFwX3VwZGF0ZSxcbiAgX2ZvcixcbiAgX3RyeVxufTtcblxuRnVuY3Rpb25zLmdldF9nbG9iYWwoKS5wcm9jZXNzZXMgPSBGdW5jdGlvbnMuZ2V0X2dsb2JhbCgpLnByb2Nlc3NlcyB8fCBuZXcgUHJvY2Vzc1N5c3RlbSgpO1xuXG5cblxudmFyIEMgPSBPYmplY3QuZnJlZXplKHtcblx0UHJvY2Vzc1N5c3RlbTogUHJvY2Vzc1N5c3RlbSxcblx0VHVwbGU6IFR1cGxlJDEsXG5cdFBJRDogUElELFxuXHRCaXRTdHJpbmc6IEJpdFN0cmluZyxcblx0UGF0dGVybnM6IFBhdHRlcm5zLFxuXHRJbnRlZ2VyOiBJbnRlZ2VyLFxuXHRGbG9hdDogRmxvYXQsXG5cdEZ1bmN0aW9uczogRnVuY3Rpb25zLFxuXHRMaXN0OiBMaXN0JDEsXG5cdFNwZWNpYWxGb3JtczogU3BlY2lhbEZvcm1zJDFcbn0pO1xuXG5mdW5jdGlvbiB0bChsaXN0KSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5saXN0KC4uLmxpc3Quc2xpY2UoMSkpO1xufVxuXG5mdW5jdGlvbiBoZChsaXN0KSB7XG4gIHJldHVybiBsaXN0WzBdO1xufVxuXG5mdW5jdGlvbiBpc19uaWwoeCkge1xuICByZXR1cm4geCA9PT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNfYXRvbSh4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N5bWJvbCc7XG59XG5cbmZ1bmN0aW9uIGlzX2JpbmFyeSh4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N0cmluZycgfHwgeCBpbnN0YW5jZW9mIFN0cmluZztcbn1cblxuZnVuY3Rpb24gaXNfYm9vbGVhbih4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Jvb2xlYW4nIHx8IHggaW5zdGFuY2VvZiBCb29sZWFuO1xufVxuXG5mdW5jdGlvbiBpc19mdW5jdGlvbih4LCBhcml0eSA9IC0xKSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJyB8fCB4IGluc3RhbmNlb2YgRnVuY3Rpb247XG59XG5cbmZ1bmN0aW9uIGlzX2Zsb2F0KHgpIHtcbiAgcmV0dXJuIGlzX251bWJlcih4KSAmJiAhTnVtYmVyLmlzSW50ZWdlcih4KTtcbn1cblxuZnVuY3Rpb24gaXNfaW50ZWdlcih4KSB7XG4gIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKHgpO1xufVxuXG5mdW5jdGlvbiBpc19saXN0KHgpIHtcbiAgcmV0dXJuIHggaW5zdGFuY2VvZiBBcnJheTtcbn1cblxuZnVuY3Rpb24gaXNfbWFwKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyB8fCB4IGluc3RhbmNlb2YgT2JqZWN0O1xufVxuXG5mdW5jdGlvbiBpc19udW1iZXIoeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc190dXBsZSh4KSB7XG4gIHJldHVybiB4IGluc3RhbmNlb2YgVHVwbGUkMTtcbn1cblxuZnVuY3Rpb24gbGVuZ3RoKHgpIHtcbiAgcmV0dXJuIHgubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBpc19waWQoeCkge1xuICByZXR1cm4geCBpbnN0YW5jZW9mIFBJRDtcbn1cblxuZnVuY3Rpb24gaXNfcG9ydCh4KSB7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNfcmVmZXJlbmNlKHgpIHtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc19iaXRzdHJpbmcoeCkge1xuICByZXR1cm4gaXNfYmluYXJ5KHgpIHx8IHggaW5zdGFuY2VvZiBCaXRTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIF9faW5fXyhsZWZ0LCByaWdodCkge1xuICBmb3IgKGxldCB4IG9mIHJpZ2h0KSB7XG4gICAgaWYgKG1hdGNoX19xbWFya19fKGxlZnQsIHgpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFicyhudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGguYWJzKG51bWJlcik7XG59XG5cbmZ1bmN0aW9uIHJvdW5kKG51bWJlcikge1xuICByZXR1cm4gTWF0aC5yb3VuZChudW1iZXIpO1xufVxuXG5mdW5jdGlvbiBlbGVtKHR1cGxlLCBpbmRleCkge1xuICBpZiAoaXNfbGlzdCh0dXBsZSkpIHtcbiAgICByZXR1cm4gdHVwbGVbaW5kZXhdO1xuICB9XG5cbiAgcmV0dXJuIHR1cGxlLmdldChpbmRleCk7XG59XG5cbmZ1bmN0aW9uIHJlbShsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCAlIHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBkaXYobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgLyByaWdodDtcbn1cblxuZnVuY3Rpb24gYW5kKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0ICYmIHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBvcihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCB8fCByaWdodDtcbn1cblxuZnVuY3Rpb24gbm90KGFyZykge1xuICByZXR1cm4gIWFyZztcbn1cblxuZnVuY3Rpb24gYXBwbHkoLi4uYXJncykge1xuICBpZiAoYXJncy5sZW5ndGggPT09IDMpIHtcbiAgICBsZXQgbW9kID0gYXJnc1swXTtcbiAgICBsZXQgZnVuYyA9IGFyZ3NbMV07XG4gICAgbGV0IGZ1bmNfYXJncyA9IGFyZ3NbMl07XG4gICAgcmV0dXJuIG1vZFtmdW5jXS5hcHBseShudWxsLCBmdW5jX2FyZ3MpO1xuICB9IGVsc2Uge1xuICAgIGxldCBmdW5jID0gYXJnc1swXTtcbiAgICBsZXQgZnVuY19hcmdzID0gYXJnc1sxXTtcblxuICAgIHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGZ1bmNfYXJncyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9fc3RyaW5nKGFyZykge1xuICBpZiAoaXNfdHVwbGUoYXJnKSkge1xuICAgIHJldHVybiBhcmcudG9TdHJpbmcoKTtcbiAgfVxuXG4gIHJldHVybiBhcmcudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hfX3FtYXJrX18ocGF0dGVybiwgZXhwciwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIHJldHVybiBQYXR0ZXJucy5tYXRjaF9ub190aHJvdyhwYXR0ZXJuLCBleHByLCBndWFyZCkgIT0gbnVsbDtcbn1cblxudmFyIEtlcm5lbCA9IHtcbiAgdGwsXG4gIGhkLFxuICBpc19uaWwsXG4gIGlzX2F0b20sXG4gIGlzX2JpbmFyeSxcbiAgaXNfYm9vbGVhbixcbiAgaXNfZnVuY3Rpb24sXG4gIGlzX2Zsb2F0LFxuICBpc19pbnRlZ2VyLFxuICBpc19saXN0LFxuICBpc19tYXAsXG4gIGlzX251bWJlcixcbiAgaXNfdHVwbGUsXG4gIGxlbmd0aCxcbiAgaXNfcGlkLFxuICBpc19wb3J0LFxuICBpc19yZWZlcmVuY2UsXG4gIGlzX2JpdHN0cmluZyxcbiAgaW46IF9faW5fXyxcbiAgYWJzLFxuICByb3VuZCxcbiAgZWxlbSxcbiAgcmVtLFxuICBkaXYsXG4gIGFuZCxcbiAgb3IsXG4gIG5vdCxcbiAgYXBwbHksXG4gIHRvX3N0cmluZyxcbiAgbWF0Y2hfX3FtYXJrX19cbn07XG5cbmxldCBFbnVtJDEgPSB7XG5cbiAgYWxsX19xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuID0geCA9PiB4KSB7XG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoIWZ1bihlbGVtKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgYW55X19xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuID0geCA9PiB4KSB7XG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBhdDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4sIHRoZV9kZWZhdWx0ID0gbnVsbCkge1xuICAgIGlmIChuID4gdGhpcy5jb3VudChjb2xsZWN0aW9uKSB8fCBuIDwgMCkge1xuICAgICAgcmV0dXJuIHRoZV9kZWZhdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uW25dO1xuICB9LFxuXG4gIGNvbmNhdDogZnVuY3Rpb24gKC4uLmVudW1hYmxlcykge1xuICAgIHJldHVybiBlbnVtYWJsZXNbMF0uY29uY2F0KGVudW1hYmxlc1sxXSk7XG4gIH0sXG5cbiAgY291bnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4gPSBudWxsKSB7XG4gICAgaWYgKGZ1biA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbi5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uLmZpbHRlcihmdW4pLmxlbmd0aDtcbiAgICB9XG4gIH0sXG5cbiAgZHJvcDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvdW50KSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoY291bnQpO1xuICB9LFxuXG4gIGRyb3Bfd2hpbGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIGNvdW50ID0gY291bnQgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoY291bnQpO1xuICB9LFxuXG4gIGVhY2g6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGZ1bihlbGVtKTtcbiAgICB9XG4gIH0sXG5cbiAgZW1wdHlfX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24ubGVuZ3RoID09PSAwO1xuICB9LFxuXG4gIGZldGNoOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbikge1xuICAgIGlmIChLZXJuZWwuaXNfbGlzdChjb2xsZWN0aW9uKSkge1xuICAgICAgaWYgKG4gPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pICYmIG4gPj0gMCkge1xuICAgICAgICByZXR1cm4gbmV3IFR1cGxlJDEoU3ltYm9sLmZvcignb2snKSwgY29sbGVjdGlvbltuXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gU3ltYm9sLmZvcignZXJyb3InKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvbGxlY3Rpb24gaXMgbm90IGFuIEVudW1lcmFibGUnKTtcbiAgfSxcblxuICBmZXRjaF9fZW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4pIHtcbiAgICBpZiAoS2VybmVsLmlzX2xpc3QoY29sbGVjdGlvbikpIHtcbiAgICAgIGlmIChuIDwgdGhpcy5jb3VudChjb2xsZWN0aW9uKSAmJiBuID49IDApIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25bbl07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ291dCBvZiBib3VuZHMgZXJyb3InKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvbGxlY3Rpb24gaXMgbm90IGFuIEVudW1lcmFibGUnKTtcbiAgfSxcblxuICBmaWx0ZXI6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChmdW4oZWxlbSkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goZWxlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBmaWx0ZXJfbWFwOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZmlsdGVyLCBtYXBwZXIpIHtcbiAgICByZXR1cm4gRW51bSQxLm1hcChFbnVtJDEuZmlsdGVyKGNvbGxlY3Rpb24sIGZpbHRlciksIG1hcHBlcik7XG4gIH0sXG5cbiAgZmluZDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGlmX25vbmUgPSBudWxsLCBmdW4pIHtcbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChmdW4oZWxlbSkpIHtcbiAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGlmX25vbmU7XG4gIH0sXG5cbiAgaW50bzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGxpc3QpIHtcbiAgICByZXR1cm4gbGlzdC5jb25jYXQoY29sbGVjdGlvbik7XG4gIH0sXG5cbiAgbWFwOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICByZXN1bHQucHVzaChmdW4oZWxlbSkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgbWFwX3JlZHVjZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGFjYywgZnVuKSB7XG4gICAgbGV0IG1hcHBlZCA9IExpc3QkMSgpO1xuICAgIGxldCB0aGVfYWNjID0gYWNjO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pOyBpKyspIHtcbiAgICAgIGxldCB0dXBsZSA9IGZ1bihjb2xsZWN0aW9uW2ldLCB0aGVfYWNjKTtcblxuICAgICAgdGhlX2FjYyA9IHR1cGxlLmdldCgxKTtcbiAgICAgIG1hcHBlZCA9IExpc3QkMSguLi5tYXBwZWQuY29uY2F0KFt0dXBsZS5nZXQoMCldKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBUdXBsZSQxKG1hcHBlZCwgdGhlX2FjYyk7XG4gIH0sXG5cbiAgbWVtYmVyX19xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgdmFsdWUpIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5pbmNsdWRlcyh2YWx1ZSk7XG4gIH0sXG5cbiAgcmVkdWNlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgYWNjLCBmdW4pIHtcbiAgICBsZXQgdGhlX2FjYyA9IGFjYztcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudChjb2xsZWN0aW9uKTsgaSsrKSB7XG4gICAgICBsZXQgdHVwbGUgPSBmdW4oY29sbGVjdGlvbltpXSwgdGhlX2FjYyk7XG5cbiAgICAgIHRoZV9hY2MgPSB0dXBsZS5nZXQoMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoZV9hY2M7XG4gIH0sXG5cbiAgdGFrZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvdW50KSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoMCwgY291bnQpO1xuICB9LFxuXG4gIHRha2VfZXZlcnk6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBudGgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGluZGV4ICUgbnRoID09PSAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGVsZW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBMaXN0JDEoLi4ucmVzdWx0KTtcbiAgfSxcblxuICB0YWtlX3doaWxlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgbGV0IGNvdW50ID0gMDtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICBjb3VudCA9IGNvdW50ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uLnNsaWNlKDAsIGNvdW50KTtcbiAgfSxcblxuICB0b19saXN0OiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG59O1xuXG5sZXQgTGlzdCA9IHt9O1xuXG5MaXN0LmRlbGV0ZSA9IGZ1bmN0aW9uIChsaXN0LCBpdGVtKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcbiAgbGV0IHZhbHVlX2ZvdW5kID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgeCBvZiBsaXN0KSB7XG4gICAgaWYgKHggPT09IGl0ZW0gJiYgdmFsdWVfZm91bmQgIT09IGZhbHNlKSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh4KTtcbiAgICAgIHZhbHVlX2ZvdW5kID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHggIT09IGl0ZW0pIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKHgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmRlbGV0ZV9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgIT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC5kdXBsaWNhdGUgPSBmdW5jdGlvbiAoZWxlbSwgbikge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICBuZXdfdmFsdWUucHVzaChlbGVtKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmZpcnN0ID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIGxpc3RbMF07XG59O1xuXG5MaXN0LmZsYXR0ZW4gPSBmdW5jdGlvbiAobGlzdCwgdGFpbCA9IFNwZWNpYWxGb3JtcyQxLmxpc3QoKSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgeCBvZiBsaXN0KSB7XG4gICAgaWYgKEtlcm5lbC5pc19saXN0KHgpKSB7XG4gICAgICBuZXdfdmFsdWUgPSBuZXdfdmFsdWUuY29uY2F0KExpc3QuZmxhdHRlbih4KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKHgpO1xuICAgIH1cbiAgfVxuXG4gIG5ld192YWx1ZSA9IG5ld192YWx1ZS5jb25jYXQodGFpbCk7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3JtcyQxLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QuZm9sZGwgPSBmdW5jdGlvbiAobGlzdCwgYWNjLCBmdW5jKSB7XG4gIHJldHVybiBsaXN0LnJlZHVjZShmdW5jLCBhY2MpO1xufTtcblxuTGlzdC5mb2xkciA9IGZ1bmN0aW9uIChsaXN0LCBhY2MsIGZ1bmMpIHtcbiAgbGV0IG5ld19hY2MgPSBhY2M7XG5cbiAgZm9yICh2YXIgaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBuZXdfYWNjID0gZnVuYyhsaXN0W2ldLCBuZXdfYWNjKTtcbiAgfVxuXG4gIHJldHVybiBuZXdfYWNjO1xufTtcblxuTGlzdC5pbnNlcnRfYXQgPSBmdW5jdGlvbiAobGlzdCwgaW5kZXgsIHZhbHVlKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaSA9PT0gaW5kZXgpIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKHZhbHVlKTtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGxpc3RbaV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC5rZXlkZWxldGUgPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbikge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIUtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgbmV3X2xpc3QucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0LmtleWZpbmQgPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbiwgX2RlZmF1bHQgPSBudWxsKSB7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgcmV0dXJuIGxpc3RbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIF9kZWZhdWx0O1xufTtcblxuTGlzdC5rZXltZW1iZXJfX3FtYXJrX18gPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbikge1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbkxpc3Qua2V5cmVwbGFjZSA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uLCBuZXdfdHVwbGUpIHtcbiAgbGV0IG5ld19saXN0ID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIG5ld19saXN0LnB1c2gobGlzdFtpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld19saXN0LnB1c2gobmV3X3R1cGxlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0LmtleXNvcnQgPSBmdW5jdGlvbiAobGlzdCwgcG9zaXRpb24pIHtcbiAgbGV0IG5ld19saXN0ID0gbGlzdDtcblxuICBuZXdfbGlzdC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKHBvc2l0aW9uID09PSAwKSB7XG4gICAgICBpZiAoYVtwb3NpdGlvbl0udmFsdWUgPCBiW3Bvc2l0aW9uXS52YWx1ZSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG5cbiAgICAgIGlmIChhW3Bvc2l0aW9uXS52YWx1ZSA+IGJbcG9zaXRpb25dLnZhbHVlKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGFbcG9zaXRpb25dIDwgYltwb3NpdGlvbl0pIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuXG4gICAgICBpZiAoYVtwb3NpdGlvbl0gPiBiW3Bvc2l0aW9uXSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0LmtleXN0b3JlID0gZnVuY3Rpb24gKGxpc3QsIGtleSwgcG9zaXRpb24sIG5ld190dXBsZSkge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcbiAgbGV0IHJlcGxhY2VkID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIG5ld19saXN0LnB1c2gobGlzdFtpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld19saXN0LnB1c2gobmV3X3R1cGxlKTtcbiAgICAgIHJlcGxhY2VkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXJlcGxhY2VkKSB7XG4gICAgbmV3X2xpc3QucHVzaChuZXdfdHVwbGUpO1xuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3JtcyQxLmxpc3QoLi4ubmV3X2xpc3QpO1xufTtcblxuTGlzdC5sYXN0ID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIGxpc3RbbGlzdC5sZW5ndGggLSAxXTtcbn07XG5cbkxpc3QucmVwbGFjZV9hdCA9IGZ1bmN0aW9uIChsaXN0LCBpbmRleCwgdmFsdWUpIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpID09PSBpbmRleCkge1xuICAgICAgbmV3X3ZhbHVlLnB1c2godmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC51cGRhdGVfYXQgPSBmdW5jdGlvbiAobGlzdCwgaW5kZXgsIGZ1bikge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0LmNvdW50KCk7IGkrKykge1xuICAgIGlmIChpID09PSBpbmRleCkge1xuICAgICAgbmV3X3ZhbHVlLnB1c2goZnVuKGxpc3QuZ2V0KGkpKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGxpc3QuZ2V0KGkpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3X3ZhbHVlO1xufTtcblxuTGlzdC53cmFwID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgaWYgKEtlcm5lbC5pc19saXN0KGxpc3QpKSB7XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH0gZWxzZSBpZiAobGlzdCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFNwZWNpYWxGb3JtcyQxLmxpc3QoKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubGlzdChsaXN0KTtcbiAgfVxufTtcblxuTGlzdC56aXAgPSBmdW5jdGlvbiAobGlzdF9vZl9saXN0cykge1xuICBpZiAobGlzdF9vZl9saXN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubGlzdCgpO1xuICB9XG5cbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuICBsZXQgc21hbGxlc3RfbGVuZ3RoID0gbGlzdF9vZl9saXN0c1swXTtcblxuICBmb3IgKGxldCB4IG9mIGxpc3Rfb2ZfbGlzdHMpIHtcbiAgICBpZiAoeC5sZW5ndGggPCBzbWFsbGVzdF9sZW5ndGgpIHtcbiAgICAgIHNtYWxsZXN0X2xlbmd0aCA9IHgubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc21hbGxlc3RfbGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY3VycmVudF92YWx1ZSA9IFtdO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbGlzdF9vZl9saXN0cy5sZW5ndGg7IGorKykge1xuICAgICAgY3VycmVudF92YWx1ZS5wdXNoKGxpc3Rfb2ZfbGlzdHNbal1baV0pO1xuICAgIH1cblxuICAgIG5ld192YWx1ZS5wdXNoKG5ldyBUdXBsZSQxKC4uLmN1cnJlbnRfdmFsdWUpKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LnRvX3R1cGxlID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIG5ldyBUdXBsZSQxKC4uLmxpc3QpO1xufTtcblxuTGlzdC5hcHBlbmQgPSBmdW5jdGlvbiAobGlzdCwgdmFsdWUpIHtcbiAgcmV0dXJuIFNwZWNpYWxGb3JtcyQxLmxpc3QoLi4ubGlzdC5jb25jYXQoW3ZhbHVlXSkpO1xufTtcblxuTGlzdC5wcmVwZW5kID0gZnVuY3Rpb24gKGxpc3QsIHZhbHVlKSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5saXN0KC4uLlt2YWx1ZV0uY29uY2F0KGxpc3QpKTtcbn07XG5cbkxpc3QuY29uY2F0ID0gZnVuY3Rpb24gKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0LmNvbmNhdChyaWdodCk7XG59O1xuXG5sZXQgS2V5d29yZCA9IHt9O1xuXG5LZXl3b3JkLmhhc19rZXlfX3FtYXJrX18gPSBmdW5jdGlvbiAoa2V5d29yZHMsIGtleSkge1xuICBmb3IgKGxldCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XG4gICAgaWYgKEtlcm5lbC5lbGVtKGtleXdvcmQsIDApID09IGtleSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuS2V5d29yZC5nZXQgPSBmdW5jdGlvbiAoa2V5d29yZHMsIGtleSwgdGhlX2RlZmF1bHQgPSBudWxsKSB7XG4gIGZvciAobGV0IGtleXdvcmQgb2Yga2V5d29yZHMpIHtcbiAgICBpZiAoS2VybmVsLmVsZW0oa2V5d29yZCwgMCkgPT0ga2V5KSB7XG4gICAgICByZXR1cm4gS2VybmVsLmVsZW0oa2V5d29yZCwgMSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoZV9kZWZhdWx0O1xufTtcblxuZnVuY3Rpb24gYm5vdChleHByKSB7XG4gIHJldHVybiB+ZXhwcjtcbn1cblxuZnVuY3Rpb24gYmFuZChsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCAmIHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBib3IobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgfCByaWdodDtcbn1cblxuZnVuY3Rpb24gYnNsKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0IDw8IHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBic3IobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgPj4gcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGJ4b3IobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgXiByaWdodDtcbn1cblxudmFyIGJpdHdpc2UgPSB7XG4gIGJub3QsXG4gIGJhbmQsXG4gIGJvcixcbiAgYnNsLFxuICBic3IsXG4gIGJ4b3Jcbn07XG5cbmZ1bmN0aW9uIF9fbmV3X18oKSB7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5tYXAoe30pO1xufVxuXG5mdW5jdGlvbiBrZXlzKG1hcCkge1xuICByZXR1cm4gRnVuY3Rpb25zLmdldF9vYmplY3Rfa2V5cyhtYXApO1xufVxuXG5mdW5jdGlvbiBzaXplKG1hcCkge1xuICByZXR1cm4ga2V5cyhtYXApLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gdG9fbGlzdChtYXApIHtcbiAgbGV0IG1hcF9rZXlzID0ga2V5cyhtYXApO1xuICBsZXQgbGlzdCA9IFtdO1xuXG4gIGZvciAobGV0IGtleSBvZiBtYXBfa2V5cykge1xuICAgIGxpc3QucHVzaChuZXcgVHVwbGUkMShrZXksIG1hcFtrZXldKSk7XG4gIH1cblxuICByZXR1cm4gTGlzdCQxKC4uLmxpc3QpO1xufVxuXG5mdW5jdGlvbiB2YWx1ZXMobWFwKSB7XG4gIGxldCBtYXBfa2V5cyA9IGtleXMobWFwKTtcbiAgbGV0IGxpc3QgPSBbXTtcblxuICBmb3IgKGxldCBrZXkgb2YgbWFwX2tleXMpIHtcbiAgICBsaXN0LnB1c2gobWFwW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIExpc3QkMSguLi5saXN0KTtcbn1cblxuZnVuY3Rpb24gZnJvbV9zdHJ1Y3Qoc3RydWN0KSB7XG4gIGxldCBtYXAgPSBPYmplY3QuYXNzaWduKHt9LCBzdHJ1Y3QpO1xuICBkZWxldGUgbWFwW1N5bWJvbC5mb3IoXCJfX3N0cnVjdF9fXCIpXTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubWFwKG1hcCk7XG59XG5cbmZ1bmN0aW9uIF9fZGVsZXRlX18obWFwLCBrZXkpIHtcbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuXG4gIGRlbGV0ZSBuZXdfbWFwW2tleV07XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3JtcyQxLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gZXF1YWxfX3FtYXJrX18obWFwMSwgbWFwMikge1xuICByZXR1cm4gbWFwMSA9PT0gbWFwMjtcbn1cblxuZnVuY3Rpb24gZmV0Y2hfX2VtYXJrX18obWFwLCBrZXkpIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwW2tleV07XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJLZXkgbm90IGZvdW5kLlwiKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2gobWFwLCBrZXkpIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbmV3IFR1cGxlJDEoU3ltYm9sLmZvcihcIm9rXCIpLCBtYXBba2V5XSk7XG4gIH1cblxuICByZXR1cm4gU3ltYm9sLmZvcihcImVycm9yXCIpO1xufVxuXG5mdW5jdGlvbiBoYXNfa2V5X19xbWFya19fKG1hcCwga2V5KSB7XG4gIHJldHVybiBrZXkgaW4gbWFwO1xufVxuXG5mdW5jdGlvbiBzcGxpdChtYXAsIGtleXMpIHtcbiAgbGV0IHNwbGl0MSA9IHt9O1xuICBsZXQgc3BsaXQyID0ge307XG5cbiAgZm9yIChsZXQga2V5IG9mIEZ1bmN0aW9ucy5nZXRfb2JqZWN0X2tleXMobWFwKSkge1xuICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA+IC0xKSB7XG4gICAgICBzcGxpdDFba2V5XSA9IG1hcFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcGxpdDJba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgVHVwbGUkMShTcGVjaWFsRm9ybXMkMS5tYXAoc3BsaXQxKSwgU3BlY2lhbEZvcm1zJDEubWFwKHNwbGl0MikpO1xufVxuXG5mdW5jdGlvbiB0YWtlKG1hcCwga2V5cykge1xuICBsZXQgc3BsaXQxID0ge307XG5cbiAgZm9yIChsZXQga2V5IG9mIEZ1bmN0aW9ucy5nZXRfb2JqZWN0X2tleXMobWFwKSkge1xuICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA+IC0xKSB7XG4gICAgICBzcGxpdDFba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5tYXAoc3BsaXQxKTtcbn1cblxuZnVuY3Rpb24gZHJvcChtYXAsIGtleXMpIHtcbiAgbGV0IHNwbGl0MSA9IHt9O1xuXG4gIGZvciAobGV0IGtleSBvZiBGdW5jdGlvbnMuZ2V0X29iamVjdF9rZXlzKG1hcCkpIHtcbiAgICBpZiAoa2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSB7XG4gICAgICBzcGxpdDFba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5tYXAoc3BsaXQxKTtcbn1cblxuZnVuY3Rpb24gcHV0X25ldyhtYXAsIGtleSwgdmFsdWUpIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSB2YWx1ZTtcblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBwdXRfbmV3X2xhenkobWFwLCBrZXksIGZ1bikge1xuICBpZiAoa2V5IGluIG1hcCkge1xuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG4gIG5ld19tYXBba2V5XSA9IGZ1bigpO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIGdldF9hbmRfdXBkYXRlKG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKGtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSBmdW4obWFwW2tleV0pO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHBvcF9sYXp5KG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKCFrZXkgaW4gbWFwKSB7XG4gICAgcmV0dXJuIG5ldyBUdXBsZSQxKGZ1bigpLCBtYXApO1xuICB9XG5cbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICBsZXQgdmFsdWUgPSBmdW4obmV3X21hcFtrZXldKTtcbiAgZGVsZXRlIG5ld19tYXBba2V5XTtcblxuICByZXR1cm4gbmV3IFR1cGxlJDEodmFsdWUsIG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBwb3AobWFwLCBrZXksIF9kZWZhdWx0ID0gbnVsbCkge1xuICBpZiAoIWtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gbmV3IFR1cGxlJDEoX2RlZmF1bHQsIG1hcCk7XG4gIH1cblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG4gIGxldCB2YWx1ZSA9IG5ld19tYXBba2V5XTtcbiAgZGVsZXRlIG5ld19tYXBba2V5XTtcblxuICByZXR1cm4gbmV3IFR1cGxlJDEodmFsdWUsIG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBnZXRfbGF6eShtYXAsIGtleSwgZnVuKSB7XG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIHJldHVybiBmdW4oKTtcbiAgfVxuXG4gIHJldHVybiBmdW4obWFwW2tleV0pO1xufVxuXG5mdW5jdGlvbiBnZXQobWFwLCBrZXksIF9kZWZhdWx0ID0gbnVsbCkge1xuICBpZiAoIWtleSBpbiBtYXApIHtcbiAgICByZXR1cm4gX2RlZmF1bHQ7XG4gIH1cblxuICByZXR1cm4gbWFwW2tleV07XG59XG5cbmZ1bmN0aW9uIHB1dChtYXAsIGtleSwgdmFsKSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0KHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSB2YWw7XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3JtcyQxLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlX19lbWFya19fKG1hcCwga2V5LCBmdW4pIHtcbiAgaWYgKCFrZXkgaW4gbWFwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2V5IG5vdCBmb3VuZFwiKTtcbiAgfVxuXG4gIGxldCBuZXdfbWFwID0gT2JqZWN0KHt9LCBtYXApO1xuICBuZXdfbWFwW2tleV0gPSBmdW4obWFwW2tleV0pO1xuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZShtYXAsIGtleSwgaW5pdGlhbCwgZnVuKSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0KHt9LCBtYXApO1xuXG4gIGlmICgha2V5IGluIG1hcCkge1xuICAgIG5ld19tYXBba2V5XSA9IGluaXRpYWw7XG4gIH0gZWxzZSB7XG4gICAgbmV3X21hcFtrZXldID0gZnVuKG1hcFtrZXldKTtcbiAgfVxuXG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5tYXAobmV3X21hcCk7XG59XG5cbnZhciBtYXAgPSB7XG4gIG5ldzogX19uZXdfXyxcbiAga2V5cyxcbiAgc2l6ZSxcbiAgdG9fbGlzdCxcbiAgdmFsdWVzLFxuICBmcm9tX3N0cnVjdCxcbiAgZGVsZXRlOiBfX2RlbGV0ZV9fLFxuICBkcm9wLFxuICBlcXVhbF9fcW1hcmtfXyxcbiAgZmV0Y2hfX2VtYXJrX18sXG4gIGZldGNoLFxuICBoYXNfa2V5X19xbWFya19fLFxuICBzcGxpdCxcbiAgdGFrZSxcbiAgcHV0X25ldyxcbiAgcHV0X25ld19sYXp5LFxuICBnZXRfYW5kX3VwZGF0ZSxcbiAgcG9wX2xhenksXG4gIHBvcCxcbiAgZ2V0X2xhenksXG4gIGdldCxcbiAgcHV0LFxuICB1cGRhdGVfX2VtYXJrX18sXG4gIHVwZGF0ZVxufTtcblxuZnVuY3Rpb24gX19uZXdfXyQxKCkge1xuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubWFwKHsgW1N5bWJvbC5mb3IoJ19fc3RydWN0X18nKV06IFN5bWJvbC5mb3IoJ01hcFNldCcpLCBzZXQ6IExpc3QkMSgpIH0pO1xufVxuXG5mdW5jdGlvbiBzaXplJDEobWFwKSB7XG4gIHJldHVybiBtYXAuc2V0Lmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gdG9fbGlzdCQxKG1hcCkge1xuICByZXR1cm4gbWFwLnNldDtcbn1cblxuZnVuY3Rpb24gX19kZWxldGVfXyQxKHNldCwgdGVybSkge1xuICBsZXQgbmV3X2xpc3QgPSBMaXN0LmRlbGV0ZShzZXQuc2V0LCB0ZXJtKTtcblxuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIHNldCk7XG4gIG5ld19tYXAuc2V0ID0gbmV3X2xpc3Q7XG4gIHJldHVybiBTcGVjaWFsRm9ybXMkMS5tYXAobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIHB1dCQxKHNldCwgdGVybSkge1xuICBpZiAoc2V0LnNldC5pbmRleE9mKHRlcm0pID09PSAtMSkge1xuICAgIGxldCBuZXdfbGlzdCA9IExpc3QuYXBwZW5kKHNldC5zZXQsIHRlcm0pO1xuXG4gICAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBzZXQpO1xuICAgIG5ld19tYXAuc2V0ID0gbmV3X2xpc3Q7XG4gICAgcmV0dXJuIFNwZWNpYWxGb3JtcyQxLm1hcChuZXdfbWFwKTtcbiAgfVxuXG4gIHJldHVybiBzZXQ7XG59XG5cbmZ1bmN0aW9uIGRpZmZlcmVuY2Uoc2V0MSwgc2V0Mikge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIHNldDEpO1xuXG4gIGZvciAobGV0IHZhbCBvZiBzZXQxLnNldCkge1xuICAgIGlmIChtZW1iZXJfX3FtYXJrX18oc2V0MiwgdmFsKSkge1xuICAgICAgbmV3X21hcC5zZXQgPSBMaXN0LmRlbGV0ZShuZXdfbWFwLnNldCwgdmFsKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBpbnRlcnNlY3Rpb24oc2V0MSwgc2V0Mikge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIHNldDEpO1xuXG4gIGZvciAobGV0IHZhbCBvZiBzZXQxLnNldCkge1xuICAgIGlmICghbWVtYmVyX19xbWFya19fKHNldDIsIHZhbCkpIHtcbiAgICAgIG5ld19tYXAuc2V0ID0gTGlzdC5kZWxldGUobmV3X21hcC5zZXQsIHZhbCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFNwZWNpYWxGb3JtcyQxLm1hcChuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gdW5pb24oc2V0MSwgc2V0Mikge1xuICBsZXQgbmV3X21hcCA9IHNldDE7XG5cbiAgZm9yIChsZXQgdmFsIG9mIHNldDIuc2V0KSB7XG4gICAgbmV3X21hcCA9IHB1dCQxKG5ld19tYXAsIHZhbCk7XG4gIH1cblxuICByZXR1cm4gU3BlY2lhbEZvcm1zJDEubWFwKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBkaXNqb2luX19xbWFya19fKHNldDEsIHNldDIpIHtcbiAgZm9yIChsZXQgdmFsIG9mIHNldDEuc2V0KSB7XG4gICAgaWYgKG1lbWJlcl9fcW1hcmtfXyhzZXQyLCB2YWwpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG1lbWJlcl9fcW1hcmtfXyhzZXQsIHZhbHVlKSB7XG4gIHJldHVybiBzZXQuc2V0LmluZGV4T2YodmFsdWUpID49IDA7XG59XG5cbmZ1bmN0aW9uIGVxdWFsX19xbWFya19fJDEoc2V0MSwgc2V0Mikge1xuICByZXR1cm4gc2V0MS5zZXQgPT09IHNldDIuc2V0O1xufVxuXG5mdW5jdGlvbiBzdWJzZXRfX3FtYXJrX18oc2V0MSwgc2V0Mikge1xuICBmb3IgKGxldCB2YWwgb2Ygc2V0MS5zZXQpIHtcbiAgICBpZiAoIW1lbWJlcl9fcW1hcmtfXyhzZXQyLCB2YWwpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbnZhciBtYXBfc2V0ID0ge1xuICBuZXc6IF9fbmV3X18kMSxcbiAgc2l6ZTogc2l6ZSQxLFxuICB0b19saXN0OiB0b19saXN0JDEsXG4gIGRpc2pvaW5fX3FtYXJrX18sXG4gIGRlbGV0ZTogX19kZWxldGVfXyQxLFxuICBzdWJzZXRfX3FtYXJrX18sXG4gIGVxdWFsX19xbWFya19fOiBlcXVhbF9fcW1hcmtfXyQxLFxuICBtZW1iZXJfX3FtYXJrX18sXG4gIHB1dDogcHV0JDEsXG4gIHVuaW9uLFxuICBpbnRlcnNlY3Rpb24sXG4gIGRpZmZlcmVuY2Vcbn07XG5cbmxldCBWaXJ0dWFsRE9NID0gKGZ1bmN0aW9uIChlKSB7XG4gICAgcmV0dXJuIGUoKTtcbn0pKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGVmaW5lLCBtb2R1bGUsIGV4cG9ydHM7XG4gICAgcmV0dXJuIChmdW5jdGlvbiBlKHQsIG4sIHIpIHtcbiAgICAgICAgZnVuY3Rpb24gcyhvLCB1KSB7XG4gICAgICAgICAgICBpZiAoIW5bb10pIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRbb10pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSB0eXBlb2YgcmVxdWlyZSA9PSBcImZ1bmN0aW9uXCIgJiYgcmVxdWlyZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF1ICYmIGEpIHJldHVybiBhKG8sICEwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkpIHJldHVybiBpKG8sICEwKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGYgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbyArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgKGYuY29kZSA9IFwiTU9EVUxFX05PVF9GT1VORFwiLCBmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGwgPSBuW29dID0ge1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzOiB7fVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdFtvXVswXS5jYWxsKGwuZXhwb3J0cywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSB0W29dWzFdW2VdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcyhuID8gbiA6IGUpO1xuICAgICAgICAgICAgICAgIH0sIGwsIGwuZXhwb3J0cywgZSwgdCwgbiwgcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbltvXS5leHBvcnRzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpID0gdHlwZW9mIHJlcXVpcmUgPT0gXCJmdW5jdGlvblwiICYmIHJlcXVpcmU7XG4gICAgICAgIGZvciAodmFyIG8gPSAwOyBvIDwgci5sZW5ndGg7IG8rKykgcyhyW29dKTtcbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfSkoe1xuICAgICAgICAxOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuXG4gICAgICAgICAgICB2YXIgY3JlYXRlRWxlbWVudCA9IHJlcXVpcmUoXCIuL3Zkb20vY3JlYXRlLWVsZW1lbnQuanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gY3JlYXRlRWxlbWVudDtcbiAgICAgICAgfSwgeyBcIi4vdmRvbS9jcmVhdGUtZWxlbWVudC5qc1wiOiAxNSB9XSwgMjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBkaWZmID0gcmVxdWlyZShcIi4vdnRyZWUvZGlmZi5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkaWZmO1xuICAgICAgICB9LCB7IFwiLi92dHJlZS9kaWZmLmpzXCI6IDM1IH1dLCAzOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGggPSByZXF1aXJlKFwiLi92aXJ0dWFsLWh5cGVyc2NyaXB0L2luZGV4LmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGg7XG4gICAgICAgIH0sIHsgXCIuL3ZpcnR1YWwtaHlwZXJzY3JpcHQvaW5kZXguanNcIjogMjIgfV0sIDQ6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgZGlmZiA9IHJlcXVpcmUoXCIuL2RpZmYuanNcIik7XG4gICAgICAgICAgICB2YXIgcGF0Y2ggPSByZXF1aXJlKFwiLi9wYXRjaC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBoID0gcmVxdWlyZShcIi4vaC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBjcmVhdGUgPSByZXF1aXJlKFwiLi9jcmVhdGUtZWxlbWVudC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBWTm9kZSA9IHJlcXVpcmUoXCIuL3Zub2RlL3Zub2RlLmpzXCIpO1xuICAgICAgICAgICAgdmFyIFZUZXh0ID0gcmVxdWlyZShcIi4vdm5vZGUvdnRleHQuanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgICAgIGRpZmY6IGRpZmYsXG4gICAgICAgICAgICAgICAgcGF0Y2g6IHBhdGNoLFxuICAgICAgICAgICAgICAgIGg6IGgsXG4gICAgICAgICAgICAgICAgY3JlYXRlOiBjcmVhdGUsXG4gICAgICAgICAgICAgICAgVk5vZGU6IFZOb2RlLFxuICAgICAgICAgICAgICAgIFZUZXh0OiBWVGV4dFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSwgeyBcIi4vY3JlYXRlLWVsZW1lbnQuanNcIjogMSwgXCIuL2RpZmYuanNcIjogMiwgXCIuL2guanNcIjogMywgXCIuL3BhdGNoLmpzXCI6IDEzLCBcIi4vdm5vZGUvdm5vZGUuanNcIjogMzEsIFwiLi92bm9kZS92dGV4dC5qc1wiOiAzMyB9XSwgNTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIC8qIVxuICAgICAgICAgICAgICogQ3Jvc3MtQnJvd3NlciBTcGxpdCAxLjEuMVxuICAgICAgICAgICAgICogQ29weXJpZ2h0IDIwMDctMjAxMiBTdGV2ZW4gTGV2aXRoYW4gPHN0ZXZlbmxldml0aGFuLmNvbT5cbiAgICAgICAgICAgICAqIEF2YWlsYWJsZSB1bmRlciB0aGUgTUlUIExpY2Vuc2VcbiAgICAgICAgICAgICAqIEVDTUFTY3JpcHQgY29tcGxpYW50LCB1bmlmb3JtIGNyb3NzLWJyb3dzZXIgc3BsaXQgbWV0aG9kXG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTcGxpdHMgYSBzdHJpbmcgaW50byBhbiBhcnJheSBvZiBzdHJpbmdzIHVzaW5nIGEgcmVnZXggb3Igc3RyaW5nIHNlcGFyYXRvci4gTWF0Y2hlcyBvZiB0aGVcbiAgICAgICAgICAgICAqIHNlcGFyYXRvciBhcmUgbm90IGluY2x1ZGVkIGluIHRoZSByZXN1bHQgYXJyYXkuIEhvd2V2ZXIsIGlmIGBzZXBhcmF0b3JgIGlzIGEgcmVnZXggdGhhdCBjb250YWluc1xuICAgICAgICAgICAgICogY2FwdHVyaW5nIGdyb3VwcywgYmFja3JlZmVyZW5jZXMgYXJlIHNwbGljZWQgaW50byB0aGUgcmVzdWx0IGVhY2ggdGltZSBgc2VwYXJhdG9yYCBpcyBtYXRjaGVkLlxuICAgICAgICAgICAgICogRml4ZXMgYnJvd3NlciBidWdzIGNvbXBhcmVkIHRvIHRoZSBuYXRpdmUgYFN0cmluZy5wcm90b3R5cGUuc3BsaXRgIGFuZCBjYW4gYmUgdXNlZCByZWxpYWJseVxuICAgICAgICAgICAgICogY3Jvc3MtYnJvd3Nlci5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgU3RyaW5nIHRvIHNwbGl0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtSZWdFeHB8U3RyaW5nfSBzZXBhcmF0b3IgUmVnZXggb3Igc3RyaW5nIHRvIHVzZSBmb3Igc2VwYXJhdGluZyB0aGUgc3RyaW5nLlxuICAgICAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IFtsaW1pdF0gTWF4aW11bSBudW1iZXIgb2YgaXRlbXMgdG8gaW5jbHVkZSBpbiB0aGUgcmVzdWx0IGFycmF5LlxuICAgICAgICAgICAgICogQHJldHVybnMge0FycmF5fSBBcnJheSBvZiBzdWJzdHJpbmdzLlxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyBCYXNpYyB1c2VcbiAgICAgICAgICAgICAqIHNwbGl0KCdhIGIgYyBkJywgJyAnKTtcbiAgICAgICAgICAgICAqIC8vIC0+IFsnYScsICdiJywgJ2MnLCAnZCddXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLy8gV2l0aCBsaW1pdFxuICAgICAgICAgICAgICogc3BsaXQoJ2EgYiBjIGQnLCAnICcsIDIpO1xuICAgICAgICAgICAgICogLy8gLT4gWydhJywgJ2InXVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIEJhY2tyZWZlcmVuY2VzIGluIHJlc3VsdCBhcnJheVxuICAgICAgICAgICAgICogc3BsaXQoJy4ud29yZDEgd29yZDIuLicsIC8oW2Etel0rKShcXGQrKS9pKTtcbiAgICAgICAgICAgICAqIC8vIC0+IFsnLi4nLCAnd29yZCcsICcxJywgJyAnLCAnd29yZCcsICcyJywgJy4uJ11cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gc3BsaXQodW5kZWYpIHtcblxuICAgICAgICAgICAgICAgIHZhciBuYXRpdmVTcGxpdCA9IFN0cmluZy5wcm90b3R5cGUuc3BsaXQsXG4gICAgICAgICAgICAgICAgICAgIGNvbXBsaWFudEV4ZWNOcGNnID0gLygpPz8vLmV4ZWMoXCJcIilbMV0gPT09IHVuZGVmLFxuXG4gICAgICAgICAgICAgICAgLy8gTlBDRzogbm9ucGFydGljaXBhdGluZyBjYXB0dXJpbmcgZ3JvdXBcbiAgICAgICAgICAgICAgICBzZWxmO1xuXG4gICAgICAgICAgICAgICAgc2VsZiA9IGZ1bmN0aW9uIChzdHIsIHNlcGFyYXRvciwgbGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgYHNlcGFyYXRvcmAgaXMgbm90IGEgcmVnZXgsIHVzZSBgbmF0aXZlU3BsaXRgXG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc2VwYXJhdG9yKSAhPT0gXCJbb2JqZWN0IFJlZ0V4cF1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5hdGl2ZVNwbGl0LmNhbGwoc3RyLCBzZXBhcmF0b3IsIGxpbWl0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgb3V0cHV0ID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncyA9IChzZXBhcmF0b3IuaWdub3JlQ2FzZSA/IFwiaVwiIDogXCJcIikgKyAoc2VwYXJhdG9yLm11bHRpbGluZSA/IFwibVwiIDogXCJcIikgKyAoc2VwYXJhdG9yLmV4dGVuZGVkID8gXCJ4XCIgOiBcIlwiKSArIChzZXBhcmF0b3Iuc3RpY2t5ID8gXCJ5XCIgOiBcIlwiKSxcblxuICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZm94IDMrXG4gICAgICAgICAgICAgICAgICAgIGxhc3RMYXN0SW5kZXggPSAwLFxuXG4gICAgICAgICAgICAgICAgICAgIC8vIE1ha2UgYGdsb2JhbGAgYW5kIGF2b2lkIGBsYXN0SW5kZXhgIGlzc3VlcyBieSB3b3JraW5nIHdpdGggYSBjb3B5XG4gICAgICAgICAgICAgICAgICAgIHNlcGFyYXRvciA9IG5ldyBSZWdFeHAoc2VwYXJhdG9yLnNvdXJjZSwgZmxhZ3MgKyBcImdcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0b3IyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0TGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBzdHIgKz0gXCJcIjsgLy8gVHlwZS1jb252ZXJ0XG4gICAgICAgICAgICAgICAgICAgIGlmICghY29tcGxpYW50RXhlY05wY2cpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvZXNuJ3QgbmVlZCBmbGFncyBneSwgYnV0IHRoZXkgZG9uJ3QgaHVydFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdG9yMiA9IG5ldyBSZWdFeHAoXCJeXCIgKyBzZXBhcmF0b3Iuc291cmNlICsgXCIkKD8hXFxcXHMpXCIsIGZsYWdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvKiBWYWx1ZXMgZm9yIGBsaW1pdGAsIHBlciB0aGUgc3BlYzpcbiAgICAgICAgICAgICAgICAgICAgICogSWYgdW5kZWZpbmVkOiA0Mjk0OTY3Mjk1IC8vIE1hdGgucG93KDIsIDMyKSAtIDFcbiAgICAgICAgICAgICAgICAgICAgICogSWYgMCwgSW5maW5pdHksIG9yIE5hTjogMFxuICAgICAgICAgICAgICAgICAgICAgKiBJZiBwb3NpdGl2ZSBudW1iZXI6IGxpbWl0ID0gTWF0aC5mbG9vcihsaW1pdCk7IGlmIChsaW1pdCA+IDQyOTQ5NjcyOTUpIGxpbWl0IC09IDQyOTQ5NjcyOTY7XG4gICAgICAgICAgICAgICAgICAgICAqIElmIG5lZ2F0aXZlIG51bWJlcjogNDI5NDk2NzI5NiAtIE1hdGguZmxvb3IoTWF0aC5hYnMobGltaXQpKVxuICAgICAgICAgICAgICAgICAgICAgKiBJZiBvdGhlcjogVHlwZS1jb252ZXJ0LCB0aGVuIHVzZSB0aGUgYWJvdmUgcnVsZXNcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGxpbWl0ID0gbGltaXQgPT09IHVuZGVmID8gLTEgPj4+IDAgOiAvLyBNYXRoLnBvdygyLCAzMikgLSAxXG4gICAgICAgICAgICAgICAgICAgIGxpbWl0ID4+PiAwOyAvLyBUb1VpbnQzMihsaW1pdClcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG1hdGNoID0gc2VwYXJhdG9yLmV4ZWMoc3RyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYHNlcGFyYXRvci5sYXN0SW5kZXhgIGlzIG5vdCByZWxpYWJsZSBjcm9zcy1icm93c2VyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0SW5kZXggPiBsYXN0TGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goc3RyLnNsaWNlKGxhc3RMYXN0SW5kZXgsIG1hdGNoLmluZGV4KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRml4IGJyb3dzZXJzIHdob3NlIGBleGVjYCBtZXRob2RzIGRvbid0IGNvbnNpc3RlbnRseSByZXR1cm4gYHVuZGVmaW5lZGAgZm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm9ucGFydGljaXBhdGluZyBjYXB0dXJpbmcgZ3JvdXBzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjb21wbGlhbnRFeGVjTnBjZyAmJiBtYXRjaC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoWzBdLnJlcGxhY2Uoc2VwYXJhdG9yMiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoIC0gMjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1tpXSA9PT0gdW5kZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hbaV0gPSB1bmRlZjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2gubGVuZ3RoID4gMSAmJiBtYXRjaC5pbmRleCA8IHN0ci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkob3V0cHV0LCBtYXRjaC5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RMZW5ndGggPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdExhc3RJbmRleCA9IGxhc3RJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0Lmxlbmd0aCA+PSBsaW1pdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VwYXJhdG9yLmxhc3RJbmRleCA9PT0gbWF0Y2guaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0b3IubGFzdEluZGV4Kys7IC8vIEF2b2lkIGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdExhc3RJbmRleCA9PT0gc3RyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RMZW5ndGggfHwgIXNlcGFyYXRvci50ZXN0KFwiXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goXCJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChzdHIuc2xpY2UobGFzdExhc3RJbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXRwdXQubGVuZ3RoID4gbGltaXQgPyBvdXRwdXQuc2xpY2UoMCwgbGltaXQpIDogb3V0cHV0O1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0pKCk7XG4gICAgICAgIH0sIHt9XSwgNjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHt9LCB7fV0sIDc6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgdmFyIE9uZVZlcnNpb25Db25zdHJhaW50ID0gcmVxdWlyZShcImluZGl2aWR1YWwvb25lLXZlcnNpb25cIik7XG5cbiAgICAgICAgICAgIHZhciBNWV9WRVJTSU9OID0gXCI3XCI7XG4gICAgICAgICAgICBPbmVWZXJzaW9uQ29uc3RyYWludChcImV2LXN0b3JlXCIsIE1ZX1ZFUlNJT04pO1xuXG4gICAgICAgICAgICB2YXIgaGFzaEtleSA9IFwiX19FVl9TVE9SRV9LRVlAXCIgKyBNWV9WRVJTSU9OO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEV2U3RvcmU7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIEV2U3RvcmUoZWxlbSkge1xuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gZWxlbVtoYXNoS2V5XTtcblxuICAgICAgICAgICAgICAgIGlmICghaGFzaCkge1xuICAgICAgICAgICAgICAgICAgICBoYXNoID0gZWxlbVtoYXNoS2V5XSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBoYXNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiaW5kaXZpZHVhbC9vbmUtdmVyc2lvblwiOiA5IH1dLCA4OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgICAgIC8qZ2xvYmFsIHdpbmRvdywgZ2xvYmFsKi9cblxuICAgICAgICAgICAgICAgIHZhciByb290ID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB7fTtcblxuICAgICAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gSW5kaXZpZHVhbDtcblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIEluZGl2aWR1YWwoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5IGluIHJvb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByb290W2tleV07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByb290W2tleV0gPSB2YWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2FsbCh0aGlzLCB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KTtcbiAgICAgICAgfSwge31dLCA5OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgIHZhciBJbmRpdmlkdWFsID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gT25lVmVyc2lvbjtcblxuICAgICAgICAgICAgZnVuY3Rpb24gT25lVmVyc2lvbihtb2R1bGVOYW1lLCB2ZXJzaW9uLCBkZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gXCJfX0lORElWSURVQUxfT05FX1ZFUlNJT05fXCIgKyBtb2R1bGVOYW1lO1xuICAgICAgICAgICAgICAgIHZhciBlbmZvcmNlS2V5ID0ga2V5ICsgXCJfRU5GT1JDRV9TSU5HTEVUT05cIjtcblxuICAgICAgICAgICAgICAgIHZhciB2ZXJzaW9uVmFsdWUgPSBJbmRpdmlkdWFsKGVuZm9yY2VLZXksIHZlcnNpb24pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZlcnNpb25WYWx1ZSAhPT0gdmVyc2lvbikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4gb25seSBoYXZlIG9uZSBjb3B5IG9mIFwiICsgbW9kdWxlTmFtZSArIFwiLlxcblwiICsgXCJZb3UgYWxyZWFkeSBoYXZlIHZlcnNpb24gXCIgKyB2ZXJzaW9uVmFsdWUgKyBcIiBpbnN0YWxsZWQuXFxuXCIgKyBcIlRoaXMgbWVhbnMgeW91IGNhbm5vdCBpbnN0YWxsIHZlcnNpb24gXCIgKyB2ZXJzaW9uKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gSW5kaXZpZHVhbChrZXksIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuL2luZGV4LmpzXCI6IDggfV0sIDEwOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9wTGV2ZWwgPSB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9O1xuICAgICAgICAgICAgICAgIHZhciBtaW5Eb2MgPSByZXF1aXJlKFwibWluLWRvY3VtZW50XCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkb2NjeSA9IHRvcExldmVsW1wiX19HTE9CQUxfRE9DVU1FTlRfQ0FDSEVANFwiXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRvY2N5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2NjeSA9IHRvcExldmVsW1wiX19HTE9CQUxfRE9DVU1FTlRfQ0FDSEVANFwiXSA9IG1pbkRvYztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZG9jY3k7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2FsbCh0aGlzLCB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KTtcbiAgICAgICAgfSwgeyBcIm1pbi1kb2N1bWVudFwiOiA2IH1dLCAxMTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0KHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgeCAhPT0gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sIHt9XSwgMTI6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgbmF0aXZlSXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG4gICAgICAgICAgICB2YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IG5hdGl2ZUlzQXJyYXkgfHwgaXNBcnJheTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNBcnJheShvYmopIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHt9XSwgMTM6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgcGF0Y2ggPSByZXF1aXJlKFwiLi92ZG9tL3BhdGNoLmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHBhdGNoO1xuICAgICAgICB9LCB7IFwiLi92ZG9tL3BhdGNoLmpzXCI6IDE4IH1dLCAxNDogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBpc09iamVjdCA9IHJlcXVpcmUoXCJpcy1vYmplY3RcIik7XG4gICAgICAgICAgICB2YXIgaXNIb29rID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZob29rLmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFwcGx5UHJvcGVydGllcztcblxuICAgICAgICAgICAgZnVuY3Rpb24gYXBwbHlQcm9wZXJ0aWVzKG5vZGUsIHByb3BzLCBwcmV2aW91cykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9wVmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVQcm9wZXJ0eShub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlLCBwcmV2aW91cyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNIb29rKHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVByb3BlcnR5KG5vZGUsIHByb3BOYW1lLCBwcm9wVmFsdWUsIHByZXZpb3VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wVmFsdWUuaG9vaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BWYWx1ZS5ob29rKG5vZGUsIHByb3BOYW1lLCBwcmV2aW91cyA/IHByZXZpb3VzW3Byb3BOYW1lXSA6IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QocHJvcFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoT2JqZWN0KG5vZGUsIHByb3BzLCBwcmV2aW91cywgcHJvcE5hbWUsIHByb3BWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gcHJvcFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZW1vdmVQcm9wZXJ0eShub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlLCBwcmV2aW91cykge1xuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91cykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IHByZXZpb3VzW3Byb3BOYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzSG9vayhwcmV2aW91c1ZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BOYW1lID09PSBcImF0dHJpYnV0ZXNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGF0dHJOYW1lIGluIHByZXZpb3VzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcE5hbWUgPT09IFwic3R5bGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcHJldmlvdXNWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlW2ldID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcmV2aW91c1ZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJldmlvdXNWYWx1ZS51bmhvb2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzVmFsdWUudW5ob29rKG5vZGUsIHByb3BOYW1lLCBwcm9wVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBwYXRjaE9iamVjdChub2RlLCBwcm9wcywgcHJldmlvdXMsIHByb3BOYW1lLCBwcm9wVmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IHByZXZpb3VzID8gcHJldmlvdXNbcHJvcE5hbWVdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgLy8gU2V0IGF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBpZiAocHJvcE5hbWUgPT09IFwiYXR0cmlidXRlc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGF0dHJOYW1lIGluIHByb3BWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IHByb3BWYWx1ZVthdHRyTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRyVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzVmFsdWUgJiYgaXNPYmplY3QocHJldmlvdXNWYWx1ZSkgJiYgZ2V0UHJvdG90eXBlKHByZXZpb3VzVmFsdWUpICE9PSBnZXRQcm90b3R5cGUocHJvcFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IHByb3BWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghaXNPYmplY3Qobm9kZVtwcm9wTmFtZV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0ge307XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHJlcGxhY2VyID0gcHJvcE5hbWUgPT09IFwic3R5bGVcIiA/IFwiXCIgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIHByb3BWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBwcm9wVmFsdWVba107XG4gICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdW2tdID0gdmFsdWUgPT09IHVuZGVmaW5lZCA/IHJlcGxhY2VyIDogdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRQcm90b3R5cGUodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUuX19wcm90b19fKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5fX3Byb3RvX187XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2lzLXZob29rLmpzXCI6IDI2LCBcImlzLW9iamVjdFwiOiAxMSB9XSwgMTU6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgZG9jdW1lbnQgPSByZXF1aXJlKFwiZ2xvYmFsL2RvY3VtZW50XCIpO1xuXG4gICAgICAgICAgICB2YXIgYXBwbHlQcm9wZXJ0aWVzID0gcmVxdWlyZShcIi4vYXBwbHktcHJvcGVydGllc1wiKTtcblxuICAgICAgICAgICAgdmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdm5vZGUuanNcIik7XG4gICAgICAgICAgICB2YXIgaXNWVGV4dCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12dGV4dC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIik7XG4gICAgICAgICAgICB2YXIgaGFuZGxlVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaGFuZGxlLXRodW5rLmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUVsZW1lbnQ7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodm5vZGUsIG9wdHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gb3B0cyA/IG9wdHMuZG9jdW1lbnQgfHwgZG9jdW1lbnQgOiBkb2N1bWVudDtcbiAgICAgICAgICAgICAgICB2YXIgd2FybiA9IG9wdHMgPyBvcHRzLndhcm4gOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgdm5vZGUgPSBoYW5kbGVUaHVuayh2bm9kZSkuYTtcblxuICAgICAgICAgICAgICAgIGlmIChpc1dpZGdldCh2bm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZub2RlLmluaXQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVlRleHQodm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2MuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaXNWTm9kZSh2bm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdhcm4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm4oXCJJdGVtIGlzIG5vdCBhIHZhbGlkIHZpcnR1YWwgZG9tIG5vZGVcIiwgdm5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdm5vZGUubmFtZXNwYWNlID09PSBudWxsID8gZG9jLmNyZWF0ZUVsZW1lbnQodm5vZGUudGFnTmFtZSkgOiBkb2MuY3JlYXRlRWxlbWVudE5TKHZub2RlLm5hbWVzcGFjZSwgdm5vZGUudGFnTmFtZSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgcHJvcHMgPSB2bm9kZS5wcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgIGFwcGx5UHJvcGVydGllcyhub2RlLCBwcm9wcyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkTm9kZSA9IGNyZWF0ZUVsZW1lbnQoY2hpbGRyZW5baV0sIG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2hhbmRsZS10aHVuay5qc1wiOiAyNCwgXCIuLi92bm9kZS9pcy12bm9kZS5qc1wiOiAyNywgXCIuLi92bm9kZS9pcy12dGV4dC5qc1wiOiAyOCwgXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIjogMjksIFwiLi9hcHBseS1wcm9wZXJ0aWVzXCI6IDE0LCBcImdsb2JhbC9kb2N1bWVudFwiOiAxMCB9XSwgMTY6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICAvLyBNYXBzIGEgdmlydHVhbCBET00gdHJlZSBvbnRvIGEgcmVhbCBET00gdHJlZSBpbiBhbiBlZmZpY2llbnQgbWFubmVyLlxuICAgICAgICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byByZWFkIGFsbCBvZiB0aGUgRE9NIG5vZGVzIGluIHRoZSB0cmVlIHNvIHdlIHVzZVxuICAgICAgICAgICAgLy8gdGhlIGluLW9yZGVyIHRyZWUgaW5kZXhpbmcgdG8gZWxpbWluYXRlIHJlY3Vyc2lvbiBkb3duIGNlcnRhaW4gYnJhbmNoZXMuXG4gICAgICAgICAgICAvLyBXZSBvbmx5IHJlY3Vyc2UgaW50byBhIERPTSBub2RlIGlmIHdlIGtub3cgdGhhdCBpdCBjb250YWlucyBhIGNoaWxkIG9mXG4gICAgICAgICAgICAvLyBpbnRlcmVzdC5cblxuICAgICAgICAgICAgdmFyIG5vQ2hpbGQgPSB7fTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkb21JbmRleDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gZG9tSW5kZXgocm9vdE5vZGUsIHRyZWUsIGluZGljZXMsIG5vZGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpbmRpY2VzIHx8IGluZGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzLnNvcnQoYXNjZW5kaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlY3Vyc2Uocm9vdE5vZGUsIHRyZWUsIGluZGljZXMsIG5vZGVzLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlY3Vyc2Uocm9vdE5vZGUsIHRyZWUsIGluZGljZXMsIG5vZGVzLCByb290SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBub2RlcyA9IG5vZGVzIHx8IHt9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleEluUmFuZ2UoaW5kaWNlcywgcm9vdEluZGV4LCByb290SW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2Rlc1tyb290SW5kZXhdID0gcm9vdE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgdkNoaWxkcmVuID0gdHJlZS5jaGlsZHJlbjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodkNoaWxkcmVuKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZE5vZGVzID0gcm9vdE5vZGUuY2hpbGROb2RlcztcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmVlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdEluZGV4ICs9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdkNoaWxkID0gdkNoaWxkcmVuW2ldIHx8IG5vQ2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRJbmRleCA9IHJvb3RJbmRleCArICh2Q2hpbGQuY291bnQgfHwgMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIHJlY3Vyc2lvbiBkb3duIHRoZSB0cmVlIGlmIHRoZXJlIGFyZSBubyBub2RlcyBkb3duIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhJblJhbmdlKGluZGljZXMsIHJvb3RJbmRleCwgbmV4dEluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNlKGNoaWxkTm9kZXNbaV0sIHZDaGlsZCwgaW5kaWNlcywgbm9kZXMsIHJvb3RJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdEluZGV4ID0gbmV4dEluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBCaW5hcnkgc2VhcmNoIGZvciBhbiBpbmRleCBpbiB0aGUgaW50ZXJ2YWwgW2xlZnQsIHJpZ2h0XVxuICAgICAgICAgICAgZnVuY3Rpb24gaW5kZXhJblJhbmdlKGluZGljZXMsIGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbWluSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIHZhciBtYXhJbmRleCA9IGluZGljZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEluZGV4O1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChtaW5JbmRleCA8PSBtYXhJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SW5kZXggPSAobWF4SW5kZXggKyBtaW5JbmRleCkgLyAyID4+IDA7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtID0gaW5kaWNlc1tjdXJyZW50SW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChtaW5JbmRleCA9PT0gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50SXRlbSA+PSBsZWZ0ICYmIGN1cnJlbnRJdGVtIDw9IHJpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJdGVtIDwgbGVmdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWluSW5kZXggPSBjdXJyZW50SW5kZXggKyAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJdGVtID4gcmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEluZGV4ID0gY3VycmVudEluZGV4IC0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBhc2NlbmRpbmcoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhID4gYiA/IDEgOiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge31dLCAxNzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBhcHBseVByb3BlcnRpZXMgPSByZXF1aXJlKFwiLi9hcHBseS1wcm9wZXJ0aWVzXCIpO1xuXG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCIpO1xuICAgICAgICAgICAgdmFyIFZQYXRjaCA9IHJlcXVpcmUoXCIuLi92bm9kZS92cGF0Y2guanNcIik7XG5cbiAgICAgICAgICAgIHZhciB1cGRhdGVXaWRnZXQgPSByZXF1aXJlKFwiLi91cGRhdGUtd2lkZ2V0XCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFwcGx5UGF0Y2g7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFwcGx5UGF0Y2godnBhdGNoLCBkb21Ob2RlLCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSB2cGF0Y2gudHlwZTtcbiAgICAgICAgICAgICAgICB2YXIgdk5vZGUgPSB2cGF0Y2gudk5vZGU7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGNoID0gdnBhdGNoLnBhdGNoO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLlJFTU9WRTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVOb2RlKGRvbU5vZGUsIHZOb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guSU5TRVJUOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluc2VydE5vZGUoZG9tTm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5WVEVYVDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHJpbmdQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5XSURHRVQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2lkZ2V0UGF0Y2goZG9tTm9kZSwgdk5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guVk5PREU6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdk5vZGVQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5PUkRFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlb3JkZXJDaGlsZHJlbihkb21Ob2RlLCBwYXRjaCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9tTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guUFJPUFM6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVByb3BlcnRpZXMoZG9tTm9kZSwgcGF0Y2gsIHZOb2RlLnByb3BlcnRpZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLlRIVU5LOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VSb290KGRvbU5vZGUsIHJlbmRlck9wdGlvbnMucGF0Y2goZG9tTm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpKTtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkb21Ob2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlTm9kZShkb21Ob2RlLCB2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gZG9tTm9kZS5wYXJlbnROb2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkb21Ob2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBkZXN0cm95V2lkZ2V0KGRvbU5vZGUsIHZOb2RlKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpbnNlcnROb2RlKHBhcmVudE5vZGUsIHZOb2RlLCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld05vZGUgPSByZW5kZXJPcHRpb25zLnJlbmRlcih2Tm9kZSwgcmVuZGVyT3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5ld05vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBzdHJpbmdQYXRjaChkb21Ob2RlLCBsZWZ0Vk5vZGUsIHZUZXh0LCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld05vZGU7XG5cbiAgICAgICAgICAgICAgICBpZiAoZG9tTm9kZS5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICBkb21Ob2RlLnJlcGxhY2VEYXRhKDAsIGRvbU5vZGUubGVuZ3RoLCB2VGV4dC50ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZSA9IGRvbU5vZGU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIG5ld05vZGUgPSByZW5kZXJPcHRpb25zLnJlbmRlcih2VGV4dCwgcmVuZGVyT3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgZG9tTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3Tm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gd2lkZ2V0UGF0Y2goZG9tTm9kZSwgbGVmdFZOb2RlLCB3aWRnZXQsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRpbmcgPSB1cGRhdGVXaWRnZXQobGVmdFZOb2RlLCB3aWRnZXQpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdOb2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld05vZGUgPSB3aWRnZXQudXBkYXRlKGxlZnRWTm9kZSwgZG9tTm9kZSkgfHwgZG9tTm9kZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIod2lkZ2V0LCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlICYmIG5ld05vZGUgIT09IGRvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgZG9tTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF1cGRhdGluZykge1xuICAgICAgICAgICAgICAgICAgICBkZXN0cm95V2lkZ2V0KGRvbU5vZGUsIGxlZnRWTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHZOb2RlUGF0Y2goZG9tTm9kZSwgbGVmdFZOb2RlLCB2Tm9kZSwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gZG9tTm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIHZhciBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodk5vZGUsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3Tm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZGVzdHJveVdpZGdldChkb21Ob2RlLCB3KSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3LmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIiAmJiBpc1dpZGdldCh3KSkge1xuICAgICAgICAgICAgICAgICAgICB3LmRlc3Ryb3koZG9tTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZW9yZGVyQ2hpbGRyZW4oZG9tTm9kZSwgbW92ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGROb2RlcyA9IGRvbU5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgICAgICAgICB2YXIga2V5TWFwID0ge307XG4gICAgICAgICAgICAgICAgdmFyIG5vZGU7XG4gICAgICAgICAgICAgICAgdmFyIHJlbW92ZTtcbiAgICAgICAgICAgICAgICB2YXIgaW5zZXJ0O1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3Zlcy5yZW1vdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZSA9IG1vdmVzLnJlbW92ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBjaGlsZE5vZGVzW3JlbW92ZS5mcm9tXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbW92ZS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleU1hcFtyZW1vdmUua2V5XSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZG9tTm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gY2hpbGROb2Rlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtb3Zlcy5pbnNlcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc2VydCA9IG1vdmVzLmluc2VydHNbal07XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBrZXlNYXBbaW5zZXJ0LmtleV07XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgdGhlIHdlaXJkZXN0IGJ1ZyBpJ3ZlIGV2ZXIgc2VlbiBpbiB3ZWJraXRcbiAgICAgICAgICAgICAgICAgICAgZG9tTm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgaW5zZXJ0LnRvID49IGxlbmd0aCsrID8gbnVsbCA6IGNoaWxkTm9kZXNbaW5zZXJ0LnRvXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZXBsYWNlUm9vdChvbGRSb290LCBuZXdSb290KSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZFJvb3QgJiYgbmV3Um9vdCAmJiBvbGRSb290ICE9PSBuZXdSb290ICYmIG9sZFJvb3QucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBvbGRSb290LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld1Jvb3QsIG9sZFJvb3QpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdSb290O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCI6IDI5LCBcIi4uL3Zub2RlL3ZwYXRjaC5qc1wiOiAzMiwgXCIuL2FwcGx5LXByb3BlcnRpZXNcIjogMTQsIFwiLi91cGRhdGUtd2lkZ2V0XCI6IDE5IH1dLCAxODogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBkb2N1bWVudCA9IHJlcXVpcmUoXCJnbG9iYWwvZG9jdW1lbnRcIik7XG4gICAgICAgICAgICB2YXIgaXNBcnJheSA9IHJlcXVpcmUoXCJ4LWlzLWFycmF5XCIpO1xuXG4gICAgICAgICAgICB2YXIgcmVuZGVyID0gcmVxdWlyZShcIi4vY3JlYXRlLWVsZW1lbnRcIik7XG4gICAgICAgICAgICB2YXIgZG9tSW5kZXggPSByZXF1aXJlKFwiLi9kb20taW5kZXhcIik7XG4gICAgICAgICAgICB2YXIgcGF0Y2hPcCA9IHJlcXVpcmUoXCIuL3BhdGNoLW9wXCIpO1xuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBwYXRjaDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gcGF0Y2gocm9vdE5vZGUsIHBhdGNoZXMsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICByZW5kZXJPcHRpb25zID0gcmVuZGVyT3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgICAgICByZW5kZXJPcHRpb25zLnBhdGNoID0gcmVuZGVyT3B0aW9ucy5wYXRjaCAmJiByZW5kZXJPcHRpb25zLnBhdGNoICE9PSBwYXRjaCA/IHJlbmRlck9wdGlvbnMucGF0Y2ggOiBwYXRjaFJlY3Vyc2l2ZTtcbiAgICAgICAgICAgICAgICByZW5kZXJPcHRpb25zLnJlbmRlciA9IHJlbmRlck9wdGlvbnMucmVuZGVyIHx8IHJlbmRlcjtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZW5kZXJPcHRpb25zLnBhdGNoKHJvb3ROb2RlLCBwYXRjaGVzLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcGF0Y2hSZWN1cnNpdmUocm9vdE5vZGUsIHBhdGNoZXMsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kaWNlcyA9IHBhdGNoSW5kaWNlcyhwYXRjaGVzKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZG9tSW5kZXgocm9vdE5vZGUsIHBhdGNoZXMuYSwgaW5kaWNlcyk7XG4gICAgICAgICAgICAgICAgdmFyIG93bmVyRG9jdW1lbnQgPSByb290Tm9kZS5vd25lckRvY3VtZW50O1xuXG4gICAgICAgICAgICAgICAgaWYgKCFyZW5kZXJPcHRpb25zLmRvY3VtZW50ICYmIG93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlck9wdGlvbnMuZG9jdW1lbnQgPSBvd25lckRvY3VtZW50O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZUluZGV4ID0gaW5kaWNlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdE5vZGUgPSBhcHBseVBhdGNoKHJvb3ROb2RlLCBpbmRleFtub2RlSW5kZXhdLCBwYXRjaGVzW25vZGVJbmRleF0sIHJlbmRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYXBwbHlQYXRjaChyb290Tm9kZSwgZG9tTm9kZSwgcGF0Y2hMaXN0LCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFkb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZTtcblxuICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KHBhdGNoTGlzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRjaExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld05vZGUgPSBwYXRjaE9wKHBhdGNoTGlzdFtpXSwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb21Ob2RlID09PSByb290Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3ROb2RlID0gbmV3Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld05vZGUgPSBwYXRjaE9wKHBhdGNoTGlzdCwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbU5vZGUgPT09IHJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb290Tm9kZSA9IG5ld05vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHBhdGNoSW5kaWNlcyhwYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGljZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBwYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgIT09IFwiYVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2goTnVtYmVyKGtleSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGljZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuL2NyZWF0ZS1lbGVtZW50XCI6IDE1LCBcIi4vZG9tLWluZGV4XCI6IDE2LCBcIi4vcGF0Y2gtb3BcIjogMTcsIFwiZ2xvYmFsL2RvY3VtZW50XCI6IDEwLCBcIngtaXMtYXJyYXlcIjogMTIgfV0sIDE5OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB1cGRhdGVXaWRnZXQ7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVdpZGdldChhLCBiKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzV2lkZ2V0KGEpICYmIGlzV2lkZ2V0KGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIm5hbWVcIiBpbiBhICYmIFwibmFtZVwiIGluIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLmlkID09PSBiLmlkO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuaW5pdCA9PT0gYi5pbml0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCI6IDI5IH1dLCAyMDogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICB2YXIgRXZTdG9yZSA9IHJlcXVpcmUoXCJldi1zdG9yZVwiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBFdkhvb2s7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIEV2SG9vayh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBFdkhvb2spKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXZIb29rKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEV2SG9vay5wcm90b3R5cGUuaG9vayA9IGZ1bmN0aW9uIChub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXMgPSBFdlN0b3JlKG5vZGUpO1xuICAgICAgICAgICAgICAgIHZhciBwcm9wTmFtZSA9IHByb3BlcnR5TmFtZS5zdWJzdHIoMyk7XG5cbiAgICAgICAgICAgICAgICBlc1twcm9wTmFtZV0gPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgRXZIb29rLnByb3RvdHlwZS51bmhvb2sgPSBmdW5jdGlvbiAobm9kZSwgcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVzID0gRXZTdG9yZShub2RlKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcE5hbWUgPSBwcm9wZXJ0eU5hbWUuc3Vic3RyKDMpO1xuXG4gICAgICAgICAgICAgICAgZXNbcHJvcE5hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSwgeyBcImV2LXN0b3JlXCI6IDcgfV0sIDIxOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gU29mdFNldEhvb2s7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFNvZnRTZXRIb29rKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNvZnRTZXRIb29rKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNvZnRTZXRIb29rKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFNvZnRTZXRIb29rLnByb3RvdHlwZS5ob29rID0gZnVuY3Rpb24gKG5vZGUsIHByb3BlcnR5TmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlW3Byb3BlcnR5TmFtZV0gIT09IHRoaXMudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wZXJ0eU5hbWVdID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LCB7fV0sIDIyOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgIHZhciBpc0FycmF5ID0gcmVxdWlyZShcIngtaXMtYXJyYXlcIik7XG5cbiAgICAgICAgICAgIHZhciBWTm9kZSA9IHJlcXVpcmUoXCIuLi92bm9kZS92bm9kZS5qc1wiKTtcbiAgICAgICAgICAgIHZhciBWVGV4dCA9IHJlcXVpcmUoXCIuLi92bm9kZS92dGV4dC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZub2RlXCIpO1xuICAgICAgICAgICAgdmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdnRleHRcIik7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0XCIpO1xuICAgICAgICAgICAgdmFyIGlzSG9vayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12aG9va1wiKTtcbiAgICAgICAgICAgIHZhciBpc1ZUaHVuayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy10aHVua1wiKTtcblxuICAgICAgICAgICAgdmFyIHBhcnNlVGFnID0gcmVxdWlyZShcIi4vcGFyc2UtdGFnLmpzXCIpO1xuICAgICAgICAgICAgdmFyIHNvZnRTZXRIb29rID0gcmVxdWlyZShcIi4vaG9va3Mvc29mdC1zZXQtaG9vay5qc1wiKTtcbiAgICAgICAgICAgIHZhciBldkhvb2sgPSByZXF1aXJlKFwiLi9ob29rcy9ldi1ob29rLmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGg7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGgodGFnTmFtZSwgcHJvcGVydGllcywgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGROb2RlcyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciB0YWcsIHByb3BzLCBrZXksIG5hbWVzcGFjZTtcblxuICAgICAgICAgICAgICAgIGlmICghY2hpbGRyZW4gJiYgaXNDaGlsZHJlbihwcm9wZXJ0aWVzKSkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbiA9IHByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzID0ge307XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCBwcm9wZXJ0aWVzIHx8IHt9O1xuICAgICAgICAgICAgICAgIHRhZyA9IHBhcnNlVGFnKHRhZ05hbWUsIHByb3BzKTtcblxuICAgICAgICAgICAgICAgIC8vIHN1cHBvcnQga2V5c1xuICAgICAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShcImtleVwiKSkge1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBwcm9wcy5rZXk7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzLmtleSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzdXBwb3J0IG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShcIm5hbWVzcGFjZVwiKSkge1xuICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2UgPSBwcm9wcy5uYW1lc3BhY2U7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzLm5hbWVzcGFjZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBmaXggY3Vyc29yIGJ1Z1xuICAgICAgICAgICAgICAgIGlmICh0YWcgPT09IFwiSU5QVVRcIiAmJiAhbmFtZXNwYWNlICYmIHByb3BzLmhhc093blByb3BlcnR5KFwidmFsdWVcIikgJiYgcHJvcHMudmFsdWUgIT09IHVuZGVmaW5lZCAmJiAhaXNIb29rKHByb3BzLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy52YWx1ZSA9IHNvZnRTZXRIb29rKHByb3BzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Qcm9wZXJ0aWVzKHByb3BzKTtcblxuICAgICAgICAgICAgICAgIGlmIChjaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGNoaWxkcmVuICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZENoaWxkKGNoaWxkcmVuLCBjaGlsZE5vZGVzLCB0YWcsIHByb3BzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFZOb2RlKHRhZywgcHJvcHMsIGNoaWxkTm9kZXMsIGtleSwgbmFtZXNwYWNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkQ2hpbGQoYywgY2hpbGROb2RlcywgdGFnLCBwcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGVzLnB1c2gobmV3IFZUZXh0KGMpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTm9kZXMucHVzaChuZXcgVlRleHQoU3RyaW5nKGMpKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc0NoaWxkKGMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTm9kZXMucHVzaChjKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkoYykpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRDaGlsZChjW2ldLCBjaGlsZE5vZGVzLCB0YWcsIHByb3BzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gbnVsbCB8fCBjID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFVuZXhwZWN0ZWRWaXJ0dWFsRWxlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JlaWduT2JqZWN0OiBjLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Vm5vZGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB0cmFuc2Zvcm1Qcm9wZXJ0aWVzKHByb3BzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNIb29rKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcE5hbWUuc3Vic3RyKDAsIDMpID09PSBcImV2LVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRkIGV2LWZvbyBzdXBwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHNbcHJvcE5hbWVdID0gZXZIb29rKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNDaGlsZCh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzVk5vZGUoeCkgfHwgaXNWVGV4dCh4KSB8fCBpc1dpZGdldCh4KSB8fCBpc1ZUaHVuayh4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNDaGlsZHJlbih4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcInN0cmluZ1wiIHx8IGlzQXJyYXkoeCkgfHwgaXNDaGlsZCh4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gVW5leHBlY3RlZFZpcnR1YWxFbGVtZW50KGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG5cbiAgICAgICAgICAgICAgICBlcnIudHlwZSA9IFwidmlydHVhbC1oeXBlcnNjcmlwdC51bmV4cGVjdGVkLnZpcnR1YWwtZWxlbWVudFwiO1xuICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gXCJVbmV4cGVjdGVkIHZpcnR1YWwgY2hpbGQgcGFzc2VkIHRvIGgoKS5cXG5cIiArIFwiRXhwZWN0ZWQgYSBWTm9kZSAvIFZ0aHVuayAvIFZXaWRnZXQgLyBzdHJpbmcgYnV0OlxcblwiICsgXCJnb3Q6XFxuXCIgKyBlcnJvclN0cmluZyhkYXRhLmZvcmVpZ25PYmplY3QpICsgXCIuXFxuXCIgKyBcIlRoZSBwYXJlbnQgdm5vZGUgaXM6XFxuXCIgKyBlcnJvclN0cmluZyhkYXRhLnBhcmVudFZub2RlKTtcbiAgICAgICAgICAgICAgICBcIlxcblwiICsgXCJTdWdnZXN0ZWQgZml4OiBjaGFuZ2UgeW91ciBgaCguLi4sIFsgLi4uIF0pYCBjYWxsc2l0ZS5cIjtcbiAgICAgICAgICAgICAgICBlcnIuZm9yZWlnbk9iamVjdCA9IGRhdGEuZm9yZWlnbk9iamVjdDtcbiAgICAgICAgICAgICAgICBlcnIucGFyZW50Vm5vZGUgPSBkYXRhLnBhcmVudFZub2RlO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZXJyb3JTdHJpbmcob2JqKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgXCIgICAgXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhvYmopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2lzLXRodW5rXCI6IDI1LCBcIi4uL3Zub2RlL2lzLXZob29rXCI6IDI2LCBcIi4uL3Zub2RlL2lzLXZub2RlXCI6IDI3LCBcIi4uL3Zub2RlL2lzLXZ0ZXh0XCI6IDI4LCBcIi4uL3Zub2RlL2lzLXdpZGdldFwiOiAyOSwgXCIuLi92bm9kZS92bm9kZS5qc1wiOiAzMSwgXCIuLi92bm9kZS92dGV4dC5qc1wiOiAzMywgXCIuL2hvb2tzL2V2LWhvb2suanNcIjogMjAsIFwiLi9ob29rcy9zb2Z0LXNldC1ob29rLmpzXCI6IDIxLCBcIi4vcGFyc2UtdGFnLmpzXCI6IDIzLCBcIngtaXMtYXJyYXlcIjogMTIgfV0sIDIzOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgIHZhciBzcGxpdCA9IHJlcXVpcmUoXCJicm93c2VyLXNwbGl0XCIpO1xuXG4gICAgICAgICAgICB2YXIgY2xhc3NJZFNwbGl0ID0gLyhbXFwuI10/W2EtekEtWjAtOVxcdTAwN0YtXFx1RkZGRl86LV0rKS87XG4gICAgICAgICAgICB2YXIgbm90Q2xhc3NJZCA9IC9eXFwufCMvO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHBhcnNlVGFnO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBwYXJzZVRhZyh0YWcsIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0YWcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRElWXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG5vSWQgPSAhcHJvcHMuaGFzT3duUHJvcGVydHkoXCJpZFwiKTtcblxuICAgICAgICAgICAgICAgIHZhciB0YWdQYXJ0cyA9IHNwbGl0KHRhZywgY2xhc3NJZFNwbGl0KTtcbiAgICAgICAgICAgICAgICB2YXIgdGFnTmFtZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBpZiAobm90Q2xhc3NJZC50ZXN0KHRhZ1BhcnRzWzFdKSkge1xuICAgICAgICAgICAgICAgICAgICB0YWdOYW1lID0gXCJESVZcIjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NlcywgcGFydCwgdHlwZSwgaTtcblxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gdGFnUGFydHNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBwYXJ0LmNoYXJBdCgwKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUgPSBwYXJ0O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiLlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzID0gY2xhc3NlcyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaChwYXJ0LnN1YnN0cmluZygxLCBwYXJ0Lmxlbmd0aCkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiI1wiICYmIG5vSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLmlkID0gcGFydC5zdWJzdHJpbmcoMSwgcGFydC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGNsYXNzZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKHByb3BzLmNsYXNzTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBwcm9wcy5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oXCIgXCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wcy5uYW1lc3BhY2UgPyB0YWdOYW1lIDogdGFnTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiYnJvd3Nlci1zcGxpdFwiOiA1IH1dLCAyNDogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4vaXMtdm5vZGVcIik7XG4gICAgICAgICAgICB2YXIgaXNWVGV4dCA9IHJlcXVpcmUoXCIuL2lzLXZ0ZXh0XCIpO1xuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4vaXMtd2lkZ2V0XCIpO1xuICAgICAgICAgICAgdmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi9pcy10aHVua1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBoYW5kbGVUaHVuaztcblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlVGh1bmsoYSwgYikge1xuICAgICAgICAgICAgICAgIHZhciByZW5kZXJlZEEgPSBhO1xuICAgICAgICAgICAgICAgIHZhciByZW5kZXJlZEIgPSBiO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzVGh1bmsoYikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWRCID0gcmVuZGVyVGh1bmsoYiwgYSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGlzVGh1bmsoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWRBID0gcmVuZGVyVGh1bmsoYSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgYTogcmVuZGVyZWRBLFxuICAgICAgICAgICAgICAgICAgICBiOiByZW5kZXJlZEJcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZW5kZXJUaHVuayh0aHVuaywgcHJldmlvdXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVuZGVyZWRUaHVuayA9IHRodW5rLnZub2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFyZW5kZXJlZFRodW5rKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkVGh1bmsgPSB0aHVuay52bm9kZSA9IHRodW5rLnJlbmRlcihwcmV2aW91cyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCEoaXNWTm9kZShyZW5kZXJlZFRodW5rKSB8fCBpc1ZUZXh0KHJlbmRlcmVkVGh1bmspIHx8IGlzV2lkZ2V0KHJlbmRlcmVkVGh1bmspKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0aHVuayBkaWQgbm90IHJldHVybiBhIHZhbGlkIG5vZGVcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbmRlcmVkVGh1bms7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuL2lzLXRodW5rXCI6IDI1LCBcIi4vaXMtdm5vZGVcIjogMjcsIFwiLi9pcy12dGV4dFwiOiAyOCwgXCIuL2lzLXdpZGdldFwiOiAyOSB9XSwgMjU6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGlzVGh1bms7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzVGh1bmsodCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0ICYmIHQudHlwZSA9PT0gXCJUaHVua1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7fV0sIDI2OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBpc0hvb2s7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzSG9vayhob29rKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhvb2sgJiYgKHR5cGVvZiBob29rLmhvb2sgPT09IFwiZnVuY3Rpb25cIiAmJiAhaG9vay5oYXNPd25Qcm9wZXJ0eShcImhvb2tcIikgfHwgdHlwZW9mIGhvb2sudW5ob29rID09PSBcImZ1bmN0aW9uXCIgJiYgIWhvb2suaGFzT3duUHJvcGVydHkoXCJ1bmhvb2tcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7fV0sIDI3OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGlzVmlydHVhbE5vZGU7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzVmlydHVhbE5vZGUoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4ICYmIHgudHlwZSA9PT0gXCJWaXJ0dWFsTm9kZVwiICYmIHgudmVyc2lvbiA9PT0gdmVyc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4vdmVyc2lvblwiOiAzMCB9XSwgMjg6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaXNWaXJ0dWFsVGV4dDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNWaXJ0dWFsVGV4dCh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHggJiYgeC50eXBlID09PSBcIlZpcnR1YWxUZXh0XCIgJiYgeC52ZXJzaW9uID09PSB2ZXJzaW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi92ZXJzaW9uXCI6IDMwIH1dLCAyOTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaXNXaWRnZXQ7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzV2lkZ2V0KHcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdyAmJiB3LnR5cGUgPT09IFwiV2lkZ2V0XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHt9XSwgMzA6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IFwiMlwiO1xuICAgICAgICB9LCB7fV0sIDMxOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpO1xuICAgICAgICAgICAgdmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi9pcy12bm9kZVwiKTtcbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuL2lzLXdpZGdldFwiKTtcbiAgICAgICAgICAgIHZhciBpc1RodW5rID0gcmVxdWlyZShcIi4vaXMtdGh1bmtcIik7XG4gICAgICAgICAgICB2YXIgaXNWSG9vayA9IHJlcXVpcmUoXCIuL2lzLXZob29rXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxOb2RlO1xuXG4gICAgICAgICAgICB2YXIgbm9Qcm9wZXJ0aWVzID0ge307XG4gICAgICAgICAgICB2YXIgbm9DaGlsZHJlbiA9IFtdO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBWaXJ0dWFsTm9kZSh0YWdOYW1lLCBwcm9wZXJ0aWVzLCBjaGlsZHJlbiwga2V5LCBuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05hbWUgPSB0YWdOYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXMgfHwgbm9Qcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbiB8fCBub0NoaWxkcmVuO1xuICAgICAgICAgICAgICAgIHRoaXMua2V5ID0ga2V5ICE9IG51bGwgPyBTdHJpbmcoa2V5KSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IHR5cGVvZiBuYW1lc3BhY2UgPT09IFwic3RyaW5nXCIgPyBuYW1lc3BhY2UgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgdmFyIGNvdW50ID0gY2hpbGRyZW4gJiYgY2hpbGRyZW4ubGVuZ3RoIHx8IDA7XG4gICAgICAgICAgICAgICAgdmFyIGRlc2NlbmRhbnRzID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgaGFzV2lkZ2V0cyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBoYXNUaHVua3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgZGVzY2VuZGFudEhvb2tzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGhvb2tzO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IHByb3BlcnRpZXNbcHJvcE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVkhvb2socHJvcGVydHkpICYmIHByb3BlcnR5LnVuaG9vaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaG9va3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9va3MgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rc1twcm9wTmFtZV0gPSBwcm9wZXJ0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUoY2hpbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyArPSBjaGlsZC5jb3VudCB8fCAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc1dpZGdldHMgJiYgY2hpbGQuaGFzV2lkZ2V0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1dpZGdldHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc1RodW5rcyAmJiBjaGlsZC5oYXNUaHVua3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNUaHVua3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRlc2NlbmRhbnRIb29rcyAmJiAoY2hpbGQuaG9va3MgfHwgY2hpbGQuZGVzY2VuZGFudEhvb2tzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NlbmRhbnRIb29rcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWhhc1dpZGdldHMgJiYgaXNXaWRnZXQoY2hpbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNoaWxkLmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1dpZGdldHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFoYXNUaHVua3MgJiYgaXNUaHVuayhjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc1RodW5rcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50ID0gY291bnQgKyBkZXNjZW5kYW50cztcbiAgICAgICAgICAgICAgICB0aGlzLmhhc1dpZGdldHMgPSBoYXNXaWRnZXRzO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzVGh1bmtzID0gaGFzVGh1bmtzO1xuICAgICAgICAgICAgICAgIHRoaXMuaG9va3MgPSBob29rcztcbiAgICAgICAgICAgICAgICB0aGlzLmRlc2NlbmRhbnRIb29rcyA9IGRlc2NlbmRhbnRIb29rcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgVmlydHVhbE5vZGUucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgICAgVmlydHVhbE5vZGUucHJvdG90eXBlLnR5cGUgPSBcIlZpcnR1YWxOb2RlXCI7XG4gICAgICAgIH0sIHsgXCIuL2lzLXRodW5rXCI6IDI1LCBcIi4vaXMtdmhvb2tcIjogMjYsIFwiLi9pcy12bm9kZVwiOiAyNywgXCIuL2lzLXdpZGdldFwiOiAyOSwgXCIuL3ZlcnNpb25cIjogMzAgfV0sIDMyOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpO1xuXG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guTk9ORSA9IDA7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guVlRFWFQgPSAxO1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLlZOT0RFID0gMjtcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5XSURHRVQgPSAzO1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLlBST1BTID0gNDtcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5PUkRFUiA9IDU7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guSU5TRVJUID0gNjtcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5SRU1PVkUgPSA3O1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLlRIVU5LID0gODtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBWaXJ0dWFsUGF0Y2g7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFZpcnR1YWxQYXRjaCh0eXBlLCB2Tm9kZSwgcGF0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBOdW1iZXIodHlwZSk7XG4gICAgICAgICAgICAgICAgdGhpcy52Tm9kZSA9IHZOb2RlO1xuICAgICAgICAgICAgICAgIHRoaXMucGF0Y2ggPSBwYXRjaDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgVmlydHVhbFBhdGNoLnByb3RvdHlwZS52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5wcm90b3R5cGUudHlwZSA9IFwiVmlydHVhbFBhdGNoXCI7XG4gICAgICAgIH0sIHsgXCIuL3ZlcnNpb25cIjogMzAgfV0sIDMzOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxUZXh0O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBWaXJ0dWFsVGV4dCh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0ID0gU3RyaW5nKHRleHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBWaXJ0dWFsVGV4dC5wcm90b3R5cGUudmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgICBWaXJ0dWFsVGV4dC5wcm90b3R5cGUudHlwZSA9IFwiVmlydHVhbFRleHRcIjtcbiAgICAgICAgfSwgeyBcIi4vdmVyc2lvblwiOiAzMCB9XSwgMzQ6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaXNPYmplY3QgPSByZXF1aXJlKFwiaXMtb2JqZWN0XCIpO1xuICAgICAgICAgICAgdmFyIGlzSG9vayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12aG9va1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkaWZmUHJvcHM7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRpZmZQcm9wcyhhLCBiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmY7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBhS2V5IGluIGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoYUtleSBpbiBiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGFWYWx1ZSA9IGFbYUtleV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBiVmFsdWUgPSBiW2FLZXldO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhVmFsdWUgPT09IGJWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNPYmplY3QoYVZhbHVlKSAmJiBpc09iamVjdChiVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0UHJvdG90eXBlKGJWYWx1ZSkgIT09IGdldFByb3RvdHlwZShhVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IGJWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNIb29rKGJWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gYlZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0RGlmZiA9IGRpZmZQcm9wcyhhVmFsdWUsIGJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdERpZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBvYmplY3REaWZmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IGJWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGJLZXkgaW4gYikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIShiS2V5IGluIGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYktleV0gPSBiW2JLZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpZmY7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldFByb3RvdHlwZSh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS5fX3Byb3RvX18pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLl9fcHJvdG9fXztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi4vdm5vZGUvaXMtdmhvb2tcIjogMjYsIFwiaXMtb2JqZWN0XCI6IDExIH1dLCAzNTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBpc0FycmF5ID0gcmVxdWlyZShcIngtaXMtYXJyYXlcIik7XG5cbiAgICAgICAgICAgIHZhciBWUGF0Y2ggPSByZXF1aXJlKFwiLi4vdm5vZGUvdnBhdGNoXCIpO1xuICAgICAgICAgICAgdmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdm5vZGVcIik7XG4gICAgICAgICAgICB2YXIgaXNWVGV4dCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12dGV4dFwiKTtcbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXRcIik7XG4gICAgICAgICAgICB2YXIgaXNUaHVuayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy10aHVua1wiKTtcbiAgICAgICAgICAgIHZhciBoYW5kbGVUaHVuayA9IHJlcXVpcmUoXCIuLi92bm9kZS9oYW5kbGUtdGh1bmtcIik7XG5cbiAgICAgICAgICAgIHZhciBkaWZmUHJvcHMgPSByZXF1aXJlKFwiLi9kaWZmLXByb3BzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRpZmY7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRpZmYoYSwgYikge1xuICAgICAgICAgICAgICAgIHZhciBwYXRjaCA9IHsgYTogYSB9O1xuICAgICAgICAgICAgICAgIHdhbGsoYSwgYiwgcGF0Y2gsIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRjaDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gd2FsayhhLCBiLCBwYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGFwcGx5ID0gcGF0Y2hbaW5kZXhdO1xuICAgICAgICAgICAgICAgIHZhciBhcHBseUNsZWFyID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNUaHVuayhhKSB8fCBpc1RodW5rKGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRodW5rcyhhLCBiLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYiA9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgYSBpcyBhIHdpZGdldCB3ZSB3aWxsIGFkZCBhIHJlbW92ZSBwYXRjaCBmb3IgaXRcbiAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGFueSBjaGlsZCB3aWRnZXRzL2hvb2tzIG11c3QgYmUgZGVzdHJveWVkLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIHByZXZlbnRzIGFkZGluZyB0d28gcmVtb3ZlIHBhdGNoZXMgZm9yIGEgd2lkZ2V0LlxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzV2lkZ2V0KGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclN0YXRlKGEsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IHBhdGNoW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlJFTU9WRSwgYSwgYikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNWTm9kZShiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEudGFnTmFtZSA9PT0gYi50YWdOYW1lICYmIGEubmFtZXNwYWNlID09PSBiLm5hbWVzcGFjZSAmJiBhLmtleSA9PT0gYi5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcHNQYXRjaCA9IGRpZmZQcm9wcyhhLnByb3BlcnRpZXMsIGIucHJvcGVydGllcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzUGF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guUFJPUFMsIGEsIHByb3BzUGF0Y2gpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBkaWZmQ2hpbGRyZW4oYSwgYiwgcGF0Y2gsIGFwcGx5LCBpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZOT0RFLCBhLCBiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WTk9ERSwgYSwgYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVlRleHQoYikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1ZUZXh0KGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WVEVYVCwgYSwgYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYS50ZXh0ICE9PSBiLnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZURVhULCBhLCBiKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzV2lkZ2V0KGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNXaWRnZXQoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guV0lER0VULCBhLCBiKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFwcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGNoW2luZGV4XSA9IGFwcGx5O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhcHBseUNsZWFyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyU3RhdGUoYSwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRpZmZDaGlsZHJlbihhLCBiLCBwYXRjaCwgYXBwbHksIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIGFDaGlsZHJlbiA9IGEuY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgdmFyIG9yZGVyZWRTZXQgPSByZW9yZGVyKGFDaGlsZHJlbiwgYi5jaGlsZHJlbik7XG4gICAgICAgICAgICAgICAgdmFyIGJDaGlsZHJlbiA9IG9yZGVyZWRTZXQuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgICB2YXIgYUxlbiA9IGFDaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdmFyIGJMZW4gPSBiQ2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSBhTGVuID4gYkxlbiA/IGFMZW4gOiBiTGVuO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGVmdE5vZGUgPSBhQ2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIHZhciByaWdodE5vZGUgPSBiQ2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFsZWZ0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJpZ2h0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4Y2VzcyBub2RlcyBpbiBiIG5lZWQgdG8gYmUgYWRkZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5JTlNFUlQsIG51bGwsIHJpZ2h0Tm9kZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FsayhsZWZ0Tm9kZSwgcmlnaHROb2RlLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUobGVmdE5vZGUpICYmIGxlZnROb2RlLmNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCArPSBsZWZ0Tm9kZS5jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcmRlcmVkU2V0Lm1vdmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlb3JkZXIgbm9kZXMgbGFzdFxuICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5PUkRFUiwgYSwgb3JkZXJlZFNldC5tb3ZlcykpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBhcHBseTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2xlYXJTdGF0ZSh2Tm9kZSwgcGF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogTWFrZSB0aGlzIGEgc2luZ2xlIHdhbGssIG5vdCB0d29cbiAgICAgICAgICAgICAgICB1bmhvb2sodk5vZGUsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgZGVzdHJveVdpZGdldHModk5vZGUsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBhdGNoIHJlY29yZHMgZm9yIGFsbCBkZXN0cm95ZWQgd2lkZ2V0cyBtdXN0IGJlIGFkZGVkIGJlY2F1c2Ugd2UgbmVlZFxuICAgICAgICAgICAgLy8gYSBET00gbm9kZSByZWZlcmVuY2UgZm9yIHRoZSBkZXN0cm95IGZ1bmN0aW9uXG4gICAgICAgICAgICBmdW5jdGlvbiBkZXN0cm95V2lkZ2V0cyh2Tm9kZSwgcGF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzV2lkZ2V0KHZOb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZOb2RlLmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hbaW5kZXhdID0gYXBwZW5kUGF0Y2gocGF0Y2hbaW5kZXhdLCBuZXcgVlBhdGNoKFZQYXRjaC5SRU1PVkUsIHZOb2RlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVk5vZGUodk5vZGUpICYmICh2Tm9kZS5oYXNXaWRnZXRzIHx8IHZOb2RlLmhhc1RodW5rcykpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdk5vZGUuY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdHJveVdpZGdldHMoY2hpbGQsIHBhdGNoLCBpbmRleCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZOb2RlKGNoaWxkKSAmJiBjaGlsZC5jb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IGNoaWxkLmNvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1RodW5rKHZOb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHVua3Modk5vZGUsIG51bGwsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBzdWItcGF0Y2ggZm9yIHRodW5rc1xuICAgICAgICAgICAgZnVuY3Rpb24gdGh1bmtzKGEsIGIsIHBhdGNoLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBub2RlcyA9IGhhbmRsZVRodW5rKGEsIGIpO1xuICAgICAgICAgICAgICAgIHZhciB0aHVua1BhdGNoID0gZGlmZihub2Rlcy5hLCBub2Rlcy5iKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzUGF0Y2hlcyh0aHVua1BhdGNoKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXRjaFtpbmRleF0gPSBuZXcgVlBhdGNoKFZQYXRjaC5USFVOSywgbnVsbCwgdGh1bmtQYXRjaCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYXNQYXRjaGVzKHBhdGNoKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggaW4gcGF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBcImFcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEV4ZWN1dGUgaG9va3Mgd2hlbiB0d28gbm9kZXMgYXJlIGlkZW50aWNhbFxuICAgICAgICAgICAgZnVuY3Rpb24gdW5ob29rKHZOb2RlLCBwYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZSh2Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZOb2RlLmhvb2tzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaFtpbmRleF0gPSBhcHBlbmRQYXRjaChwYXRjaFtpbmRleF0sIG5ldyBWUGF0Y2goVlBhdGNoLlBST1BTLCB2Tm9kZSwgdW5kZWZpbmVkS2V5cyh2Tm9kZS5ob29rcykpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2Tm9kZS5kZXNjZW5kYW50SG9va3MgfHwgdk5vZGUuaGFzVGh1bmtzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB2Tm9kZS5jaGlsZHJlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaG9vayhjaGlsZCwgcGF0Y2gsIGluZGV4KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZOb2RlKGNoaWxkKSAmJiBjaGlsZC5jb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCArPSBjaGlsZC5jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVGh1bmsodk5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRodW5rcyh2Tm9kZSwgbnVsbCwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHVuZGVmaW5lZEtleXMob2JqKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMaXN0IGRpZmYsIG5haXZlIGxlZnQgdG8gcmlnaHQgcmVvcmRlcmluZ1xuICAgICAgICAgICAgZnVuY3Rpb24gcmVvcmRlcihhQ2hpbGRyZW4sIGJDaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIC8vIE8oTSkgdGltZSwgTyhNKSBtZW1vcnlcbiAgICAgICAgICAgICAgICB2YXIgYkNoaWxkSW5kZXggPSBrZXlJbmRleChiQ2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIHZhciBiS2V5cyA9IGJDaGlsZEluZGV4LmtleXM7XG4gICAgICAgICAgICAgICAgdmFyIGJGcmVlID0gYkNoaWxkSW5kZXguZnJlZTtcblxuICAgICAgICAgICAgICAgIGlmIChiRnJlZS5sZW5ndGggPT09IGJDaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBiQ2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlczogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE8oTikgdGltZSwgTyhOKSBtZW1vcnlcbiAgICAgICAgICAgICAgICB2YXIgYUNoaWxkSW5kZXggPSBrZXlJbmRleChhQ2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIHZhciBhS2V5cyA9IGFDaGlsZEluZGV4LmtleXM7XG4gICAgICAgICAgICAgICAgdmFyIGFGcmVlID0gYUNoaWxkSW5kZXguZnJlZTtcblxuICAgICAgICAgICAgICAgIGlmIChhRnJlZS5sZW5ndGggPT09IGFDaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBiQ2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlczogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE8oTUFYKE4sIE0pKSBtZW1vcnlcbiAgICAgICAgICAgICAgICB2YXIgbmV3Q2hpbGRyZW4gPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBmcmVlSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIHZhciBmcmVlQ291bnQgPSBiRnJlZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGV0ZWRJdGVtcyA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYSBhbmQgbWF0Y2ggYSBub2RlIGluIGJcbiAgICAgICAgICAgICAgICAvLyBPKE4pIHRpbWUsXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFJdGVtID0gYUNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbUluZGV4O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiS2V5cy5oYXNPd25Qcm9wZXJ0eShhSXRlbS5rZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWF0Y2ggdXAgdGhlIG9sZCBrZXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbUluZGV4ID0gYktleXNbYUl0ZW0ua2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGJDaGlsZHJlbltpdGVtSW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIG9sZCBrZXllZCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGkgLSBkZWxldGVkSXRlbXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWF0Y2ggdGhlIGl0ZW0gaW4gYSB3aXRoIHRoZSBuZXh0IGZyZWUgaXRlbSBpbiBiXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnJlZUluZGV4IDwgZnJlZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbUluZGV4ID0gYkZyZWVbZnJlZUluZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2goYkNoaWxkcmVuW2l0ZW1JbmRleF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBhcmUgbm8gZnJlZSBpdGVtcyBpbiBiIHRvIG1hdGNoIHdpdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZnJlZSBpdGVtcyBpbiBhLCBzbyB0aGUgZXh0cmEgZnJlZSBub2Rlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFyZSBkZWxldGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGkgLSBkZWxldGVkSXRlbXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGxhc3RGcmVlSW5kZXggPSBmcmVlSW5kZXggPj0gYkZyZWUubGVuZ3RoID8gYkNoaWxkcmVuLmxlbmd0aCA6IGJGcmVlW2ZyZWVJbmRleF07XG5cbiAgICAgICAgICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYiBhbmQgYXBwZW5kIGFueSBuZXcga2V5c1xuICAgICAgICAgICAgICAgIC8vIE8oTSkgdGltZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYkNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdJdGVtID0gYkNoaWxkcmVuW2pdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhS2V5cy5oYXNPd25Qcm9wZXJ0eShuZXdJdGVtLmtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgYW55IG5ldyBrZXllZCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBhZGRpbmcgbmV3IGl0ZW1zIHRvIHRoZSBlbmQgYW5kIHRoZW4gc29ydGluZyB0aGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gcGxhY2UuIEluIGZ1dHVyZSB3ZSBzaG91bGQgaW5zZXJ0IG5ldyBpdGVtcyBpbiBwbGFjZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG5ld0l0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGogPj0gbGFzdEZyZWVJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGFueSBsZWZ0b3ZlciBub24ta2V5ZWQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2gobmV3SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgc2ltdWxhdGUgPSBuZXdDaGlsZHJlbi5zbGljZSgpO1xuICAgICAgICAgICAgICAgIHZhciBzaW11bGF0ZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlcyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBpbnNlcnRzID0gW107XG4gICAgICAgICAgICAgICAgdmFyIHNpbXVsYXRlSXRlbTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgYkNoaWxkcmVuLmxlbmd0aDspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdhbnRlZEl0ZW0gPSBiQ2hpbGRyZW5ba107XG4gICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBpdGVtc1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoc2ltdWxhdGVJdGVtID09PSBudWxsICYmIHNpbXVsYXRlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3Zlcy5wdXNoKHJlbW92ZShzaW11bGF0ZSwgc2ltdWxhdGVJbmRleCwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJdGVtID0gc2ltdWxhdGVbc2ltdWxhdGVJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNpbXVsYXRlSXRlbSB8fCBzaW11bGF0ZUl0ZW0ua2V5ICE9PSB3YW50ZWRJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgbmVlZCBhIGtleSBpbiB0aGlzIHBvc2l0aW9uLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2FudGVkSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2ltdWxhdGVJdGVtICYmIHNpbXVsYXRlSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaW5zZXJ0IGRvZXNuJ3QgcHV0IHRoaXMga2V5IGluIHBsYWNlLCBpdCBuZWVkcyB0byBtb3ZlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiS2V5c1tzaW11bGF0ZUl0ZW0ua2V5XSAhPT0gayArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbS5rZXkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIHJlbW92ZSBkaWRuJ3QgcHV0IHRoZSB3YW50ZWQgaXRlbSBpbiBwbGFjZSwgd2UgbmVlZCB0byBpbnNlcnQgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2ltdWxhdGVJdGVtIHx8IHNpbXVsYXRlSXRlbS5rZXkgIT09IHdhbnRlZEl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0cy5wdXNoKHsga2V5OiB3YW50ZWRJdGVtLmtleSwgdG86IGsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpdGVtcyBhcmUgbWF0Y2hpbmcsIHNvIHNraXAgYWhlYWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7IGtleTogd2FudGVkSXRlbS5rZXksIHRvOiBrIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0cy5wdXNoKHsga2V5OiB3YW50ZWRJdGVtLmtleSwgdG86IGsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEga2V5IGluIHNpbXVsYXRlIGhhcyBubyBtYXRjaGluZyB3YW50ZWQga2V5LCByZW1vdmUgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNpbXVsYXRlSXRlbSAmJiBzaW11bGF0ZUl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3Zlcy5wdXNoKHJlbW92ZShzaW11bGF0ZSwgc2ltdWxhdGVJbmRleCwgc2ltdWxhdGVJdGVtLmtleSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGFsbCB0aGUgcmVtYWluaW5nIG5vZGVzIGZyb20gc2ltdWxhdGVcbiAgICAgICAgICAgICAgICB3aGlsZSAoc2ltdWxhdGVJbmRleCA8IHNpbXVsYXRlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3Zlcy5wdXNoKHJlbW92ZShzaW11bGF0ZSwgc2ltdWxhdGVJbmRleCwgc2ltdWxhdGVJdGVtICYmIHNpbXVsYXRlSXRlbS5rZXkpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgb25seSBtb3ZlcyB3ZSBoYXZlIGFyZSBkZWxldGVzIHRoZW4gd2UgY2FuIGp1c3RcbiAgICAgICAgICAgICAgICAvLyBsZXQgdGhlIGRlbGV0ZSBwYXRjaCByZW1vdmUgdGhlc2UgaXRlbXMuXG4gICAgICAgICAgICAgICAgaWYgKHJlbW92ZXMubGVuZ3RoID09PSBkZWxldGVkSXRlbXMgJiYgIWluc2VydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbmV3Q2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlczogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBuZXdDaGlsZHJlbixcbiAgICAgICAgICAgICAgICAgICAgbW92ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXM6IHJlbW92ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRzOiBpbnNlcnRzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZW1vdmUoYXJyLCBpbmRleCwga2V5KSB7XG4gICAgICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBmcm9tOiBpbmRleCxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBrZXlJbmRleChjaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIHZhciBrZXlzID0ge307XG4gICAgICAgICAgICAgICAgdmFyIGZyZWUgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gY2hpbGRyZW4ubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlzW2NoaWxkLmtleV0gPSBpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJlZS5wdXNoKGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAga2V5czoga2V5cywgLy8gQSBoYXNoIG9mIGtleSBuYW1lIHRvIGluZGV4XG4gICAgICAgICAgICAgICAgICAgIGZyZWU6IGZyZWUgLy8gQW4gYXJyYXkgb2YgdW5rZXllZCBpdGVtIGluZGljZXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBhcHBlbmRQYXRjaChhcHBseSwgcGF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXBwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkoYXBwbHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseS5wdXNoKHBhdGNoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gW2FwcGx5LCBwYXRjaF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXBwbHk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2hhbmRsZS10aHVua1wiOiAyNCwgXCIuLi92bm9kZS9pcy10aHVua1wiOiAyNSwgXCIuLi92bm9kZS9pcy12bm9kZVwiOiAyNywgXCIuLi92bm9kZS9pcy12dGV4dFwiOiAyOCwgXCIuLi92bm9kZS9pcy13aWRnZXRcIjogMjksIFwiLi4vdm5vZGUvdnBhdGNoXCI6IDMyLCBcIi4vZGlmZi1wcm9wc1wiOiAzNCwgXCJ4LWlzLWFycmF5XCI6IDEyIH1dIH0sIHt9LCBbNF0pKDQpO1xufSk7XG5cbmNvbnN0IENvcmUgPSBDO1xuXG5leHBvcnQgeyBDb3JlLCBLZXJuZWwsIEVudW0sIExpc3QsIEtleXdvcmQsIGJpdHdpc2UgYXMgQml0d2lzZSwgbWFwIGFzIE1hcCwgbWFwX3NldCBhcyBNYXBTZXQsIFZpcnR1YWxET00gfTsiXSwiZmlsZSI6IkVsaXhpci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9