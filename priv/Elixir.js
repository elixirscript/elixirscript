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

class Tuple {

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

function List(...args) {
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

function is_number(value) {
  return typeof value === 'number';
}

function is_string(value) {
  return typeof value === 'string';
}

function is_boolean(value) {
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

function is_function(value) {
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
  is_number,
  is_string,
  is_boolean,
  is_symbol,
  is_null,
  is_undefined,
  is_function,
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

function apply(...args) {
  if (args.length === 2) {
    args[0].apply(null, args.slice(1));
  } else {
    args[0][args[1]].apply(null, args.slice(2));
  }
}

function contains(left, right) {
  for (let x of right) {
    if (Patterns.match_no_throw(left, x) != null) {
      return true;
    }
  }

  return false;
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

function delete_property_from_map(map, property) {
  let new_map = Object.assign(Object.create(map.constructor.prototype), map);
  delete new_map[property];

  return Object.freeze(new_map);
}

function class_to_obj(map) {
  let new_map = Object.assign({}, map);
  return Object.freeze(new_map);
}

function add_property_to_map(map, property, value) {
  let new_map = Object.assign({}, map);
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

    new_value.push(new Tuple(...current_value));
  }

  return Object.freeze(new_value);
}

function can_decode64(data) {
  try {
    atob(data);
    return true;
  } catch (e) {
    return false;
  }
}

var Functions = {
  call_property,
  apply,
  contains,
  get_global,
  defstruct,
  defexception,
  defprotocol,
  defimpl,
  get_object_keys,
  is_valid_character,
  b64EncodeUnicode,
  delete_property_from_map,
  add_property_to_map,
  class_to_obj,
  can_decode64,
  bnot,
  band,
  bor,
  bsl,
  bsr,
  bxor,
  zip
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

function map(obj) {
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
        into = into.concat([fun.apply(this, args)]);
      }
    }

    return into;
  } else {
    let _into = [];

    for (let elem of collection) {
      let r = Patterns.match_no_throw(pattern, elem);
      if (r) {
        _into = into.concat(this._for(collections.slice(1), fun, filter, _into, previousValues.concat(r)));
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

var special_forms = {
  list,
  bitstring,
  tuple,
  _case,
  cond,
  map,
  map_update,
  _for,
  _try
};

Functions.get_global().processes = Functions.get_global().processes || new ProcessSystem();



var C = Object.freeze({
	ProcessSystem: ProcessSystem,
	Tuple: Tuple,
	PID: PID,
	BitString: BitString,
	Patterns: Patterns,
	Integer: Integer,
	Float: Float,
	Functions: Functions,
	List: List,
	SpecialForms: special_forms
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
    if (Array.isArray(collection)) {
      if (n < this.count(collection) && n >= 0) {
        return new Tuple(Symbol.for("ok"), collection[n]);
      } else {
        return Symbol.for("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function (collection, n) {
    if (Array.isArray(collection)) {
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
    let mapped = List();
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = tuple.get(1);
      mapped = List(...mapped.concat([tuple.get(0)]));
    }

    return new Tuple(mapped, the_acc);
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

    return List(...result);
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

export { Core, Enum, VirtualDOM };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJFbGl4aXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuY2xhc3MgTWFpbGJveCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICB9XG5cbiAgZGVsaXZlcihtZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzO1xuICB9XG5cbiAgaXNFbXB0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5tZXNzYWdlcy5sZW5ndGggPT09IDA7XG4gIH1cblxuICByZW1vdmVBdChpbmRleCkge1xuICAgIHRoaXMubWVzc2FnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG52YXIgU3RhdGVzID0ge1xuICBOT1JNQUw6IFN5bWJvbC5mb3IoXCJub3JtYWxcIiksXG4gIEtJTEw6IFN5bWJvbC5mb3IoXCJraWxsXCIpLFxuICBTVVNQRU5EOiBTeW1ib2wuZm9yKFwic3VzcGVuZFwiKSxcbiAgQ09OVElOVUU6IFN5bWJvbC5mb3IoXCJjb250aW51ZVwiKSxcbiAgUkVDRUlWRTogU3ltYm9sLmZvcihcInJlY2VpdmVcIiksXG4gIFNFTkQ6IFN5bWJvbC5mb3IoXCJzZW5kXCIpLFxuICBTTEVFUElORzogU3ltYm9sLmZvcihcInNsZWVwaW5nXCIpLFxuICBSVU5OSU5HOiBTeW1ib2wuZm9yKFwicnVubmluZ1wiKSxcbiAgU1VTUEVOREVEOiBTeW1ib2wuZm9yKFwic3VzcGVuZGVkXCIpLFxuICBTVE9QUEVEOiBTeW1ib2wuZm9yKFwic3RvcHBlZFwiKSxcbiAgU0xFRVA6IFN5bWJvbC5mb3IoXCJzbGVlcFwiKSxcbiAgRVhJVDogU3ltYm9sLmZvcihcImV4aXRcIiksXG4gIE5PTUFUQ0g6IFN5bWJvbC5mb3IoXCJub19tYXRjaFwiKVxufTtcblxuY2xhc3MgUHJvY2VzcyB7XG5cbiAgY29uc3RydWN0b3IocGlkLCBtYWlsYm94KSB7XG4gICAgdGhpcy5waWQgPSBwaWQ7XG4gICAgdGhpcy5tYWlsYm94ID0gbWFpbGJveDtcbiAgICB0aGlzLnN0YXR1cyA9IFN0YXRlcy5TVE9QUEVEO1xuICAgIHRoaXMuZGljdCA9IHt9O1xuICB9XG59XG5cbmNsYXNzIFR1cGxlIHtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgdGhpcy52YWx1ZXMgPSBPYmplY3QuZnJlZXplKGFyZ3MpO1xuICAgIHRoaXMubGVuZ3RoID0gdGhpcy52YWx1ZXMubGVuZ3RoO1xuICB9XG5cbiAgZ2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgfVxuXG4gIGNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5sZW5ndGg7XG4gIH1cblxuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXNbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgdmFyIGksXG4gICAgICAgIHMgPSBcIlwiO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHMgIT09IFwiXCIpIHtcbiAgICAgICAgcyArPSBcIiwgXCI7XG4gICAgICB9XG4gICAgICBzICs9IHRoaXMudmFsdWVzW2ldLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwie1wiICsgcyArIFwifVwiO1xuICB9XG5cbn1cblxubGV0IHByb2Nlc3NfY291bnRlciA9IC0xO1xuXG5jbGFzcyBQSUQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBwcm9jZXNzX2NvdW50ZXIgPSBwcm9jZXNzX2NvdW50ZXIgKyAxO1xuICAgIHRoaXMuaWQgPSBwcm9jZXNzX2NvdW50ZXI7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gXCJQSUQjPDAuXCIgKyB0aGlzLmlkICsgXCIuMD5cIjtcbiAgfVxufVxuXG5jbGFzcyBJbnRlZ2VyIHt9XG5jbGFzcyBGbG9hdCB7fVxuXG5mdW5jdGlvbiBMaXN0KC4uLmFyZ3MpIHtcbiAgcmV0dXJuIE9iamVjdC5mcmVlemUoYXJncyk7XG59XG5cbmNsYXNzIFByb2Nlc3NTeXN0ZW0ge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMucGlkcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLm1haWxib3hlcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLm5hbWVzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMubGlua3MgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLmN1cnJlbnRfcHJvY2VzcyA9IG51bGw7XG4gICAgdGhpcy5zdXNwZW5kZWQgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLm1haW5fcHJvY2Vzc19waWQgPSB0aGlzLnNwYXduKCk7XG4gICAgdGhpcy5zZXRfY3VycmVudCh0aGlzLm1haW5fcHJvY2Vzc19waWQpO1xuICB9XG5cbiAgc3Bhd24oKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkX3Byb2MoZmFsc2UpLnBpZDtcbiAgfVxuXG4gIHNwYXduX2xpbmsoKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkX3Byb2ModHJ1ZSkucGlkO1xuICB9XG5cbiAgbGluayhwaWQpIHtcbiAgICB0aGlzLmxpbmtzLmdldCh0aGlzLnBpZCgpKS5hZGQocGlkKTtcbiAgICB0aGlzLmxpbmtzLmdldChwaWQpLmFkZCh0aGlzLnBpZCgpKTtcbiAgfVxuXG4gIHVubGluayhwaWQpIHtcbiAgICB0aGlzLmxpbmtzLmdldCh0aGlzLnBpZCgpKS5kZWxldGUocGlkKTtcbiAgICB0aGlzLmxpbmtzLmdldChwaWQpLmRlbGV0ZSh0aGlzLnBpZCgpKTtcbiAgfVxuXG4gIHNldF9jdXJyZW50KGlkKSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIGlmIChwaWQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY3VycmVudF9wcm9jZXNzID0gdGhpcy5waWRzLmdldChwaWQpO1xuICAgICAgdGhpcy5jdXJyZW50X3Byb2Nlc3Muc3RhdHVzID0gU3RhdGVzLlJVTk5JTkc7XG4gICAgfVxuICB9XG5cbiAgYWRkX3Byb2MobGlua2VkKSB7XG4gICAgbGV0IG5ld3BpZCA9IG5ldyBQSUQoKTtcbiAgICBsZXQgbWFpbGJveCA9IG5ldyBNYWlsYm94KCk7XG4gICAgbGV0IG5ld3Byb2MgPSBuZXcgUHJvY2VzcyhuZXdwaWQsIG1haWxib3gpO1xuXG4gICAgdGhpcy5waWRzLnNldChuZXdwaWQsIG5ld3Byb2MpO1xuICAgIHRoaXMubWFpbGJveGVzLnNldChuZXdwaWQsIG1haWxib3gpO1xuICAgIHRoaXMubGlua3Muc2V0KG5ld3BpZCwgbmV3IFNldCgpKTtcblxuICAgIGlmIChsaW5rZWQpIHtcbiAgICAgIHRoaXMubGluayhuZXdwaWQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXdwcm9jO1xuICB9XG5cbiAgcmVtb3ZlX3Byb2MocGlkKSB7XG4gICAgdGhpcy5waWRzLmRlbGV0ZShwaWQpO1xuICAgIHRoaXMudW5yZWdpc3RlcihwaWQpO1xuXG4gICAgaWYgKHRoaXMubGlua3MuaGFzKHBpZCkpIHtcbiAgICAgIGZvciAobGV0IGxpbmtwaWQgb2YgdGhpcy5saW5rcy5nZXQocGlkKSkge1xuICAgICAgICB0aGlzLmxpbmtzLmdldChsaW5rcGlkKS5kZWxldGUocGlkKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5saW5rcy5kZWxldGUocGlkKTtcbiAgICB9XG4gIH1cblxuICBleGl0KGlkKSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIHRoaXMucmVtb3ZlX3Byb2MoaWQpO1xuICB9XG5cbiAgcmVnaXN0ZXIobmFtZSwgcGlkKSB7XG4gICAgaWYgKCF0aGlzLm5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgdGhpcy5uYW1lcy5zZXQobmFtZSwgcGlkKTtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYW1lIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCB0byBhbm90aGVyIHByb2Nlc3NcIik7XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJlZChuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZXMuaGFzKG5hbWUpID8gdGhpcy5uYW1lcy5nZXQobmFtZSkgOiBudWxsO1xuICB9XG5cbiAgdW5yZWdpc3RlcihwaWQpIHtcbiAgICBmb3IgKGxldCBuYW1lIG9mIHRoaXMubmFtZXMua2V5cygpKSB7XG4gICAgICBpZiAodGhpcy5uYW1lcy5oYXMobmFtZSkgJiYgdGhpcy5uYW1lcy5nZXQobmFtZSkgPT09IHBpZCkge1xuICAgICAgICB0aGlzLm5hbWVzLmRlbGV0ZShuYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudF9wcm9jZXNzLnBpZDtcbiAgfVxuXG4gIHBpZG9mKGlkKSB7XG4gICAgaWYgKGlkIGluc3RhbmNlb2YgUElEKSB7XG4gICAgICByZXR1cm4gdGhpcy5waWRzLmhhcyhpZCkgPyBpZCA6IG51bGw7XG4gICAgfSBlbHNlIGlmIChpZCBpbnN0YW5jZW9mIFByb2Nlc3MpIHtcbiAgICAgIHJldHVybiBpZC5waWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwaWQgPSB0aGlzLnJlZ2lzdGVyZWQoaWQpO1xuICAgICAgaWYgKHBpZCA9PT0gbnVsbCkgdGhyb3cgXCJQcm9jZXNzIG5hbWUgbm90IHJlZ2lzdGVyZWQ6IFwiICsgaWQgKyBcIiAoXCIgKyB0eXBlb2YgaWQgKyBcIilcIjtcbiAgICAgIHJldHVybiBwaWQ7XG4gICAgfVxuICB9XG5cbiAgcHV0KGlkLCBrZXksIHZhbHVlKSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIGxldCBwcm9jZXNzID0gdGhpcy5waWRzLmdldChwaWQpO1xuICAgIHByb2Nlc3MuZGljdFtrZXldID0gdmFsdWU7XG4gIH1cblxuICBnZXQoaWQsIGtleSkge1xuICAgIGxldCBwaWQgPSB0aGlzLnBpZG9mKGlkKTtcbiAgICBsZXQgcHJvY2VzcyA9IHRoaXMucGlkcy5nZXQocGlkKTtcblxuICAgIGlmIChrZXkgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHByb2Nlc3MuZGljdFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcHJvY2Vzcy5kaWN0O1xuICAgIH1cbiAgfVxuXG4gIGdldF9rZXlzKGlkKSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIGxldCBwcm9jZXNzID0gdGhpcy5waWRzLmdldChwaWQpO1xuXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHByb2Nlc3MuZGljdCk7XG4gIH1cblxuICBlcmFzZShpZCwga2V5KSB7XG4gICAgbGV0IHBpZCA9IHRoaXMucGlkb2YoaWQpO1xuICAgIGxldCBwcm9jZXNzID0gdGhpcy5waWRzLmdldChwaWQpO1xuXG4gICAgaWYgKGtleSAhPSBudWxsKSB7XG4gICAgICBkZWxldGUgcHJvY2Vzcy5kaWN0W2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2Nlc3MuZGljdCA9IHt9O1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBCaXRTdHJpbmcge1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgdGhpcy5yYXdfdmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShhcmdzKTtcbiAgICB9O1xuXG4gICAgdGhpcy52YWx1ZSA9IE9iamVjdC5mcmVlemUodGhpcy5wcm9jZXNzKGFyZ3MpKTtcbiAgfVxuXG4gIGdldChpbmRleCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlW2luZGV4XTtcbiAgfVxuXG4gIGNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgfVxuXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHZhciBpLFxuICAgICAgICBzID0gXCJcIjtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5jb3VudCgpOyBpKyspIHtcbiAgICAgIGlmIChzICE9PSBcIlwiKSB7XG4gICAgICAgIHMgKz0gXCIsIFwiO1xuICAgICAgfVxuICAgICAgcyArPSB0aGlzW2ldLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiPDxcIiArIHMgKyBcIj4+XCI7XG4gIH1cblxuICBwcm9jZXNzKCkge1xuICAgIGxldCBwcm9jZXNzZWRfdmFsdWVzID0gW107XG5cbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5yYXdfdmFsdWUoKS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHByb2Nlc3NlZF92YWx1ZSA9IHRoaXNbXCJwcm9jZXNzX1wiICsgdGhpcy5yYXdfdmFsdWUoKVtpXS50eXBlXSh0aGlzLnJhd192YWx1ZSgpW2ldKTtcblxuICAgICAgZm9yIChsZXQgYXR0ciBvZiB0aGlzLnJhd192YWx1ZSgpW2ldLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcHJvY2Vzc2VkX3ZhbHVlID0gdGhpc1tcInByb2Nlc3NfXCIgKyBhdHRyXShwcm9jZXNzZWRfdmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBwcm9jZXNzZWRfdmFsdWVzID0gcHJvY2Vzc2VkX3ZhbHVlcy5jb25jYXQocHJvY2Vzc2VkX3ZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc2VkX3ZhbHVlcztcbiAgfVxuXG4gIHByb2Nlc3NfaW50ZWdlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS52YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfZmxvYXQodmFsdWUpIHtcbiAgICBpZiAodmFsdWUuc2l6ZSA9PT0gNjQpIHtcbiAgICAgIHJldHVybiBCaXRTdHJpbmcuZmxvYXQ2NFRvQnl0ZXModmFsdWUudmFsdWUpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUuc2l6ZSA9PT0gMzIpIHtcbiAgICAgIHJldHVybiBCaXRTdHJpbmcuZmxvYXQzMlRvQnl0ZXModmFsdWUudmFsdWUpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2l6ZSBmb3IgZmxvYXRcIik7XG4gIH1cblxuICBwcm9jZXNzX2JpdHN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS52YWx1ZS52YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfYmluYXJ5KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjhBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3V0ZjgodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLnRvVVRGOEFycmF5KHZhbHVlLnZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3NfdXRmMTYodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLnRvVVRGMTZBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3V0ZjMyKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjMyQXJyYXkodmFsdWUudmFsdWUpO1xuICB9XG5cbiAgcHJvY2Vzc19zaWduZWQodmFsdWUpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW3ZhbHVlXSlbMF07XG4gIH1cblxuICBwcm9jZXNzX3Vuc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc19uYXRpdmUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2JpZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfbGl0dGxlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJldmVyc2UoKTtcbiAgfVxuXG4gIHByb2Nlc3Nfc2l6ZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfdW5pdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHN0YXRpYyBpbnRlZ2VyKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImludGVnZXJcIiwgXCJ1bml0XCI6IDEsIFwic2l6ZVwiOiA4IH0pO1xuICB9XG5cbiAgc3RhdGljIGZsb2F0KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImZsb2F0XCIsIFwidW5pdFwiOiAxLCBcInNpemVcIjogNjQgfSk7XG4gIH1cblxuICBzdGF0aWMgYml0c3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImJpdHN0cmluZ1wiLCBcInVuaXRcIjogMSwgXCJzaXplXCI6IHZhbHVlLmxlbmd0aCB9KTtcbiAgfVxuXG4gIHN0YXRpYyBiaXRzKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy5iaXRzdHJpbmcodmFsdWUpO1xuICB9XG5cbiAgc3RhdGljIGJpbmFyeSh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJiaW5hcnlcIiwgXCJ1bml0XCI6IDgsIFwic2l6ZVwiOiB2YWx1ZS5sZW5ndGggfSk7XG4gIH1cblxuICBzdGF0aWMgYnl0ZXModmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLmJpbmFyeSh2YWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgdXRmOCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJ1dGY4XCIgfSk7XG4gIH1cblxuICBzdGF0aWMgdXRmMTYodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwidXRmMTZcIiB9KTtcbiAgfVxuXG4gIHN0YXRpYyB1dGYzMih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJ1dGYzMlwiIH0pO1xuICB9XG5cbiAgc3RhdGljIHNpZ25lZCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwge30sIFwic2lnbmVkXCIpO1xuICB9XG5cbiAgc3RhdGljIHVuc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJ1bnNpZ25lZFwiKTtcbiAgfVxuXG4gIHN0YXRpYyBuYXRpdmUodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcIm5hdGl2ZVwiKTtcbiAgfVxuXG4gIHN0YXRpYyBiaWcodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcImJpZ1wiKTtcbiAgfVxuXG4gIHN0YXRpYyBsaXR0bGUodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcImxpdHRsZVwiKTtcbiAgfVxuXG4gIHN0YXRpYyBzaXplKHZhbHVlLCBjb3VudCkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInNpemVcIjogY291bnQgfSk7XG4gIH1cblxuICBzdGF0aWMgdW5pdCh2YWx1ZSwgY291bnQpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ1bml0XCI6IGNvdW50IH0pO1xuICB9XG5cbiAgc3RhdGljIHdyYXAodmFsdWUsIG9wdCwgbmV3X2F0dHJpYnV0ZSA9IG51bGwpIHtcbiAgICBsZXQgdGhlX3ZhbHVlID0gdmFsdWU7XG5cbiAgICBpZiAoISh2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCkpIHtcbiAgICAgIHRoZV92YWx1ZSA9IHsgXCJ2YWx1ZVwiOiB2YWx1ZSwgXCJhdHRyaWJ1dGVzXCI6IFtdIH07XG4gICAgfVxuXG4gICAgdGhlX3ZhbHVlID0gT2JqZWN0LmFzc2lnbih0aGVfdmFsdWUsIG9wdCk7XG5cbiAgICBpZiAobmV3X2F0dHJpYnV0ZSkge1xuICAgICAgdGhlX3ZhbHVlLmF0dHJpYnV0ZXMucHVzaChuZXdfYXR0cmlidXRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhlX3ZhbHVlO1xuICB9XG5cbiAgc3RhdGljIHRvVVRGOEFycmF5KHN0cikge1xuICAgIHZhciB1dGY4ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGFyY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNoYXJjb2RlIDwgMTI4KSB7XG4gICAgICAgIHV0ZjgucHVzaChjaGFyY29kZSk7XG4gICAgICB9IGVsc2UgaWYgKGNoYXJjb2RlIDwgMjA0OCkge1xuICAgICAgICB1dGY4LnB1c2goMTkyIHwgY2hhcmNvZGUgPj4gNiwgMTI4IHwgY2hhcmNvZGUgJiA2Myk7XG4gICAgICB9IGVsc2UgaWYgKGNoYXJjb2RlIDwgNTUyOTYgfHwgY2hhcmNvZGUgPj0gNTczNDQpIHtcbiAgICAgICAgdXRmOC5wdXNoKDIyNCB8IGNoYXJjb2RlID4+IDEyLCAxMjggfCBjaGFyY29kZSA+PiA2ICYgNjMsIDEyOCB8IGNoYXJjb2RlICYgNjMpO1xuICAgICAgfVxuICAgICAgLy8gc3Vycm9nYXRlIHBhaXJcbiAgICAgIGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICAgIC8vIFVURi0xNiBlbmNvZGVzIDB4MTAwMDAtMHgxMEZGRkYgYnlcbiAgICAgICAgLy8gc3VidHJhY3RpbmcgMHgxMDAwMCBhbmQgc3BsaXR0aW5nIHRoZVxuICAgICAgICAvLyAyMCBiaXRzIG9mIDB4MC0weEZGRkZGIGludG8gdHdvIGhhbHZlc1xuICAgICAgICBjaGFyY29kZSA9IDY1NTM2ICsgKChjaGFyY29kZSAmIDEwMjMpIDw8IDEwIHwgc3RyLmNoYXJDb2RlQXQoaSkgJiAxMDIzKTtcbiAgICAgICAgdXRmOC5wdXNoKDI0MCB8IGNoYXJjb2RlID4+IDE4LCAxMjggfCBjaGFyY29kZSA+PiAxMiAmIDYzLCAxMjggfCBjaGFyY29kZSA+PiA2ICYgNjMsIDEyOCB8IGNoYXJjb2RlICYgNjMpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXRmODtcbiAgfVxuXG4gIHN0YXRpYyB0b1VURjE2QXJyYXkoc3RyKSB7XG4gICAgdmFyIHV0ZjE2ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb2RlUG9pbnQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG5cbiAgICAgIGlmIChjb2RlUG9pbnQgPD0gMjU1KSB7XG4gICAgICAgIHV0ZjE2LnB1c2goMCk7XG4gICAgICAgIHV0ZjE2LnB1c2goY29kZVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHV0ZjE2LnB1c2goY29kZVBvaW50ID4+IDggJiAyNTUpO1xuICAgICAgICB1dGYxNi5wdXNoKGNvZGVQb2ludCAmIDI1NSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1dGYxNjtcbiAgfVxuXG4gIHN0YXRpYyB0b1VURjMyQXJyYXkoc3RyKSB7XG4gICAgdmFyIHV0ZjMyID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb2RlUG9pbnQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG5cbiAgICAgIGlmIChjb2RlUG9pbnQgPD0gMjU1KSB7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goY29kZVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goY29kZVBvaW50ID4+IDggJiAyNTUpO1xuICAgICAgICB1dGYzMi5wdXNoKGNvZGVQb2ludCAmIDI1NSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1dGYzMjtcbiAgfVxuXG4gIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMDAzNDkzL2phdmFzY3JpcHQtZmxvYXQtZnJvbS10by1iaXRzXG4gIHN0YXRpYyBmbG9hdDMyVG9CeXRlcyhmKSB7XG4gICAgdmFyIGJ5dGVzID0gW107XG5cbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDQpO1xuICAgIG5ldyBGbG9hdDMyQXJyYXkoYnVmKVswXSA9IGY7XG5cbiAgICBsZXQgaW50VmVyc2lvbiA9IG5ldyBVaW50MzJBcnJheShidWYpWzBdO1xuXG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uID4+IDI0ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gPj4gMTYgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbiA+PiA4ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gJiAyNTUpO1xuXG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG5cbiAgc3RhdGljIGZsb2F0NjRUb0J5dGVzKGYpIHtcbiAgICB2YXIgYnl0ZXMgPSBbXTtcblxuICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoOCk7XG4gICAgbmV3IEZsb2F0NjRBcnJheShidWYpWzBdID0gZjtcblxuICAgIHZhciBpbnRWZXJzaW9uMSA9IG5ldyBVaW50MzJBcnJheShidWYpWzBdO1xuICAgIHZhciBpbnRWZXJzaW9uMiA9IG5ldyBVaW50MzJBcnJheShidWYpWzFdO1xuXG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiAyNCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiAxNiAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiA4ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24yICYgMjU1KTtcblxuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gMjQgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gMTYgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gOCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMSAmIDI1NSk7XG5cbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbn1cblxuLyogQGZsb3cgKi9cblxuY2xhc3MgVmFyaWFibGUge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUgPSBudWxsKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgfVxufVxuXG5jbGFzcyBXaWxkY2FyZCB7XG4gIGNvbnN0cnVjdG9yKCkge31cbn1cblxuY2xhc3MgU3RhcnRzV2l0aCB7XG5cbiAgY29uc3RydWN0b3IocHJlZml4KSB7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXg7XG4gIH1cbn1cblxuY2xhc3MgQ2FwdHVyZSB7XG5cbiAgY29uc3RydWN0b3IodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cblxuY2xhc3MgSGVhZFRhaWwge1xuICBjb25zdHJ1Y3RvcigpIHt9XG59XG5cbmNsYXNzIFR5cGUge1xuXG4gIGNvbnN0cnVjdG9yKHR5cGUsIG9ialBhdHRlcm4gPSB7fSkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5vYmpQYXR0ZXJuID0gb2JqUGF0dGVybjtcbiAgfVxufVxuXG5jbGFzcyBCb3VuZCB7XG5cbiAgY29uc3RydWN0b3IodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFyaWFibGUobmFtZSA9IG51bGwpIHtcbiAgcmV0dXJuIG5ldyBWYXJpYWJsZShuYW1lKTtcbn1cblxuZnVuY3Rpb24gd2lsZGNhcmQoKSB7XG4gIHJldHVybiBuZXcgV2lsZGNhcmQoKTtcbn1cblxuZnVuY3Rpb24gc3RhcnRzV2l0aChwcmVmaXgpIHtcbiAgcmV0dXJuIG5ldyBTdGFydHNXaXRoKHByZWZpeCk7XG59XG5cbmZ1bmN0aW9uIGNhcHR1cmUodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBDYXB0dXJlKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gaGVhZFRhaWwoKSB7XG4gIHJldHVybiBuZXcgSGVhZFRhaWwoKTtcbn1cblxuZnVuY3Rpb24gdHlwZSh0eXBlLCBvYmpQYXR0ZXJuID0ge30pIHtcbiAgcmV0dXJuIG5ldyBUeXBlKHR5cGUsIG9ialBhdHRlcm4pO1xufVxuXG5mdW5jdGlvbiBib3VuZCh2YWx1ZSkge1xuICByZXR1cm4gbmV3IEJvdW5kKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gaXNfbnVtYmVyKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc19zdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7XG59XG5cbmZ1bmN0aW9uIGlzX2Jvb2xlYW4odmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nO1xufVxuXG5mdW5jdGlvbiBpc19zeW1ib2wodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N5bWJvbCc7XG59XG5cbmZ1bmN0aW9uIGlzX251bGwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc191bmRlZmluZWQodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCc7XG59XG5cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59XG5cbmZ1bmN0aW9uIGlzX3ZhcmlhYmxlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFZhcmlhYmxlO1xufVxuXG5mdW5jdGlvbiBpc193aWxkY2FyZCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBXaWxkY2FyZDtcbn1cblxuZnVuY3Rpb24gaXNfaGVhZFRhaWwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgSGVhZFRhaWw7XG59XG5cbmZ1bmN0aW9uIGlzX2NhcHR1cmUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQ2FwdHVyZTtcbn1cblxuZnVuY3Rpb24gaXNfdHlwZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBUeXBlO1xufVxuXG5mdW5jdGlvbiBpc19zdGFydHNXaXRoKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFN0YXJ0c1dpdGg7XG59XG5cbmZ1bmN0aW9uIGlzX2JvdW5kKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kO1xufVxuXG5mdW5jdGlvbiBpc19vYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59XG5cbmZ1bmN0aW9uIGlzX2FycmF5KHZhbHVlKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxudmFyIENoZWNrcyA9IHtcbiAgaXNfbnVtYmVyLFxuICBpc19zdHJpbmcsXG4gIGlzX2Jvb2xlYW4sXG4gIGlzX3N5bWJvbCxcbiAgaXNfbnVsbCxcbiAgaXNfdW5kZWZpbmVkLFxuICBpc19mdW5jdGlvbixcbiAgaXNfdmFyaWFibGUsXG4gIGlzX3dpbGRjYXJkLFxuICBpc19oZWFkVGFpbCxcbiAgaXNfY2FwdHVyZSxcbiAgaXNfdHlwZSxcbiAgaXNfc3RhcnRzV2l0aCxcbiAgaXNfYm91bmQsXG4gIGlzX29iamVjdCxcbiAgaXNfYXJyYXlcbn07XG5cbmZ1bmN0aW9uIHJlc29sdmVTeW1ib2wocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19zeW1ib2wodmFsdWUpICYmIHZhbHVlID09PSBwYXR0ZXJuO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3RyaW5nKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfc3RyaW5nKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU51bWJlcihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX251bWJlcih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVCb29sZWFuKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfYm9vbGVhbih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVGdW5jdGlvbihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX2Z1bmN0aW9uKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU51bGwocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19udWxsKHZhbHVlKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUJvdW5kKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IHR5cGVvZiBwYXR0ZXJuLnZhbHVlICYmIHZhbHVlID09PSBwYXR0ZXJuLnZhbHVlKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlV2lsZGNhcmQoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVWYXJpYWJsZSgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGFyZ3MucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVIZWFkVGFpbCgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX2FycmF5KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZCA9IHZhbHVlWzBdO1xuICAgIGNvbnN0IHRhaWwgPSB2YWx1ZS5zbGljZSgxKTtcblxuICAgIGFyZ3MucHVzaChoZWFkKTtcbiAgICBhcmdzLnB1c2godGFpbCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUNhcHR1cmUocGF0dGVybikge1xuICBjb25zdCBtYXRjaGVzID0gYnVpbGRNYXRjaChwYXR0ZXJuLnZhbHVlKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKG1hdGNoZXModmFsdWUsIGFyZ3MpKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3RhcnRzV2l0aChwYXR0ZXJuKSB7XG4gIGNvbnN0IHByZWZpeCA9IHBhdHRlcm4ucHJlZml4O1xuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAoQ2hlY2tzLmlzX3N0cmluZyh2YWx1ZSkgJiYgdmFsdWUuc3RhcnRzV2l0aChwcmVmaXgpKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUuc3Vic3RyaW5nKHByZWZpeC5sZW5ndGgpKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVR5cGUocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgcGF0dGVybi50eXBlKSB7XG4gICAgICBjb25zdCBtYXRjaGVzID0gYnVpbGRNYXRjaChwYXR0ZXJuLm9ialBhdHRlcm4pO1xuICAgICAgcmV0dXJuIG1hdGNoZXModmFsdWUsIGFyZ3MpICYmIGFyZ3MucHVzaCh2YWx1ZSkgPiAwO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUFycmF5KHBhdHRlcm4pIHtcbiAgY29uc3QgbWF0Y2hlcyA9IHBhdHRlcm4ubWFwKHggPT4gYnVpbGRNYXRjaCh4KSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX2FycmF5KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggIT0gcGF0dGVybi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWUuZXZlcnkoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgIHJldHVybiBtYXRjaGVzW2ldKHZhbHVlW2ldLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU9iamVjdChwYXR0ZXJuKSB7XG4gIGxldCBtYXRjaGVzID0ge307XG5cbiAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHBhdHRlcm4pLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHBhdHRlcm4pKSkge1xuICAgIG1hdGNoZXNba2V5XSA9IGJ1aWxkTWF0Y2gocGF0dGVybltrZXldKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAoIUNoZWNrcy5pc19vYmplY3QodmFsdWUpIHx8IHBhdHRlcm4ubGVuZ3RoID4gdmFsdWUubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHBhdHRlcm4pLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHBhdHRlcm4pKSkge1xuICAgICAgaWYgKCEoa2V5IGluIHZhbHVlKSB8fCAhbWF0Y2hlc1trZXldKHZhbHVlW2tleV0sIGFyZ3MpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU5vTWF0Y2goKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG52YXIgUmVzb2x2ZXJzID0ge1xuICByZXNvbHZlQm91bmQsXG4gIHJlc29sdmVXaWxkY2FyZCxcbiAgcmVzb2x2ZVZhcmlhYmxlLFxuICByZXNvbHZlSGVhZFRhaWwsXG4gIHJlc29sdmVDYXB0dXJlLFxuICByZXNvbHZlU3RhcnRzV2l0aCxcbiAgcmVzb2x2ZVR5cGUsXG4gIHJlc29sdmVBcnJheSxcbiAgcmVzb2x2ZU9iamVjdCxcbiAgcmVzb2x2ZU5vTWF0Y2gsXG4gIHJlc29sdmVTeW1ib2wsXG4gIHJlc29sdmVTdHJpbmcsXG4gIHJlc29sdmVOdW1iZXIsXG4gIHJlc29sdmVCb29sZWFuLFxuICByZXNvbHZlRnVuY3Rpb24sXG4gIHJlc29sdmVOdWxsXG59O1xuXG5mdW5jdGlvbiBidWlsZE1hdGNoKHBhdHRlcm4pIHtcblxuICBpZiAoQ2hlY2tzLmlzX3ZhcmlhYmxlKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlVmFyaWFibGUocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3dpbGRjYXJkKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlV2lsZGNhcmQocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3VuZGVmaW5lZChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVdpbGRjYXJkKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19oZWFkVGFpbChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUhlYWRUYWlsKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19zdGFydHNXaXRoKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlU3RhcnRzV2l0aChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfY2FwdHVyZShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUNhcHR1cmUocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2JvdW5kKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlQm91bmQocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3R5cGUocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVUeXBlKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19hcnJheShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUFycmF5KHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19udW1iZXIocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVOdW1iZXIocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3N0cmluZyhwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVN0cmluZyhwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfYm9vbGVhbihwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZUJvb2xlYW4ocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3N5bWJvbChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVN5bWJvbChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfbnVsbChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZU51bGwocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX29iamVjdChwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZU9iamVjdChwYXR0ZXJuKTtcbiAgfVxuXG4gIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZU5vTWF0Y2goKTtcbn1cblxuY2xhc3MgTWF0Y2hFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoYXJnKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3ltYm9sJykge1xuICAgICAgdGhpcy5tZXNzYWdlID0gJ05vIG1hdGNoIGZvcjogJyArIGFyZy50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG4gICAgICBsZXQgbWFwcGVkVmFsdWVzID0gYXJnLm1hcCh4ID0+IHgudG9TdHJpbmcoKSk7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSAnTm8gbWF0Y2ggZm9yOiAnICsgbWFwcGVkVmFsdWVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSAnTm8gbWF0Y2ggZm9yOiAnICsgYXJnO1xuICAgIH1cblxuICAgIHRoaXMuc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICB0aGlzLm5hbWUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cblxuY2xhc3MgQ2FzZSB7XG5cbiAgY29uc3RydWN0b3IocGF0dGVybiwgZm4sIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICAgIHRoaXMucGF0dGVybiA9IGJ1aWxkTWF0Y2gocGF0dGVybik7XG4gICAgdGhpcy5mbiA9IGZuO1xuICAgIHRoaXMuZ3VhcmQgPSBndWFyZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlX2Nhc2UocGF0dGVybiwgZm4sIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICByZXR1cm4gbmV3IENhc2UocGF0dGVybiwgZm4sIGd1YXJkKTtcbn1cblxuZnVuY3Rpb24gZGVmbWF0Y2goLi4uY2FzZXMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgZm9yIChsZXQgcHJvY2Vzc2VkQ2FzZSBvZiBjYXNlcykge1xuICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgaWYgKHByb2Nlc3NlZENhc2UucGF0dGVybihhcmdzLCByZXN1bHQpICYmIHByb2Nlc3NlZENhc2UuZ3VhcmQuYXBwbHkodGhpcywgcmVzdWx0KSkge1xuICAgICAgICByZXR1cm4gcHJvY2Vzc2VkQ2FzZS5mbi5hcHBseSh0aGlzLCByZXN1bHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBNYXRjaEVycm9yKGFyZ3MpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBtYXRjaChwYXR0ZXJuLCBleHByLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgbGV0IHJlc3VsdCA9IFtdO1xuICBsZXQgcHJvY2Vzc2VkUGF0dGVybiA9IGJ1aWxkTWF0Y2gocGF0dGVybik7XG4gIGlmIChwcm9jZXNzZWRQYXR0ZXJuKGV4cHIsIHJlc3VsdCkgJiYgZ3VhcmQuYXBwbHkodGhpcywgcmVzdWx0KSkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IE1hdGNoRXJyb3IoZXhwcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZXhwciwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG1hdGNoKHBhdHRlcm4sIGV4cHIsIGd1YXJkKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgTWF0Y2hFcnJvcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG52YXIgUGF0dGVybnMgPSB7XG4gIGRlZm1hdGNoLCBtYXRjaCwgTWF0Y2hFcnJvciwgbWF0Y2hfbm9fdGhyb3csXG4gIHZhcmlhYmxlLCB3aWxkY2FyZCwgc3RhcnRzV2l0aCxcbiAgY2FwdHVyZSwgaGVhZFRhaWwsIHR5cGUsIGJvdW5kLCBDYXNlLCBtYWtlX2Nhc2Vcbn07XG5cbmZ1bmN0aW9uIGNhbGxfcHJvcGVydHkoaXRlbSwgcHJvcGVydHkpIHtcbiAgaWYgKHByb3BlcnR5IGluIGl0ZW0pIHtcbiAgICBpdGVtW3Byb3BlcnR5XTtcbiAgICBpZiAoaXRlbVtwcm9wZXJ0eV0gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIGl0ZW1bcHJvcGVydHldKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BlcnR5XTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoU3ltYm9sLmZvcihwcm9wZXJ0eSkgaW4gaXRlbSkge1xuICAgIGxldCBwcm9wID0gU3ltYm9sLmZvcihwcm9wZXJ0eSk7XG4gICAgaWYgKGl0ZW1bcHJvcF0gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIGl0ZW1bcHJvcF0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZW1bcHJvcF07XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKGBQcm9wZXJ0eSAkeyBwcm9wZXJ0eSB9IG5vdCBmb3VuZCBpbiAkeyBpdGVtIH1gKTtcbn1cblxuZnVuY3Rpb24gYXBwbHkoLi4uYXJncykge1xuICBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICBhcmdzWzBdLmFwcGx5KG51bGwsIGFyZ3Muc2xpY2UoMSkpO1xuICB9IGVsc2Uge1xuICAgIGFyZ3NbMF1bYXJnc1sxXV0uYXBwbHkobnVsbCwgYXJncy5zbGljZSgyKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udGFpbnMobGVmdCwgcmlnaHQpIHtcbiAgZm9yIChsZXQgeCBvZiByaWdodCkge1xuICAgIGlmIChQYXR0ZXJucy5tYXRjaF9ub190aHJvdyhsZWZ0LCB4KSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGdldF9nbG9iYWwoKSB7XG4gIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gc2VsZjtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiB3aW5kb3c7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZ2xvYmFsO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKCdObyBnbG9iYWwgc3RhdGUgZm91bmQnKTtcbn1cblxuZnVuY3Rpb24gZGVmc3RydWN0KGRlZmF1bHRzKSB7XG4gIHJldHVybiBjbGFzcyB7XG4gICAgY29uc3RydWN0b3IodXBkYXRlID0ge30pIHtcbiAgICAgIGxldCB0aGVfdmFsdWVzID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgdXBkYXRlKTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgdGhlX3ZhbHVlcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZSh1cGRhdGVzID0ge30pIHtcbiAgICAgIGxldCB4ID0gbmV3IHRoaXModXBkYXRlcyk7XG4gICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh4KTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlZmV4Y2VwdGlvbihkZWZhdWx0cykge1xuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IodXBkYXRlID0ge30pIHtcbiAgICAgIGxldCBtZXNzYWdlID0gdXBkYXRlLm1lc3NhZ2UgfHwgJyc7XG4gICAgICBzdXBlcihtZXNzYWdlKTtcblxuICAgICAgbGV0IHRoZV92YWx1ZXMgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRzLCB1cGRhdGUpO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCB0aGVfdmFsdWVzKTtcblxuICAgICAgdGhpcy5uYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgIHRoaXNbU3BlY2lhbEZvcm1zLmF0b20oJ19fZXhjZXB0aW9uX18nKV0gPSB0cnVlO1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlKHVwZGF0ZXMgPSB7fSkge1xuICAgICAgbGV0IHggPSBuZXcgdGhpcyh1cGRhdGVzKTtcbiAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHgpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVmcHJvdG9jb2woc3BlYykge1xuICByZXR1cm4gbmV3IFByb3RvY29sKHNwZWMpO1xufVxuXG5mdW5jdGlvbiBkZWZpbXBsKHByb3RvY29sLCB0eXBlLCBpbXBsKSB7XG4gIHByb3RvY29sLmltcGxlbWVudGF0aW9uKHR5cGUsIGltcGwpO1xufVxuXG5mdW5jdGlvbiBnZXRfb2JqZWN0X2tleXMob2JqKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iaikpO1xufVxuXG5mdW5jdGlvbiBpc192YWxpZF9jaGFyYWN0ZXIoY29kZXBvaW50KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGVwb2ludCkgIT0gbnVsbDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vL2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3dCYXNlNjQvQmFzZTY0X2VuY29kaW5nX2FuZF9kZWNvZGluZyNTb2x1dGlvbl8yXyVFMiU4MCU5M19yZXdyaXRlX3RoZV9ET01zX2F0b2IoKV9hbmRfYnRvYSgpX3VzaW5nX0phdmFTY3JpcHQnc19UeXBlZEFycmF5c19hbmRfVVRGLThcbmZ1bmN0aW9uIGI2NEVuY29kZVVuaWNvZGUoc3RyKSB7XG4gIHJldHVybiBidG9hKGVuY29kZVVSSUNvbXBvbmVudChzdHIpLnJlcGxhY2UoLyUoWzAtOUEtRl17Mn0pL2csIGZ1bmN0aW9uIChtYXRjaCwgcDEpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgnMHgnICsgcDEpO1xuICB9KSk7XG59XG5cbmZ1bmN0aW9uIGRlbGV0ZV9wcm9wZXJ0eV9mcm9tX21hcChtYXAsIHByb3BlcnR5KSB7XG4gIGxldCBuZXdfbWFwID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG1hcC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpLCBtYXApO1xuICBkZWxldGUgbmV3X21hcFtwcm9wZXJ0eV07XG5cbiAgcmV0dXJuIE9iamVjdC5mcmVlemUobmV3X21hcCk7XG59XG5cbmZ1bmN0aW9uIGNsYXNzX3RvX29iaihtYXApIHtcbiAgbGV0IG5ld19tYXAgPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICByZXR1cm4gT2JqZWN0LmZyZWV6ZShuZXdfbWFwKTtcbn1cblxuZnVuY3Rpb24gYWRkX3Byb3BlcnR5X3RvX21hcChtYXAsIHByb3BlcnR5LCB2YWx1ZSkge1xuICBsZXQgbmV3X21hcCA9IE9iamVjdC5hc3NpZ24oe30sIG1hcCk7XG4gIG5ld19tYXBbcHJvcGVydHldID0gdmFsdWU7XG4gIHJldHVybiBPYmplY3QuZnJlZXplKG5ld19tYXApO1xufVxuXG5mdW5jdGlvbiBibm90KGV4cHIpIHtcbiAgcmV0dXJuIH5leHByO1xufVxuXG5mdW5jdGlvbiBiYW5kKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0ICYgcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGJvcihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCB8IHJpZ2h0O1xufVxuXG5mdW5jdGlvbiBic2wobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgPDwgcmlnaHQ7XG59XG5cbmZ1bmN0aW9uIGJzcihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCA+PiByaWdodDtcbn1cblxuZnVuY3Rpb24gYnhvcihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCBeIHJpZ2h0O1xufVxuXG5mdW5jdGlvbiB6aXAobGlzdF9vZl9saXN0cykge1xuICBpZiAobGlzdF9vZl9saXN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShbXSk7XG4gIH1cblxuICBsZXQgbmV3X3ZhbHVlID0gW107XG4gIGxldCBzbWFsbGVzdF9sZW5ndGggPSBsaXN0X29mX2xpc3RzWzBdO1xuXG4gIGZvciAobGV0IHggb2YgbGlzdF9vZl9saXN0cykge1xuICAgIGlmICh4Lmxlbmd0aCA8IHNtYWxsZXN0X2xlbmd0aCkge1xuICAgICAgc21hbGxlc3RfbGVuZ3RoID0geC5sZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzbWFsbGVzdF9sZW5ndGg7IGkrKykge1xuICAgIGxldCBjdXJyZW50X3ZhbHVlID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBsaXN0X29mX2xpc3RzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjdXJyZW50X3ZhbHVlLnB1c2gobGlzdF9vZl9saXN0c1tqXVtpXSk7XG4gICAgfVxuXG4gICAgbmV3X3ZhbHVlLnB1c2gobmV3IFR1cGxlKC4uLmN1cnJlbnRfdmFsdWUpKTtcbiAgfVxuXG4gIHJldHVybiBPYmplY3QuZnJlZXplKG5ld192YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGNhbl9kZWNvZGU2NChkYXRhKSB7XG4gIHRyeSB7XG4gICAgYXRvYihkYXRhKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG52YXIgRnVuY3Rpb25zID0ge1xuICBjYWxsX3Byb3BlcnR5LFxuICBhcHBseSxcbiAgY29udGFpbnMsXG4gIGdldF9nbG9iYWwsXG4gIGRlZnN0cnVjdCxcbiAgZGVmZXhjZXB0aW9uLFxuICBkZWZwcm90b2NvbCxcbiAgZGVmaW1wbCxcbiAgZ2V0X29iamVjdF9rZXlzLFxuICBpc192YWxpZF9jaGFyYWN0ZXIsXG4gIGI2NEVuY29kZVVuaWNvZGUsXG4gIGRlbGV0ZV9wcm9wZXJ0eV9mcm9tX21hcCxcbiAgYWRkX3Byb3BlcnR5X3RvX21hcCxcbiAgY2xhc3NfdG9fb2JqLFxuICBjYW5fZGVjb2RlNjQsXG4gIGJub3QsXG4gIGJhbmQsXG4gIGJvcixcbiAgYnNsLFxuICBic3IsXG4gIGJ4b3IsXG4gIHppcFxufTtcblxuZnVuY3Rpb24gbGlzdCguLi5hcmdzKSB7XG4gIHJldHVybiBPYmplY3QuZnJlZXplKGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBiaXRzdHJpbmcoLi4uYXJncykge1xuICByZXR1cm4gbmV3IEJpdFN0cmluZyguLi5hcmdzKTtcbn1cblxuZnVuY3Rpb24gdHVwbGUoLi4uYXJncykge1xuICByZXR1cm4gbmV3IFR1cGxlKC4uLmFyZ3MpO1xufVxuXG5mdW5jdGlvbiBfY2FzZShjb25kaXRpb24sIGNsYXVzZXMpIHtcbiAgcmV0dXJuIFBhdHRlcm5zLmRlZm1hdGNoKC4uLmNsYXVzZXMpKGNvbmRpdGlvbik7XG59XG5cbmZ1bmN0aW9uIGNvbmQoY2xhdXNlcykge1xuICBmb3IgKGxldCBjbGF1c2Ugb2YgY2xhdXNlcykge1xuICAgIGlmIChjbGF1c2VbMF0pIHtcbiAgICAgIHJldHVybiBjbGF1c2VbMV0oKTtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoKTtcbn1cblxuZnVuY3Rpb24gbWFwKG9iaikge1xuICByZXR1cm4gT2JqZWN0LmZyZWV6ZShvYmopO1xufVxuXG5mdW5jdGlvbiBtYXBfdXBkYXRlKG1hcCwgdmFsdWVzKSB7XG4gIHJldHVybiBPYmplY3QuZnJlZXplKE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShtYXAuY29uc3RydWN0b3IucHJvdG90eXBlKSwgbWFwLCB2YWx1ZXMpKTtcbn1cblxuZnVuY3Rpb24gX2Zvcihjb2xsZWN0aW9ucywgZnVuLCBmaWx0ZXIgPSAoKSA9PiB0cnVlLCBpbnRvID0gW10sIHByZXZpb3VzVmFsdWVzID0gW10pIHtcbiAgbGV0IHBhdHRlcm4gPSBjb2xsZWN0aW9uc1swXVswXTtcbiAgbGV0IGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uc1swXVsxXTtcblxuICBpZiAoY29sbGVjdGlvbnMubGVuZ3RoID09PSAxKSB7XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGxldCByID0gUGF0dGVybnMubWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZWxlbSk7XG4gICAgICBsZXQgYXJncyA9IHByZXZpb3VzVmFsdWVzLmNvbmNhdChyKTtcblxuICAgICAgaWYgKHIgJiYgZmlsdGVyLmFwcGx5KHRoaXMsIGFyZ3MpKSB7XG4gICAgICAgIGludG8gPSBpbnRvLmNvbmNhdChbZnVuLmFwcGx5KHRoaXMsIGFyZ3MpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGludG87XG4gIH0gZWxzZSB7XG4gICAgbGV0IF9pbnRvID0gW107XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGxldCByID0gUGF0dGVybnMubWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZWxlbSk7XG4gICAgICBpZiAocikge1xuICAgICAgICBfaW50byA9IGludG8uY29uY2F0KHRoaXMuX2Zvcihjb2xsZWN0aW9ucy5zbGljZSgxKSwgZnVuLCBmaWx0ZXIsIF9pbnRvLCBwcmV2aW91c1ZhbHVlcy5jb25jYXQocikpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gX2ludG87XG4gIH1cbn1cblxuZnVuY3Rpb24gX3RyeShkb19mdW4sIHJlc2N1ZV9mdW5jdGlvbiwgY2F0Y2hfZnVuLCBlbHNlX2Z1bmN0aW9uLCBhZnRlcl9mdW5jdGlvbikge1xuICBsZXQgcmVzdWx0ID0gbnVsbDtcblxuICB0cnkge1xuICAgIHJlc3VsdCA9IGRvX2Z1bigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbGV0IGV4X3Jlc3VsdCA9IG51bGw7XG5cbiAgICBpZiAocmVzY3VlX2Z1bmN0aW9uKSB7XG4gICAgICB0cnkge1xuICAgICAgICBleF9yZXN1bHQgPSByZXNjdWVfZnVuY3Rpb24oZSk7XG4gICAgICAgIHJldHVybiBleF9yZXN1bHQ7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBpZiAoZXggaW5zdGFuY2VvZiBQYXR0ZXJucy5NYXRjaEVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2F0Y2hfZnVuKSB7XG4gICAgICB0cnkge1xuICAgICAgICBleF9yZXN1bHQgPSBjYXRjaF9mdW4oZSk7XG4gICAgICAgIHJldHVybiBleF9yZXN1bHQ7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBpZiAoZXggaW5zdGFuY2VvZiBQYXR0ZXJucy5NYXRjaEVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBlO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChhZnRlcl9mdW5jdGlvbikge1xuICAgICAgYWZ0ZXJfZnVuY3Rpb24oKTtcbiAgICB9XG4gIH1cblxuICBpZiAoZWxzZV9mdW5jdGlvbikge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZWxzZV9mdW5jdGlvbihyZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICBpZiAoZXggaW5zdGFuY2VvZiBQYXR0ZXJucy5NYXRjaEVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gTWF0Y2ggRm91bmQgaW4gRWxzZScpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBleDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG52YXIgc3BlY2lhbF9mb3JtcyA9IHtcbiAgbGlzdCxcbiAgYml0c3RyaW5nLFxuICB0dXBsZSxcbiAgX2Nhc2UsXG4gIGNvbmQsXG4gIG1hcCxcbiAgbWFwX3VwZGF0ZSxcbiAgX2ZvcixcbiAgX3RyeVxufTtcblxuRnVuY3Rpb25zLmdldF9nbG9iYWwoKS5wcm9jZXNzZXMgPSBGdW5jdGlvbnMuZ2V0X2dsb2JhbCgpLnByb2Nlc3NlcyB8fCBuZXcgUHJvY2Vzc1N5c3RlbSgpO1xuXG5cblxudmFyIEMgPSBPYmplY3QuZnJlZXplKHtcblx0UHJvY2Vzc1N5c3RlbTogUHJvY2Vzc1N5c3RlbSxcblx0VHVwbGU6IFR1cGxlLFxuXHRQSUQ6IFBJRCxcblx0Qml0U3RyaW5nOiBCaXRTdHJpbmcsXG5cdFBhdHRlcm5zOiBQYXR0ZXJucyxcblx0SW50ZWdlcjogSW50ZWdlcixcblx0RmxvYXQ6IEZsb2F0LFxuXHRGdW5jdGlvbnM6IEZ1bmN0aW9ucyxcblx0TGlzdDogTGlzdCxcblx0U3BlY2lhbEZvcm1zOiBzcGVjaWFsX2Zvcm1zXG59KTtcblxubGV0IEVudW0gPSB7XG5cbiAgYWxsX19xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuID0geCA9PiB4KSB7XG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoIWZ1bihlbGVtKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgYW55X19xbWFya19fOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuID0geCA9PiB4KSB7XG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBhdDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4sIHRoZV9kZWZhdWx0ID0gbnVsbCkge1xuICAgIGlmIChuID4gdGhpcy5jb3VudChjb2xsZWN0aW9uKSB8fCBuIDwgMCkge1xuICAgICAgcmV0dXJuIHRoZV9kZWZhdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uW25dO1xuICB9LFxuXG4gIGNvbmNhdDogZnVuY3Rpb24gKC4uLmVudW1hYmxlcykge1xuICAgIHJldHVybiBlbnVtYWJsZXNbMF0uY29uY2F0KGVudW1hYmxlc1sxXSk7XG4gIH0sXG5cbiAgY291bnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4gPSBudWxsKSB7XG4gICAgaWYgKGZ1biA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbi5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uLmZpbHRlcihmdW4pLmxlbmd0aDtcbiAgICB9XG4gIH0sXG5cbiAgZHJvcDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvdW50KSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoY291bnQpO1xuICB9LFxuXG4gIGRyb3Bfd2hpbGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIGNvdW50ID0gY291bnQgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoY291bnQpO1xuICB9LFxuXG4gIGVhY2g6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGZ1bihlbGVtKTtcbiAgICB9XG4gIH0sXG5cbiAgZW1wdHlfX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24ubGVuZ3RoID09PSAwO1xuICB9LFxuXG4gIGZldGNoOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNvbGxlY3Rpb24pKSB7XG4gICAgICBpZiAobiA8IHRoaXMuY291bnQoY29sbGVjdGlvbikgJiYgbiA+PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgVHVwbGUoU3ltYm9sLmZvcihcIm9rXCIpLCBjb2xsZWN0aW9uW25dKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBTeW1ib2wuZm9yKFwiZXJyb3JcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiY29sbGVjdGlvbiBpcyBub3QgYW4gRW51bWVyYWJsZVwiKTtcbiAgfSxcblxuICBmZXRjaF9fZW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4pIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjb2xsZWN0aW9uKSkge1xuICAgICAgaWYgKG4gPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pICYmIG4gPj0gMCkge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbltuXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm91dCBvZiBib3VuZHMgZXJyb3JcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiY29sbGVjdGlvbiBpcyBub3QgYW4gRW51bWVyYWJsZVwiKTtcbiAgfSxcblxuICBmaWx0ZXI6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChmdW4oZWxlbSkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goZWxlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBmaWx0ZXJfbWFwOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZmlsdGVyLCBtYXBwZXIpIHtcbiAgICByZXR1cm4gRW51bS5tYXAoRW51bS5maWx0ZXIoY29sbGVjdGlvbiwgZmlsdGVyKSwgbWFwcGVyKTtcbiAgfSxcblxuICBmaW5kOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgaWZfbm9uZSA9IG51bGwsIGZ1bikge1xuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaWZfbm9uZTtcbiAgfSxcblxuICBpbnRvOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbGlzdCkge1xuICAgIHJldHVybiBsaXN0LmNvbmNhdChjb2xsZWN0aW9uKTtcbiAgfSxcblxuICBtYXA6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIHJlc3VsdC5wdXNoKGZ1bihlbGVtKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBtYXBfcmVkdWNlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgYWNjLCBmdW4pIHtcbiAgICBsZXQgbWFwcGVkID0gTGlzdCgpO1xuICAgIGxldCB0aGVfYWNjID0gYWNjO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pOyBpKyspIHtcbiAgICAgIGxldCB0dXBsZSA9IGZ1bihjb2xsZWN0aW9uW2ldLCB0aGVfYWNjKTtcblxuICAgICAgdGhlX2FjYyA9IHR1cGxlLmdldCgxKTtcbiAgICAgIG1hcHBlZCA9IExpc3QoLi4ubWFwcGVkLmNvbmNhdChbdHVwbGUuZ2V0KDApXSkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVHVwbGUobWFwcGVkLCB0aGVfYWNjKTtcbiAgfSxcblxuICBtZW1iZXJfX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCB2YWx1ZSkge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLmluY2x1ZGVzKHZhbHVlKTtcbiAgfSxcblxuICByZWR1Y2U6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBhY2MsIGZ1bikge1xuICAgIGxldCB0aGVfYWNjID0gYWNjO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pOyBpKyspIHtcbiAgICAgIGxldCB0dXBsZSA9IGZ1bihjb2xsZWN0aW9uW2ldLCB0aGVfYWNjKTtcblxuICAgICAgdGhlX2FjYyA9IHR1cGxlLmdldCgxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhlX2FjYztcbiAgfSxcblxuICB0YWtlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgY291bnQpIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5zbGljZSgwLCBjb3VudCk7XG4gIH0sXG5cbiAgdGFrZV9ldmVyeTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG50aCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoaW5kZXggJSBudGggPT09IDApIHtcbiAgICAgICAgcmVzdWx0LnB1c2goZWxlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIExpc3QoLi4ucmVzdWx0KTtcbiAgfSxcblxuICB0YWtlX3doaWxlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgbGV0IGNvdW50ID0gMDtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICBjb3VudCA9IGNvdW50ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uLnNsaWNlKDAsIGNvdW50KTtcbiAgfSxcblxuICB0b19saXN0OiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG59O1xuXG5sZXQgVmlydHVhbERPTSA9IChmdW5jdGlvbiAoZSkge1xuICAgIHJldHVybiBlKCk7XG59KShmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRlZmluZSwgbW9kdWxlLCBleHBvcnRzO1xuICAgIHJldHVybiAoZnVuY3Rpb24gZSh0LCBuLCByKSB7XG4gICAgICAgIGZ1bmN0aW9uIHMobywgdSkge1xuICAgICAgICAgICAgaWYgKCFuW29dKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0W29dKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhID0gdHlwZW9mIHJlcXVpcmUgPT0gXCJmdW5jdGlvblwiICYmIHJlcXVpcmU7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdSAmJiBhKSByZXR1cm4gYShvLCAhMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpKSByZXR1cm4gaShvLCAhMCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG8gKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IChmLmNvZGUgPSBcIk1PRFVMRV9OT1RfRk9VTkRcIiwgZik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBsID0gbltvXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0czoge31cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRbb11bMF0uY2FsbChsLmV4cG9ydHMsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuID0gdFtvXVsxXVtlXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHMobiA/IG4gOiBlKTtcbiAgICAgICAgICAgICAgICB9LCBsLCBsLmV4cG9ydHMsIGUsIHQsIG4sIHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5bb10uZXhwb3J0cztcbiAgICAgICAgfVxuICAgICAgICB2YXIgaSA9IHR5cGVvZiByZXF1aXJlID09IFwiZnVuY3Rpb25cIiAmJiByZXF1aXJlO1xuICAgICAgICBmb3IgKHZhciBvID0gMDsgbyA8IHIubGVuZ3RoOyBvKyspIHMocltvXSk7XG4gICAgICAgIHJldHVybiBzO1xuICAgIH0pKHtcbiAgICAgICAgMTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcblxuICAgICAgICAgICAgdmFyIGNyZWF0ZUVsZW1lbnQgPSByZXF1aXJlKFwiLi92ZG9tL2NyZWF0ZS1lbGVtZW50LmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUVsZW1lbnQ7XG4gICAgICAgIH0sIHsgXCIuL3Zkb20vY3JlYXRlLWVsZW1lbnQuanNcIjogMTUgfV0sIDI6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgZGlmZiA9IHJlcXVpcmUoXCIuL3Z0cmVlL2RpZmYuanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGlmZjtcbiAgICAgICAgfSwgeyBcIi4vdnRyZWUvZGlmZi5qc1wiOiAzNSB9XSwgMzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBoID0gcmVxdWlyZShcIi4vdmlydHVhbC1oeXBlcnNjcmlwdC9pbmRleC5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBoO1xuICAgICAgICB9LCB7IFwiLi92aXJ0dWFsLWh5cGVyc2NyaXB0L2luZGV4LmpzXCI6IDIyIH1dLCA0OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGRpZmYgPSByZXF1aXJlKFwiLi9kaWZmLmpzXCIpO1xuICAgICAgICAgICAgdmFyIHBhdGNoID0gcmVxdWlyZShcIi4vcGF0Y2guanNcIik7XG4gICAgICAgICAgICB2YXIgaCA9IHJlcXVpcmUoXCIuL2guanNcIik7XG4gICAgICAgICAgICB2YXIgY3JlYXRlID0gcmVxdWlyZShcIi4vY3JlYXRlLWVsZW1lbnQuanNcIik7XG4gICAgICAgICAgICB2YXIgVk5vZGUgPSByZXF1aXJlKFwiLi92bm9kZS92bm9kZS5qc1wiKTtcbiAgICAgICAgICAgIHZhciBWVGV4dCA9IHJlcXVpcmUoXCIuL3Zub2RlL3Z0ZXh0LmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgICAgICBkaWZmOiBkaWZmLFxuICAgICAgICAgICAgICAgIHBhdGNoOiBwYXRjaCxcbiAgICAgICAgICAgICAgICBoOiBoLFxuICAgICAgICAgICAgICAgIGNyZWF0ZTogY3JlYXRlLFxuICAgICAgICAgICAgICAgIFZOb2RlOiBWTm9kZSxcbiAgICAgICAgICAgICAgICBWVGV4dDogVlRleHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sIHsgXCIuL2NyZWF0ZS1lbGVtZW50LmpzXCI6IDEsIFwiLi9kaWZmLmpzXCI6IDIsIFwiLi9oLmpzXCI6IDMsIFwiLi9wYXRjaC5qc1wiOiAxMywgXCIuL3Zub2RlL3Zub2RlLmpzXCI6IDMxLCBcIi4vdm5vZGUvdnRleHQuanNcIjogMzMgfV0sIDU6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICAvKiFcbiAgICAgICAgICAgICAqIENyb3NzLUJyb3dzZXIgU3BsaXQgMS4xLjFcbiAgICAgICAgICAgICAqIENvcHlyaWdodCAyMDA3LTIwMTIgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+XG4gICAgICAgICAgICAgKiBBdmFpbGFibGUgdW5kZXIgdGhlIE1JVCBMaWNlbnNlXG4gICAgICAgICAgICAgKiBFQ01BU2NyaXB0IGNvbXBsaWFudCwgdW5pZm9ybSBjcm9zcy1icm93c2VyIHNwbGl0IG1ldGhvZFxuICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU3BsaXRzIGEgc3RyaW5nIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncyB1c2luZyBhIHJlZ2V4IG9yIHN0cmluZyBzZXBhcmF0b3IuIE1hdGNoZXMgb2YgdGhlXG4gICAgICAgICAgICAgKiBzZXBhcmF0b3IgYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0IGFycmF5LiBIb3dldmVyLCBpZiBgc2VwYXJhdG9yYCBpcyBhIHJlZ2V4IHRoYXQgY29udGFpbnNcbiAgICAgICAgICAgICAqIGNhcHR1cmluZyBncm91cHMsIGJhY2tyZWZlcmVuY2VzIGFyZSBzcGxpY2VkIGludG8gdGhlIHJlc3VsdCBlYWNoIHRpbWUgYHNlcGFyYXRvcmAgaXMgbWF0Y2hlZC5cbiAgICAgICAgICAgICAqIEZpeGVzIGJyb3dzZXIgYnVncyBjb21wYXJlZCB0byB0aGUgbmF0aXZlIGBTdHJpbmcucHJvdG90eXBlLnNwbGl0YCBhbmQgY2FuIGJlIHVzZWQgcmVsaWFibHlcbiAgICAgICAgICAgICAqIGNyb3NzLWJyb3dzZXIuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFN0cmluZyB0byBzcGxpdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7UmVnRXhwfFN0cmluZ30gc2VwYXJhdG9yIFJlZ2V4IG9yIHN0cmluZyB0byB1c2UgZm9yIHNlcGFyYXRpbmcgdGhlIHN0cmluZy5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbbGltaXRdIE1heGltdW0gbnVtYmVyIG9mIGl0ZW1zIHRvIGluY2x1ZGUgaW4gdGhlIHJlc3VsdCBhcnJheS5cbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtBcnJheX0gQXJyYXkgb2Ygc3Vic3RyaW5ncy5cbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLy8gQmFzaWMgdXNlXG4gICAgICAgICAgICAgKiBzcGxpdCgnYSBiIGMgZCcsICcgJyk7XG4gICAgICAgICAgICAgKiAvLyAtPiBbJ2EnLCAnYicsICdjJywgJ2QnXVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIFdpdGggbGltaXRcbiAgICAgICAgICAgICAqIHNwbGl0KCdhIGIgYyBkJywgJyAnLCAyKTtcbiAgICAgICAgICAgICAqIC8vIC0+IFsnYScsICdiJ11cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyBCYWNrcmVmZXJlbmNlcyBpbiByZXN1bHQgYXJyYXlcbiAgICAgICAgICAgICAqIHNwbGl0KCcuLndvcmQxIHdvcmQyLi4nLCAvKFthLXpdKykoXFxkKykvaSk7XG4gICAgICAgICAgICAgKiAvLyAtPiBbJy4uJywgJ3dvcmQnLCAnMScsICcgJywgJ3dvcmQnLCAnMicsICcuLiddXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIHNwbGl0KHVuZGVmKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgbmF0aXZlU3BsaXQgPSBTdHJpbmcucHJvdG90eXBlLnNwbGl0LFxuICAgICAgICAgICAgICAgICAgICBjb21wbGlhbnRFeGVjTnBjZyA9IC8oKT8/Ly5leGVjKFwiXCIpWzFdID09PSB1bmRlZixcblxuICAgICAgICAgICAgICAgIC8vIE5QQ0c6IG5vbnBhcnRpY2lwYXRpbmcgY2FwdHVyaW5nIGdyb3VwXG4gICAgICAgICAgICAgICAgc2VsZjtcblxuICAgICAgICAgICAgICAgIHNlbGYgPSBmdW5jdGlvbiAoc3RyLCBzZXBhcmF0b3IsIGxpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGBzZXBhcmF0b3JgIGlzIG5vdCBhIHJlZ2V4LCB1c2UgYG5hdGl2ZVNwbGl0YFxuICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHNlcGFyYXRvcikgIT09IFwiW29iamVjdCBSZWdFeHBdXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuYXRpdmVTcGxpdC5jYWxsKHN0ciwgc2VwYXJhdG9yLCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIG91dHB1dCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgPSAoc2VwYXJhdG9yLmlnbm9yZUNhc2UgPyBcImlcIiA6IFwiXCIpICsgKHNlcGFyYXRvci5tdWx0aWxpbmUgPyBcIm1cIiA6IFwiXCIpICsgKHNlcGFyYXRvci5leHRlbmRlZCA/IFwieFwiIDogXCJcIikgKyAoc2VwYXJhdG9yLnN0aWNreSA/IFwieVwiIDogXCJcIiksXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCAzK1xuICAgICAgICAgICAgICAgICAgICBsYXN0TGFzdEluZGV4ID0gMCxcblxuICAgICAgICAgICAgICAgICAgICAvLyBNYWtlIGBnbG9iYWxgIGFuZCBhdm9pZCBgbGFzdEluZGV4YCBpc3N1ZXMgYnkgd29ya2luZyB3aXRoIGEgY29weVxuICAgICAgICAgICAgICAgICAgICBzZXBhcmF0b3IgPSBuZXcgUmVnRXhwKHNlcGFyYXRvci5zb3VyY2UsIGZsYWdzICsgXCJnXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdG9yMixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdExlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IFwiXCI7IC8vIFR5cGUtY29udmVydFxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbXBsaWFudEV4ZWNOcGNnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb2Vzbid0IG5lZWQgZmxhZ3MgZ3ksIGJ1dCB0aGV5IGRvbid0IGh1cnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRvcjIgPSBuZXcgUmVnRXhwKFwiXlwiICsgc2VwYXJhdG9yLnNvdXJjZSArIFwiJCg/IVxcXFxzKVwiLCBmbGFncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogVmFsdWVzIGZvciBgbGltaXRgLCBwZXIgdGhlIHNwZWM6XG4gICAgICAgICAgICAgICAgICAgICAqIElmIHVuZGVmaW5lZDogNDI5NDk2NzI5NSAvLyBNYXRoLnBvdygyLCAzMikgLSAxXG4gICAgICAgICAgICAgICAgICAgICAqIElmIDAsIEluZmluaXR5LCBvciBOYU46IDBcbiAgICAgICAgICAgICAgICAgICAgICogSWYgcG9zaXRpdmUgbnVtYmVyOiBsaW1pdCA9IE1hdGguZmxvb3IobGltaXQpOyBpZiAobGltaXQgPiA0Mjk0OTY3Mjk1KSBsaW1pdCAtPSA0Mjk0OTY3Mjk2O1xuICAgICAgICAgICAgICAgICAgICAgKiBJZiBuZWdhdGl2ZSBudW1iZXI6IDQyOTQ5NjcyOTYgLSBNYXRoLmZsb29yKE1hdGguYWJzKGxpbWl0KSlcbiAgICAgICAgICAgICAgICAgICAgICogSWYgb3RoZXI6IFR5cGUtY29udmVydCwgdGhlbiB1c2UgdGhlIGFib3ZlIHJ1bGVzXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBsaW1pdCA9IGxpbWl0ID09PSB1bmRlZiA/IC0xID4+PiAwIDogLy8gTWF0aC5wb3coMiwgMzIpIC0gMVxuICAgICAgICAgICAgICAgICAgICBsaW1pdCA+Pj4gMDsgLy8gVG9VaW50MzIobGltaXQpXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChtYXRjaCA9IHNlcGFyYXRvci5leGVjKHN0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGBzZXBhcmF0b3IubGFzdEluZGV4YCBpcyBub3QgcmVsaWFibGUgY3Jvc3MtYnJvd3NlclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdEluZGV4ID4gbGFzdExhc3RJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKHN0ci5zbGljZShsYXN0TGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCBicm93c2VycyB3aG9zZSBgZXhlY2AgbWV0aG9kcyBkb24ndCBjb25zaXN0ZW50bHkgcmV0dXJuIGB1bmRlZmluZWRgIGZvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vbnBhcnRpY2lwYXRpbmcgY2FwdHVyaW5nIGdyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29tcGxpYW50RXhlY05wY2cgJiYgbWF0Y2gubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaFswXS5yZXBsYWNlKHNlcGFyYXRvcjIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aCAtIDI7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbaV0gPT09IHVuZGVmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoW2ldID0gdW5kZWY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCA+IDEgJiYgbWF0Y2guaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KG91dHB1dCwgbWF0Y2guc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0TGVuZ3RoID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RMYXN0SW5kZXggPSBsYXN0SW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dC5sZW5ndGggPj0gbGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlcGFyYXRvci5sYXN0SW5kZXggPT09IG1hdGNoLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdG9yLmxhc3RJbmRleCsrOyAvLyBBdm9pZCBhbiBpbmZpbml0ZSBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RMYXN0SW5kZXggPT09IHN0ci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0TGVuZ3RoIHx8ICFzZXBhcmF0b3IudGVzdChcIlwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goc3RyLnNsaWNlKGxhc3RMYXN0SW5kZXgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0cHV0Lmxlbmd0aCA+IGxpbWl0ID8gb3V0cHV0LnNsaWNlKDAsIGxpbWl0KSA6IG91dHB1dDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICB9LCB7fV0sIDY6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7fSwge31dLCA3OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgIHZhciBPbmVWZXJzaW9uQ29uc3RyYWludCA9IHJlcXVpcmUoXCJpbmRpdmlkdWFsL29uZS12ZXJzaW9uXCIpO1xuXG4gICAgICAgICAgICB2YXIgTVlfVkVSU0lPTiA9IFwiN1wiO1xuICAgICAgICAgICAgT25lVmVyc2lvbkNvbnN0cmFpbnQoXCJldi1zdG9yZVwiLCBNWV9WRVJTSU9OKTtcblxuICAgICAgICAgICAgdmFyIGhhc2hLZXkgPSBcIl9fRVZfU1RPUkVfS0VZQFwiICsgTVlfVkVSU0lPTjtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBFdlN0b3JlO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBFdlN0b3JlKGVsZW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IGVsZW1baGFzaEtleV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIWhhc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzaCA9IGVsZW1baGFzaEtleV0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcImluZGl2aWR1YWwvb25lLXZlcnNpb25cIjogOSB9XSwgODogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgICAgICAgICAvKmdsb2JhbCB3aW5kb3csIGdsb2JhbCovXG5cbiAgICAgICAgICAgICAgICB2YXIgcm9vdCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDoge307XG5cbiAgICAgICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEluZGl2aWR1YWw7XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBJbmRpdmlkdWFsKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSBpbiByb290KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFtrZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcm9vdFtrZXldID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmNhbGwodGhpcywgdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSk7XG4gICAgICAgIH0sIHt9XSwgOTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICB2YXIgSW5kaXZpZHVhbCA9IHJlcXVpcmUoXCIuL2luZGV4LmpzXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IE9uZVZlcnNpb247XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIE9uZVZlcnNpb24obW9kdWxlTmFtZSwgdmVyc2lvbiwgZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiX19JTkRJVklEVUFMX09ORV9WRVJTSU9OX1wiICsgbW9kdWxlTmFtZTtcbiAgICAgICAgICAgICAgICB2YXIgZW5mb3JjZUtleSA9IGtleSArIFwiX0VORk9SQ0VfU0lOR0xFVE9OXCI7XG5cbiAgICAgICAgICAgICAgICB2YXIgdmVyc2lvblZhbHVlID0gSW5kaXZpZHVhbChlbmZvcmNlS2V5LCB2ZXJzaW9uKTtcblxuICAgICAgICAgICAgICAgIGlmICh2ZXJzaW9uVmFsdWUgIT09IHZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuIG9ubHkgaGF2ZSBvbmUgY29weSBvZiBcIiArIG1vZHVsZU5hbWUgKyBcIi5cXG5cIiArIFwiWW91IGFscmVhZHkgaGF2ZSB2ZXJzaW9uIFwiICsgdmVyc2lvblZhbHVlICsgXCIgaW5zdGFsbGVkLlxcblwiICsgXCJUaGlzIG1lYW5zIHlvdSBjYW5ub3QgaW5zdGFsbCB2ZXJzaW9uIFwiICsgdmVyc2lvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIEluZGl2aWR1YWwoa2V5LCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi9pbmRleC5qc1wiOiA4IH1dLCAxMDogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRvcExldmVsID0gdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTtcbiAgICAgICAgICAgICAgICB2YXIgbWluRG9jID0gcmVxdWlyZShcIm1pbi1kb2N1bWVudFwiKTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jY3kgPSB0b3BMZXZlbFtcIl9fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDRcIl07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkb2NjeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jY3kgPSB0b3BMZXZlbFtcIl9fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDRcIl0gPSBtaW5Eb2M7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRvY2N5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmNhbGwodGhpcywgdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSk7XG4gICAgICAgIH0sIHsgXCJtaW4tZG9jdW1lbnRcIjogNiB9XSwgMTE6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdCh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT09IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LCB7fV0sIDEyOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIG5hdGl2ZUlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgICAgICAgICAgdmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBuYXRpdmVJc0FycmF5IHx8IGlzQXJyYXk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7fV0sIDEzOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIHBhdGNoID0gcmVxdWlyZShcIi4vdmRvbS9wYXRjaC5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBwYXRjaDtcbiAgICAgICAgfSwgeyBcIi4vdmRvbS9wYXRjaC5qc1wiOiAxOCB9XSwgMTQ6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaXNPYmplY3QgPSByZXF1aXJlKFwiaXMtb2JqZWN0XCIpO1xuICAgICAgICAgICAgdmFyIGlzSG9vayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12aG9vay5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhcHBseVByb3BlcnRpZXM7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFwcGx5UHJvcGVydGllcyhub2RlLCBwcm9wcywgcHJldmlvdXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcFZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUHJvcGVydHkobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSwgcHJldmlvdXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzSG9vayhwcm9wVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVQcm9wZXJ0eShub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlLCBwcmV2aW91cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcFZhbHVlLmhvb2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wVmFsdWUuaG9vayhub2RlLCBwcm9wTmFtZSwgcHJldmlvdXMgPyBwcmV2aW91c1twcm9wTmFtZV0gOiB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE9iamVjdChub2RlLCBwcm9wcywgcHJldmlvdXMsIHByb3BOYW1lLCBwcm9wVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IHByb3BWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlUHJvcGVydHkobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSwgcHJldmlvdXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJldmlvdXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzVmFsdWUgPSBwcmV2aW91c1twcm9wTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0hvb2socHJldmlvdXNWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wTmFtZSA9PT0gXCJhdHRyaWJ1dGVzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhdHRyTmFtZSBpbiBwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BOYW1lID09PSBcInN0eWxlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHByZXZpb3VzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZVtpXSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcHJldmlvdXNWYWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZXZpb3VzVmFsdWUudW5ob29rKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c1ZhbHVlLnVuaG9vayhub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcGF0Y2hPYmplY3Qobm9kZSwgcHJvcHMsIHByZXZpb3VzLCBwcm9wTmFtZSwgcHJvcFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzVmFsdWUgPSBwcmV2aW91cyA/IHByZXZpb3VzW3Byb3BOYW1lXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgIC8vIFNldCBhdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgaWYgKHByb3BOYW1lID09PSBcImF0dHJpYnV0ZXNcIikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhdHRyTmFtZSBpbiBwcm9wVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBwcm9wVmFsdWVbYXR0ck5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0clZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c1ZhbHVlICYmIGlzT2JqZWN0KHByZXZpb3VzVmFsdWUpICYmIGdldFByb3RvdHlwZShwcmV2aW91c1ZhbHVlKSAhPT0gZ2V0UHJvdG90eXBlKHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBwcm9wVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWlzT2JqZWN0KG5vZGVbcHJvcE5hbWVdKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciByZXBsYWNlciA9IHByb3BOYW1lID09PSBcInN0eWxlXCIgPyBcIlwiIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBwcm9wVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcHJvcFZhbHVlW2tdO1xuICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXVtrXSA9IHZhbHVlID09PSB1bmRlZmluZWQgPyByZXBsYWNlciA6IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0UHJvdG90eXBlKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLl9fcHJvdG9fXykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuX19wcm90b19fO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9pcy12aG9vay5qc1wiOiAyNiwgXCJpcy1vYmplY3RcIjogMTEgfV0sIDE1OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGRvY3VtZW50ID0gcmVxdWlyZShcImdsb2JhbC9kb2N1bWVudFwiKTtcblxuICAgICAgICAgICAgdmFyIGFwcGx5UHJvcGVydGllcyA9IHJlcXVpcmUoXCIuL2FwcGx5LXByb3BlcnRpZXNcIik7XG5cbiAgICAgICAgICAgIHZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZub2RlLmpzXCIpO1xuICAgICAgICAgICAgdmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdnRleHQuanNcIik7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCIpO1xuICAgICAgICAgICAgdmFyIGhhbmRsZVRodW5rID0gcmVxdWlyZShcIi4uL3Zub2RlL2hhbmRsZS10aHVuay5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVFbGVtZW50O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHZub2RlLCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IG9wdHMgPyBvcHRzLmRvY3VtZW50IHx8IGRvY3VtZW50IDogZG9jdW1lbnQ7XG4gICAgICAgICAgICAgICAgdmFyIHdhcm4gPSBvcHRzID8gb3B0cy53YXJuIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIHZub2RlID0gaGFuZGxlVGh1bmsodm5vZGUpLmE7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNXaWRnZXQodm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2bm9kZS5pbml0KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1ZUZXh0KHZub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWlzVk5vZGUodm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3YXJuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuKFwiSXRlbSBpcyBub3QgYSB2YWxpZCB2aXJ0dWFsIGRvbSBub2RlXCIsIHZub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHZub2RlLm5hbWVzcGFjZSA9PT0gbnVsbCA/IGRvYy5jcmVhdGVFbGVtZW50KHZub2RlLnRhZ05hbWUpIDogZG9jLmNyZWF0ZUVsZW1lbnROUyh2bm9kZS5uYW1lc3BhY2UsIHZub2RlLnRhZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHByb3BzID0gdm5vZGUucHJvcGVydGllcztcbiAgICAgICAgICAgICAgICBhcHBseVByb3BlcnRpZXMobm9kZSwgcHJvcHMpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZE5vZGUgPSBjcmVhdGVFbGVtZW50KGNoaWxkcmVuW2ldLCBvcHRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9oYW5kbGUtdGh1bmsuanNcIjogMjQsIFwiLi4vdm5vZGUvaXMtdm5vZGUuanNcIjogMjcsIFwiLi4vdm5vZGUvaXMtdnRleHQuanNcIjogMjgsIFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCI6IDI5LCBcIi4vYXBwbHktcHJvcGVydGllc1wiOiAxNCwgXCJnbG9iYWwvZG9jdW1lbnRcIjogMTAgfV0sIDE2OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgLy8gTWFwcyBhIHZpcnR1YWwgRE9NIHRyZWUgb250byBhIHJlYWwgRE9NIHRyZWUgaW4gYW4gZWZmaWNpZW50IG1hbm5lci5cbiAgICAgICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gcmVhZCBhbGwgb2YgdGhlIERPTSBub2RlcyBpbiB0aGUgdHJlZSBzbyB3ZSB1c2VcbiAgICAgICAgICAgIC8vIHRoZSBpbi1vcmRlciB0cmVlIGluZGV4aW5nIHRvIGVsaW1pbmF0ZSByZWN1cnNpb24gZG93biBjZXJ0YWluIGJyYW5jaGVzLlxuICAgICAgICAgICAgLy8gV2Ugb25seSByZWN1cnNlIGludG8gYSBET00gbm9kZSBpZiB3ZSBrbm93IHRoYXQgaXQgY29udGFpbnMgYSBjaGlsZCBvZlxuICAgICAgICAgICAgLy8gaW50ZXJlc3QuXG5cbiAgICAgICAgICAgIHZhciBub0NoaWxkID0ge307XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZG9tSW5kZXg7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvbUluZGV4KHJvb3ROb2RlLCB0cmVlLCBpbmRpY2VzLCBub2Rlcykge1xuICAgICAgICAgICAgICAgIGlmICghaW5kaWNlcyB8fCBpbmRpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5zb3J0KGFzY2VuZGluZyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWN1cnNlKHJvb3ROb2RlLCB0cmVlLCBpbmRpY2VzLCBub2RlcywgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZWN1cnNlKHJvb3ROb2RlLCB0cmVlLCBpbmRpY2VzLCBub2Rlcywgcm9vdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgbm9kZXMgPSBub2RlcyB8fCB7fTtcblxuICAgICAgICAgICAgICAgIGlmIChyb290Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhJblJhbmdlKGluZGljZXMsIHJvb3RJbmRleCwgcm9vdEluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXNbcm9vdEluZGV4XSA9IHJvb3ROb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHZDaGlsZHJlbiA9IHRyZWUuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZDaGlsZHJlbikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGROb2RlcyA9IHJvb3ROb2RlLmNoaWxkTm9kZXM7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJlZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RJbmRleCArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZDaGlsZCA9IHZDaGlsZHJlbltpXSB8fCBub0NoaWxkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXh0SW5kZXggPSByb290SW5kZXggKyAodkNoaWxkLmNvdW50IHx8IDApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCByZWN1cnNpb24gZG93biB0aGUgdHJlZSBpZiB0aGVyZSBhcmUgbm8gbm9kZXMgZG93biBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4SW5SYW5nZShpbmRpY2VzLCByb290SW5kZXgsIG5leHRJbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzZShjaGlsZE5vZGVzW2ldLCB2Q2hpbGQsIGluZGljZXMsIG5vZGVzLCByb290SW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RJbmRleCA9IG5leHRJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQmluYXJ5IHNlYXJjaCBmb3IgYW4gaW5kZXggaW4gdGhlIGludGVydmFsIFtsZWZ0LCByaWdodF1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGluZGV4SW5SYW5nZShpbmRpY2VzLCBsZWZ0LCByaWdodCkge1xuICAgICAgICAgICAgICAgIGlmIChpbmRpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG1pbkluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgbWF4SW5kZXggPSBpbmRpY2VzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJbmRleDtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW07XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAobWluSW5kZXggPD0gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEluZGV4ID0gKG1heEluZGV4ICsgbWluSW5kZXgpIC8gMiA+PiAwO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbSA9IGluZGljZXNbY3VycmVudEluZGV4XTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobWluSW5kZXggPT09IG1heEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudEl0ZW0gPj0gbGVmdCAmJiBjdXJyZW50SXRlbSA8PSByaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SXRlbSA8IGxlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbkluZGV4ID0gY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SXRlbSA+IHJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhJbmRleCA9IGN1cnJlbnRJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYXNjZW5kaW5nKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYSA+IGIgPyAxIDogLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHt9XSwgMTc6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgYXBwbHlQcm9wZXJ0aWVzID0gcmVxdWlyZShcIi4vYXBwbHktcHJvcGVydGllc1wiKTtcblxuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBWUGF0Y2ggPSByZXF1aXJlKFwiLi4vdm5vZGUvdnBhdGNoLmpzXCIpO1xuXG4gICAgICAgICAgICB2YXIgdXBkYXRlV2lkZ2V0ID0gcmVxdWlyZShcIi4vdXBkYXRlLXdpZGdldFwiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhcHBseVBhdGNoO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhcHBseVBhdGNoKHZwYXRjaCwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gdnBhdGNoLnR5cGU7XG4gICAgICAgICAgICAgICAgdmFyIHZOb2RlID0gdnBhdGNoLnZOb2RlO1xuICAgICAgICAgICAgICAgIHZhciBwYXRjaCA9IHZwYXRjaC5wYXRjaDtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5SRU1PVkU6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlTm9kZShkb21Ob2RlLCB2Tm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLklOU0VSVDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnNlcnROb2RlKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guVlRFWFQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nUGF0Y2goZG9tTm9kZSwgdk5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guV0lER0VUOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpZGdldFBhdGNoKGRvbU5vZGUsIHZOb2RlLCBwYXRjaCwgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLlZOT0RFOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZOb2RlUGF0Y2goZG9tTm9kZSwgdk5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBWUGF0Y2guT1JERVI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZW9yZGVyQ2hpbGRyZW4oZG9tTm9kZSwgcGF0Y2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgVlBhdGNoLlBST1BTOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlQcm9wZXJ0aWVzKGRvbU5vZGUsIHBhdGNoLCB2Tm9kZS5wcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkb21Ob2RlO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFZQYXRjaC5USFVOSzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlUm9vdChkb21Ob2RlLCByZW5kZXJPcHRpb25zLnBhdGNoKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKSk7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9tTm9kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZU5vZGUoZG9tTm9kZSwgdk5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZG9tTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZGVzdHJveVdpZGdldChkb21Ob2RlLCB2Tm9kZSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaW5zZXJ0Tm9kZShwYXJlbnROb2RlLCB2Tm9kZSwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodk5vZGUsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5hcHBlbmRDaGlsZChuZXdOb2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc3RyaW5nUGF0Y2goZG9tTm9kZSwgbGVmdFZOb2RlLCB2VGV4dCwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBuZXdOb2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGRvbU5vZGUubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tTm9kZS5yZXBsYWNlRGF0YSgwLCBkb21Ob2RlLmxlbmd0aCwgdlRleHQudGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIG5ld05vZGUgPSBkb21Ob2RlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gZG9tTm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodlRleHQsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlICYmIG5ld05vZGUgIT09IGRvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIGRvbU5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdpZGdldFBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgd2lkZ2V0LCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVwZGF0aW5nID0gdXBkYXRlV2lkZ2V0KGxlZnRWTm9kZSwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZTtcblxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGluZykge1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gd2lkZ2V0LnVwZGF0ZShsZWZ0Vk5vZGUsIGRvbU5vZGUpIHx8IGRvbU5vZGU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHdpZGdldCwgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGU7XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSAmJiBuZXdOb2RlICE9PSBkb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIGRvbU5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdXBkYXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzdHJveVdpZGdldChkb21Ob2RlLCBsZWZ0Vk5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdOb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB2Tm9kZVBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgdk5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZOb2RlLCByZW5kZXJPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlICYmIG5ld05vZGUgIT09IGRvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgZG9tTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXQoZG9tTm9kZSwgdykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygdy5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIgJiYgaXNXaWRnZXQodykpIHtcbiAgICAgICAgICAgICAgICAgICAgdy5kZXN0cm95KGRvbU5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVvcmRlckNoaWxkcmVuKGRvbU5vZGUsIG1vdmVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSBkb21Ob2RlLmNoaWxkTm9kZXM7XG4gICAgICAgICAgICAgICAgdmFyIGtleU1hcCA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBub2RlO1xuICAgICAgICAgICAgICAgIHZhciByZW1vdmU7XG4gICAgICAgICAgICAgICAgdmFyIGluc2VydDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW92ZXMucmVtb3Zlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmUgPSBtb3Zlcy5yZW1vdmVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBub2RlID0gY2hpbGROb2Rlc1tyZW1vdmUuZnJvbV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZW1vdmUua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlNYXBbcmVtb3ZlLmtleV0gPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRvbU5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGNoaWxkTm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbW92ZXMuaW5zZXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnQgPSBtb3Zlcy5pbnNlcnRzW2pdO1xuICAgICAgICAgICAgICAgICAgICBub2RlID0ga2V5TWFwW2luc2VydC5rZXldO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHRoZSB3ZWlyZGVzdCBidWcgaSd2ZSBldmVyIHNlZW4gaW4gd2Via2l0XG4gICAgICAgICAgICAgICAgICAgIGRvbU5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIGluc2VydC50byA+PSBsZW5ndGgrKyA/IG51bGwgOiBjaGlsZE5vZGVzW2luc2VydC50b10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVwbGFjZVJvb3Qob2xkUm9vdCwgbmV3Um9vdCkge1xuICAgICAgICAgICAgICAgIGlmIChvbGRSb290ICYmIG5ld1Jvb3QgJiYgb2xkUm9vdCAhPT0gbmV3Um9vdCAmJiBvbGRSb290LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgb2xkUm9vdC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdSb290LCBvbGRSb290KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3Um9vdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiOiAyOSwgXCIuLi92bm9kZS92cGF0Y2guanNcIjogMzIsIFwiLi9hcHBseS1wcm9wZXJ0aWVzXCI6IDE0LCBcIi4vdXBkYXRlLXdpZGdldFwiOiAxOSB9XSwgMTg6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgZG9jdW1lbnQgPSByZXF1aXJlKFwiZ2xvYmFsL2RvY3VtZW50XCIpO1xuICAgICAgICAgICAgdmFyIGlzQXJyYXkgPSByZXF1aXJlKFwieC1pcy1hcnJheVwiKTtcblxuICAgICAgICAgICAgdmFyIHJlbmRlciA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1lbGVtZW50XCIpO1xuICAgICAgICAgICAgdmFyIGRvbUluZGV4ID0gcmVxdWlyZShcIi4vZG9tLWluZGV4XCIpO1xuICAgICAgICAgICAgdmFyIHBhdGNoT3AgPSByZXF1aXJlKFwiLi9wYXRjaC1vcFwiKTtcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gcGF0Y2g7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHBhdGNoKHJvb3ROb2RlLCBwYXRjaGVzLCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyT3B0aW9ucyA9IHJlbmRlck9wdGlvbnMgfHwge307XG4gICAgICAgICAgICAgICAgcmVuZGVyT3B0aW9ucy5wYXRjaCA9IHJlbmRlck9wdGlvbnMucGF0Y2ggJiYgcmVuZGVyT3B0aW9ucy5wYXRjaCAhPT0gcGF0Y2ggPyByZW5kZXJPcHRpb25zLnBhdGNoIDogcGF0Y2hSZWN1cnNpdmU7XG4gICAgICAgICAgICAgICAgcmVuZGVyT3B0aW9ucy5yZW5kZXIgPSByZW5kZXJPcHRpb25zLnJlbmRlciB8fCByZW5kZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVuZGVyT3B0aW9ucy5wYXRjaChyb290Tm9kZSwgcGF0Y2hlcywgcmVuZGVyT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHBhdGNoUmVjdXJzaXZlKHJvb3ROb2RlLCBwYXRjaGVzLCByZW5kZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGljZXMgPSBwYXRjaEluZGljZXMocGF0Y2hlcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5kaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3ROb2RlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGRvbUluZGV4KHJvb3ROb2RlLCBwYXRjaGVzLmEsIGluZGljZXMpO1xuICAgICAgICAgICAgICAgIHZhciBvd25lckRvY3VtZW50ID0gcm9vdE5vZGUub3duZXJEb2N1bWVudDtcblxuICAgICAgICAgICAgICAgIGlmICghcmVuZGVyT3B0aW9ucy5kb2N1bWVudCAmJiBvd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJPcHRpb25zLmRvY3VtZW50ID0gb3duZXJEb2N1bWVudDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVJbmRleCA9IGluZGljZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIHJvb3ROb2RlID0gYXBwbHlQYXRjaChyb290Tm9kZSwgaW5kZXhbbm9kZUluZGV4XSwgcGF0Y2hlc1tub2RlSW5kZXhdLCByZW5kZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFwcGx5UGF0Y2gocm9vdE5vZGUsIGRvbU5vZGUsIHBhdGNoTGlzdCwgcmVuZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmICghZG9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG5ld05vZGU7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNBcnJheShwYXRjaExpc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0Y2hMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gcGF0Y2hPcChwYXRjaExpc3RbaV0sIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9tTm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290Tm9kZSA9IG5ld05vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuZXdOb2RlID0gcGF0Y2hPcChwYXRjaExpc3QsIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21Ob2RlID09PSByb290Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdE5vZGUgPSBuZXdOb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvb3ROb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBwYXRjaEluZGljZXMocGF0Y2hlcykge1xuICAgICAgICAgICAgICAgIHZhciBpbmRpY2VzID0gW107XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcGF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSBcImFcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKE51bWJlcihrZXkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRpY2VzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi9jcmVhdGUtZWxlbWVudFwiOiAxNSwgXCIuL2RvbS1pbmRleFwiOiAxNiwgXCIuL3BhdGNoLW9wXCI6IDE3LCBcImdsb2JhbC9kb2N1bWVudFwiOiAxMCwgXCJ4LWlzLWFycmF5XCI6IDEyIH1dLCAxOTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gdXBkYXRlV2lkZ2V0O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVXaWRnZXQoYSwgYikge1xuICAgICAgICAgICAgICAgIGlmIChpc1dpZGdldChhKSAmJiBpc1dpZGdldChiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJuYW1lXCIgaW4gYSAmJiBcIm5hbWVcIiBpbiBiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5pZCA9PT0gYi5pZDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLmluaXQgPT09IGIuaW5pdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiOiAyOSB9XSwgMjA6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAgICAgdmFyIEV2U3RvcmUgPSByZXF1aXJlKFwiZXYtc3RvcmVcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gRXZIb29rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBFdkhvb2sodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRXZIb29rKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV2SG9vayh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBFdkhvb2sucHJvdG90eXBlLmhvb2sgPSBmdW5jdGlvbiAobm9kZSwgcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVzID0gRXZTdG9yZShub2RlKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcE5hbWUgPSBwcm9wZXJ0eU5hbWUuc3Vic3RyKDMpO1xuXG4gICAgICAgICAgICAgICAgZXNbcHJvcE5hbWVdID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIEV2SG9vay5wcm90b3R5cGUudW5ob29rID0gZnVuY3Rpb24gKG5vZGUsIHByb3BlcnR5TmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBlcyA9IEV2U3RvcmUobm9kZSk7XG4gICAgICAgICAgICAgICAgdmFyIHByb3BOYW1lID0gcHJvcGVydHlOYW1lLnN1YnN0cigzKTtcblxuICAgICAgICAgICAgICAgIGVzW3Byb3BOYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sIHsgXCJldi1zdG9yZVwiOiA3IH1dLCAyMTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IFNvZnRTZXRIb29rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBTb2Z0U2V0SG9vayh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTb2Z0U2V0SG9vaykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTb2Z0U2V0SG9vayh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBTb2Z0U2V0SG9vay5wcm90b3R5cGUuaG9vayA9IGZ1bmN0aW9uIChub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZVtwcm9wZXJ0eU5hbWVdICE9PSB0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVbcHJvcGVydHlOYW1lXSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSwge31dLCAyMjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICB2YXIgaXNBcnJheSA9IHJlcXVpcmUoXCJ4LWlzLWFycmF5XCIpO1xuXG4gICAgICAgICAgICB2YXIgVk5vZGUgPSByZXF1aXJlKFwiLi4vdm5vZGUvdm5vZGUuanNcIik7XG4gICAgICAgICAgICB2YXIgVlRleHQgPSByZXF1aXJlKFwiLi4vdm5vZGUvdnRleHQuanNcIik7XG4gICAgICAgICAgICB2YXIgaXNWTm9kZSA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12bm9kZVwiKTtcbiAgICAgICAgICAgIHZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZ0ZXh0XCIpO1xuICAgICAgICAgICAgdmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldFwiKTtcbiAgICAgICAgICAgIHZhciBpc0hvb2sgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdmhvb2tcIik7XG4gICAgICAgICAgICB2YXIgaXNWVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdGh1bmtcIik7XG5cbiAgICAgICAgICAgIHZhciBwYXJzZVRhZyA9IHJlcXVpcmUoXCIuL3BhcnNlLXRhZy5qc1wiKTtcbiAgICAgICAgICAgIHZhciBzb2Z0U2V0SG9vayA9IHJlcXVpcmUoXCIuL2hvb2tzL3NvZnQtc2V0LWhvb2suanNcIik7XG4gICAgICAgICAgICB2YXIgZXZIb29rID0gcmVxdWlyZShcIi4vaG9va3MvZXYtaG9vay5qc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBoO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBoKHRhZ05hbWUsIHByb3BlcnRpZXMsIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgdGFnLCBwcm9wcywga2V5LCBuYW1lc3BhY2U7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWNoaWxkcmVuICYmIGlzQ2hpbGRyZW4ocHJvcGVydGllcykpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4gPSBwcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcyA9IHt9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByb3BzID0gcHJvcHMgfHwgcHJvcGVydGllcyB8fCB7fTtcbiAgICAgICAgICAgICAgICB0YWcgPSBwYXJzZVRhZyh0YWdOYW1lLCBwcm9wcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBzdXBwb3J0IGtleXNcbiAgICAgICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkoXCJrZXlcIikpIHtcbiAgICAgICAgICAgICAgICAgICAga2V5ID0gcHJvcHMua2V5O1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5rZXkgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gc3VwcG9ydCBuYW1lc3BhY2VcbiAgICAgICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkoXCJuYW1lc3BhY2VcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlID0gcHJvcHMubmFtZXNwYWNlO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5uYW1lc3BhY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZml4IGN1cnNvciBidWdcbiAgICAgICAgICAgICAgICBpZiAodGFnID09PSBcIklOUFVUXCIgJiYgIW5hbWVzcGFjZSAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eShcInZhbHVlXCIpICYmIHByb3BzLnZhbHVlICE9PSB1bmRlZmluZWQgJiYgIWlzSG9vayhwcm9wcy52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMudmFsdWUgPSBzb2Z0U2V0SG9vayhwcm9wcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtUHJvcGVydGllcyhwcm9wcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4gIT09IHVuZGVmaW5lZCAmJiBjaGlsZHJlbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBhZGRDaGlsZChjaGlsZHJlbiwgY2hpbGROb2RlcywgdGFnLCBwcm9wcyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBWTm9kZSh0YWcsIHByb3BzLCBjaGlsZE5vZGVzLCBrZXksIG5hbWVzcGFjZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZENoaWxkKGMsIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGROb2Rlcy5wdXNoKG5ldyBWVGV4dChjKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGVzLnB1c2gobmV3IFZUZXh0KFN0cmluZyhjKSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNDaGlsZChjKSkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGVzLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ2hpbGQoY1tpXSwgY2hpbGROb2RlcywgdGFnLCBwcm9wcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGMgPT09IG51bGwgfHwgYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBVbmV4cGVjdGVkVmlydHVhbEVsZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yZWlnbk9iamVjdDogYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFZub2RlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZTogdGFnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHByb3BzXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdHJhbnNmb3JtUHJvcGVydGllcyhwcm9wcykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSG9vayh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BOYW1lLnN1YnN0cigwLCAzKSA9PT0gXCJldi1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZCBldi1mb28gc3VwcG9ydFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzW3Byb3BOYW1lXSA9IGV2SG9vayh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzQ2hpbGQoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc1ZOb2RlKHgpIHx8IGlzVlRleHQoeCkgfHwgaXNXaWRnZXQoeCkgfHwgaXNWVGh1bmsoeCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzQ2hpbGRyZW4oeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzdHJpbmdcIiB8fCBpc0FycmF5KHgpIHx8IGlzQ2hpbGQoeCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFVuZXhwZWN0ZWRWaXJ0dWFsRWxlbWVudChkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuXG4gICAgICAgICAgICAgICAgZXJyLnR5cGUgPSBcInZpcnR1YWwtaHlwZXJzY3JpcHQudW5leHBlY3RlZC52aXJ0dWFsLWVsZW1lbnRcIjtcbiAgICAgICAgICAgICAgICBlcnIubWVzc2FnZSA9IFwiVW5leHBlY3RlZCB2aXJ0dWFsIGNoaWxkIHBhc3NlZCB0byBoKCkuXFxuXCIgKyBcIkV4cGVjdGVkIGEgVk5vZGUgLyBWdGh1bmsgLyBWV2lkZ2V0IC8gc3RyaW5nIGJ1dDpcXG5cIiArIFwiZ290OlxcblwiICsgZXJyb3JTdHJpbmcoZGF0YS5mb3JlaWduT2JqZWN0KSArIFwiLlxcblwiICsgXCJUaGUgcGFyZW50IHZub2RlIGlzOlxcblwiICsgZXJyb3JTdHJpbmcoZGF0YS5wYXJlbnRWbm9kZSk7XG4gICAgICAgICAgICAgICAgXCJcXG5cIiArIFwiU3VnZ2VzdGVkIGZpeDogY2hhbmdlIHlvdXIgYGgoLi4uLCBbIC4uLiBdKWAgY2FsbHNpdGUuXCI7XG4gICAgICAgICAgICAgICAgZXJyLmZvcmVpZ25PYmplY3QgPSBkYXRhLmZvcmVpZ25PYmplY3Q7XG4gICAgICAgICAgICAgICAgZXJyLnBhcmVudFZub2RlID0gZGF0YS5wYXJlbnRWbm9kZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGVycm9yU3RyaW5nKG9iaikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIFwiICAgIFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcob2JqKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9pcy10aHVua1wiOiAyNSwgXCIuLi92bm9kZS9pcy12aG9va1wiOiAyNiwgXCIuLi92bm9kZS9pcy12bm9kZVwiOiAyNywgXCIuLi92bm9kZS9pcy12dGV4dFwiOiAyOCwgXCIuLi92bm9kZS9pcy13aWRnZXRcIjogMjksIFwiLi4vdm5vZGUvdm5vZGUuanNcIjogMzEsIFwiLi4vdm5vZGUvdnRleHQuanNcIjogMzMsIFwiLi9ob29rcy9ldi1ob29rLmpzXCI6IDIwLCBcIi4vaG9va3Mvc29mdC1zZXQtaG9vay5qc1wiOiAyMSwgXCIuL3BhcnNlLXRhZy5qc1wiOiAyMywgXCJ4LWlzLWFycmF5XCI6IDEyIH1dLCAyMzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICAgICB2YXIgc3BsaXQgPSByZXF1aXJlKFwiYnJvd3Nlci1zcGxpdFwiKTtcblxuICAgICAgICAgICAgdmFyIGNsYXNzSWRTcGxpdCA9IC8oW1xcLiNdP1thLXpBLVowLTlcXHUwMDdGLVxcdUZGRkZfOi1dKykvO1xuICAgICAgICAgICAgdmFyIG5vdENsYXNzSWQgPSAvXlxcLnwjLztcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBwYXJzZVRhZztcblxuICAgICAgICAgICAgZnVuY3Rpb24gcGFyc2VUYWcodGFnLCBwcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICghdGFnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkRJVlwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBub0lkID0gIXByb3BzLmhhc093blByb3BlcnR5KFwiaWRcIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGFnUGFydHMgPSBzcGxpdCh0YWcsIGNsYXNzSWRTcGxpdCk7XG4gICAgICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKG5vdENsYXNzSWQudGVzdCh0YWdQYXJ0c1sxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSA9IFwiRElWXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzZXMsIHBhcnQsIHR5cGUsIGk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFnUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydCA9IHRhZ1BhcnRzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gcGFydC5jaGFyQXQoMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lID0gcGFydDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIi5cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2gocGFydC5zdWJzdHJpbmcoMSwgcGFydC5sZW5ndGgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIiNcIiAmJiBub0lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5pZCA9IHBhcnQuc3Vic3RyaW5nKDEsIHBhcnQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjbGFzc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaChwcm9wcy5jbGFzc05hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcHJvcHMuY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKFwiIFwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHMubmFtZXNwYWNlID8gdGFnTmFtZSA6IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcImJyb3dzZXItc3BsaXRcIjogNSB9XSwgMjQ6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaXNWTm9kZSA9IHJlcXVpcmUoXCIuL2lzLXZub2RlXCIpO1xuICAgICAgICAgICAgdmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi9pcy12dGV4dFwiKTtcbiAgICAgICAgICAgIHZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuL2lzLXdpZGdldFwiKTtcbiAgICAgICAgICAgIHZhciBpc1RodW5rID0gcmVxdWlyZShcIi4vaXMtdGh1bmtcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaGFuZGxlVGh1bms7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZVRodW5rKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVuZGVyZWRBID0gYTtcbiAgICAgICAgICAgICAgICB2YXIgcmVuZGVyZWRCID0gYjtcblxuICAgICAgICAgICAgICAgIGlmIChpc1RodW5rKGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkQiA9IHJlbmRlclRodW5rKGIsIGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc1RodW5rKGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkQSA9IHJlbmRlclRodW5rKGEsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGE6IHJlbmRlcmVkQSxcbiAgICAgICAgICAgICAgICAgICAgYjogcmVuZGVyZWRCXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVuZGVyVGh1bmsodGh1bmssIHByZXZpb3VzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlbmRlcmVkVGh1bmsgPSB0aHVuay52bm9kZTtcblxuICAgICAgICAgICAgICAgIGlmICghcmVuZGVyZWRUaHVuaykge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJlZFRodW5rID0gdGh1bmsudm5vZGUgPSB0aHVuay5yZW5kZXIocHJldmlvdXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghKGlzVk5vZGUocmVuZGVyZWRUaHVuaykgfHwgaXNWVGV4dChyZW5kZXJlZFRodW5rKSB8fCBpc1dpZGdldChyZW5kZXJlZFRodW5rKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGh1bmsgZGlkIG5vdCByZXR1cm4gYSB2YWxpZCBub2RlXCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZW5kZXJlZFRodW5rO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IFwiLi9pcy10aHVua1wiOiAyNSwgXCIuL2lzLXZub2RlXCI6IDI3LCBcIi4vaXMtdnRleHRcIjogMjgsIFwiLi9pcy13aWRnZXRcIjogMjkgfV0sIDI1OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBpc1RodW5rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc1RodW5rKHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdCAmJiB0LnR5cGUgPT09IFwiVGh1bmtcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge31dLCAyNjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaXNIb29rO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc0hvb2soaG9vaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBob29rICYmICh0eXBlb2YgaG9vay5ob29rID09PSBcImZ1bmN0aW9uXCIgJiYgIWhvb2suaGFzT3duUHJvcGVydHkoXCJob29rXCIpIHx8IHR5cGVvZiBob29rLnVuaG9vayA9PT0gXCJmdW5jdGlvblwiICYmICFob29rLmhhc093blByb3BlcnR5KFwidW5ob29rXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge31dLCAyNzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBpc1ZpcnR1YWxOb2RlO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc1ZpcnR1YWxOb2RlKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geCAmJiB4LnR5cGUgPT09IFwiVmlydHVhbE5vZGVcIiAmJiB4LnZlcnNpb24gPT09IHZlcnNpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuL3ZlcnNpb25cIjogMzAgfV0sIDI4OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpO1xuXG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGlzVmlydHVhbFRleHQ7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzVmlydHVhbFRleHQoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4ICYmIHgudHlwZSA9PT0gXCJWaXJ0dWFsVGV4dFwiICYmIHgudmVyc2lvbiA9PT0gdmVyc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4vdmVyc2lvblwiOiAzMCB9XSwgMjk6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGlzV2lkZ2V0O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc1dpZGdldCh3KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHcgJiYgdy50eXBlID09PSBcIldpZGdldFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7fV0sIDMwOiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBcIjJcIjtcbiAgICAgICAgfSwge31dLCAzMTogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcbiAgICAgICAgICAgIHZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4vaXMtdm5vZGVcIik7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi9pcy13aWRnZXRcIik7XG4gICAgICAgICAgICB2YXIgaXNUaHVuayA9IHJlcXVpcmUoXCIuL2lzLXRodW5rXCIpO1xuICAgICAgICAgICAgdmFyIGlzVkhvb2sgPSByZXF1aXJlKFwiLi9pcy12aG9va1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBWaXJ0dWFsTm9kZTtcblxuICAgICAgICAgICAgdmFyIG5vUHJvcGVydGllcyA9IHt9O1xuICAgICAgICAgICAgdmFyIG5vQ2hpbGRyZW4gPSBbXTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gVmlydHVhbE5vZGUodGFnTmFtZSwgcHJvcGVydGllcywgY2hpbGRyZW4sIGtleSwgbmFtZXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YWdOYW1lID0gdGFnTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzIHx8IG5vUHJvcGVydGllcztcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW4gfHwgbm9DaGlsZHJlbjtcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9IGtleSAhPSBudWxsID8gU3RyaW5nKGtleSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSB0eXBlb2YgbmFtZXNwYWNlID09PSBcInN0cmluZ1wiID8gbmFtZXNwYWNlIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCB8fCAwO1xuICAgICAgICAgICAgICAgIHZhciBkZXNjZW5kYW50cyA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGhhc1dpZGdldHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgaGFzVGh1bmtzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGRlc2NlbmRhbnRIb29rcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBob29rcztcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBwcm9wZXJ0aWVzW3Byb3BOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZIb29rKHByb3BlcnR5KSAmJiBwcm9wZXJ0eS51bmhvb2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhvb2tzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9va3NbcHJvcE5hbWVdID0gcHJvcGVydHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZOb2RlKGNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY2VuZGFudHMgKz0gY2hpbGQuY291bnQgfHwgMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNXaWRnZXRzICYmIGNoaWxkLmhhc1dpZGdldHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNXaWRnZXRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNUaHVua3MgJiYgY2hpbGQuaGFzVGh1bmtzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzVGh1bmtzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkZXNjZW5kYW50SG9va3MgJiYgKGNoaWxkLmhvb2tzIHx8IGNoaWxkLmRlc2NlbmRhbnRIb29rcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjZW5kYW50SG9va3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFoYXNXaWRnZXRzICYmIGlzV2lkZ2V0KGNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGlsZC5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNXaWRnZXRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaGFzVGh1bmtzICYmIGlzVGh1bmsoY2hpbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNUaHVua3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IGNvdW50ICsgZGVzY2VuZGFudHM7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNXaWRnZXRzID0gaGFzV2lkZ2V0cztcbiAgICAgICAgICAgICAgICB0aGlzLmhhc1RodW5rcyA9IGhhc1RodW5rcztcbiAgICAgICAgICAgICAgICB0aGlzLmhvb2tzID0gaG9va3M7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXNjZW5kYW50SG9va3MgPSBkZXNjZW5kYW50SG9va3M7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFZpcnR1YWxOb2RlLnByb3RvdHlwZS52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgIFZpcnR1YWxOb2RlLnByb3RvdHlwZS50eXBlID0gXCJWaXJ0dWFsTm9kZVwiO1xuICAgICAgICB9LCB7IFwiLi9pcy10aHVua1wiOiAyNSwgXCIuL2lzLXZob29rXCI6IDI2LCBcIi4vaXMtdm5vZGVcIjogMjcsIFwiLi9pcy13aWRnZXRcIjogMjksIFwiLi92ZXJzaW9uXCI6IDMwIH1dLCAzMjogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcblxuICAgICAgICAgICAgVmlydHVhbFBhdGNoLk5PTkUgPSAwO1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLlZURVhUID0gMTtcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5WTk9ERSA9IDI7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guV0lER0VUID0gMztcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5QUk9QUyA9IDQ7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guT1JERVIgPSA1O1xuICAgICAgICAgICAgVmlydHVhbFBhdGNoLklOU0VSVCA9IDY7XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2guUkVNT1ZFID0gNztcbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5USFVOSyA9IDg7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gVmlydHVhbFBhdGNoO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBWaXJ0dWFsUGF0Y2godHlwZSwgdk5vZGUsIHBhdGNoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gTnVtYmVyKHR5cGUpO1xuICAgICAgICAgICAgICAgIHRoaXMudk5vZGUgPSB2Tm9kZTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGNoID0gcGF0Y2g7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFZpcnR1YWxQYXRjaC5wcm90b3R5cGUudmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgICBWaXJ0dWFsUGF0Y2gucHJvdG90eXBlLnR5cGUgPSBcIlZpcnR1YWxQYXRjaFwiO1xuICAgICAgICB9LCB7IFwiLi92ZXJzaW9uXCI6IDMwIH1dLCAzMzogW2Z1bmN0aW9uIChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBWaXJ0dWFsVGV4dDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gVmlydHVhbFRleHQodGV4dCkge1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dCA9IFN0cmluZyh0ZXh0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgVmlydHVhbFRleHQucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgICAgVmlydHVhbFRleHQucHJvdG90eXBlLnR5cGUgPSBcIlZpcnR1YWxUZXh0XCI7XG4gICAgICAgIH0sIHsgXCIuL3ZlcnNpb25cIjogMzAgfV0sIDM0OiBbZnVuY3Rpb24gKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykge1xuICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gcmVxdWlyZShcImlzLW9iamVjdFwiKTtcbiAgICAgICAgICAgIHZhciBpc0hvb2sgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdmhvb2tcIik7XG5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGlmZlByb3BzO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBkaWZmUHJvcHMoYSwgYikge1xuICAgICAgICAgICAgICAgIHZhciBkaWZmO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYUtleSBpbiBhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKGFLZXkgaW4gYikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBhVmFsdWUgPSBhW2FLZXldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYlZhbHVlID0gYlthS2V5XTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYVZhbHVlID09PSBiVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KGFWYWx1ZSkgJiYgaXNPYmplY3QoYlZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldFByb3RvdHlwZShiVmFsdWUpICE9PSBnZXRQcm90b3R5cGUoYVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBiVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzSG9vayhiVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IGJWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9iamVjdERpZmYgPSBkaWZmUHJvcHMoYVZhbHVlLCBiVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3REaWZmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gb2JqZWN0RGlmZjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBiVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBiS2V5IGluIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoYktleSBpbiBhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2JLZXldID0gYltiS2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaWZmO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRQcm90b3R5cGUodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUuX19wcm90b19fKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5fX3Byb3RvX187XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBcIi4uL3Zub2RlL2lzLXZob29rXCI6IDI2LCBcImlzLW9iamVjdFwiOiAxMSB9XSwgMzU6IFtmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSB7XG4gICAgICAgICAgICB2YXIgaXNBcnJheSA9IHJlcXVpcmUoXCJ4LWlzLWFycmF5XCIpO1xuXG4gICAgICAgICAgICB2YXIgVlBhdGNoID0gcmVxdWlyZShcIi4uL3Zub2RlL3ZwYXRjaFwiKTtcbiAgICAgICAgICAgIHZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZub2RlXCIpO1xuICAgICAgICAgICAgdmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdnRleHRcIik7XG4gICAgICAgICAgICB2YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0XCIpO1xuICAgICAgICAgICAgdmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdGh1bmtcIik7XG4gICAgICAgICAgICB2YXIgaGFuZGxlVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaGFuZGxlLXRodW5rXCIpO1xuXG4gICAgICAgICAgICB2YXIgZGlmZlByb3BzID0gcmVxdWlyZShcIi4vZGlmZi1wcm9wc1wiKTtcblxuICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkaWZmO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBkaWZmKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0Y2ggPSB7IGE6IGEgfTtcbiAgICAgICAgICAgICAgICB3YWxrKGEsIGIsIHBhdGNoLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0Y2g7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdhbGsoYSwgYiwgcGF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBhcHBseSA9IHBhdGNoW2luZGV4XTtcbiAgICAgICAgICAgICAgICB2YXIgYXBwbHlDbGVhciA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzVGh1bmsoYSkgfHwgaXNUaHVuayhiKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHVua3MoYSwgYiwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGIgPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGEgaXMgYSB3aWRnZXQgd2Ugd2lsbCBhZGQgYSByZW1vdmUgcGF0Y2ggZm9yIGl0XG4gICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSBhbnkgY2hpbGQgd2lkZ2V0cy9ob29rcyBtdXN0IGJlIGRlc3Ryb3llZC5cbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyBhZGRpbmcgdHdvIHJlbW92ZSBwYXRjaGVzIGZvciBhIHdpZGdldC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1dpZGdldChhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJTdGF0ZShhLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBwYXRjaFtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5SRU1PVkUsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVk5vZGUoYikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLnRhZ05hbWUgPT09IGIudGFnTmFtZSAmJiBhLm5hbWVzcGFjZSA9PT0gYi5uYW1lc3BhY2UgJiYgYS5rZXkgPT09IGIua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BzUGF0Y2ggPSBkaWZmUHJvcHMoYS5wcm9wZXJ0aWVzLCBiLnByb3BlcnRpZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wc1BhdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlBST1BTLCBhLCBwcm9wc1BhdGNoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gZGlmZkNoaWxkcmVuKGEsIGIsIHBhdGNoLCBhcHBseSwgaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WTk9ERSwgYSwgYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guVk5PREUsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1ZUZXh0KGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNWVGV4dChhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guVlRFWFQsIGEsIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGEudGV4dCAhPT0gYi50ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WVEVYVCwgYSwgYikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1dpZGdldChiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzV2lkZ2V0KGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseUNsZWFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLldJREdFVCwgYSwgYikpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhcHBseSkge1xuICAgICAgICAgICAgICAgICAgICBwYXRjaFtpbmRleF0gPSBhcHBseTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYXBwbHlDbGVhcikge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclN0YXRlKGEsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBkaWZmQ2hpbGRyZW4oYSwgYiwgcGF0Y2gsIGFwcGx5LCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBhQ2hpbGRyZW4gPSBhLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgIHZhciBvcmRlcmVkU2V0ID0gcmVvcmRlcihhQ2hpbGRyZW4sIGIuY2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIHZhciBiQ2hpbGRyZW4gPSBvcmRlcmVkU2V0LmNoaWxkcmVuO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFMZW4gPSBhQ2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciBiTGVuID0gYkNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gYUxlbiA+IGJMZW4gPyBhTGVuIDogYkxlbjtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnROb2RlID0gYUNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmlnaHROb2RlID0gYkNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghbGVmdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyaWdodE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGNlc3Mgbm9kZXMgaW4gYiBuZWVkIHRvIGJlIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guSU5TRVJULCBudWxsLCByaWdodE5vZGUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhbGsobGVmdE5vZGUsIHJpZ2h0Tm9kZSwgcGF0Y2gsIGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZOb2RlKGxlZnROb2RlKSAmJiBsZWZ0Tm9kZS5jb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gbGVmdE5vZGUuY291bnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3JkZXJlZFNldC5tb3Zlcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZW9yZGVyIG5vZGVzIGxhc3RcbiAgICAgICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guT1JERVIsIGEsIG9yZGVyZWRTZXQubW92ZXMpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwbHk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNsZWFyU3RhdGUodk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IE1ha2UgdGhpcyBhIHNpbmdsZSB3YWxrLCBub3QgdHdvXG4gICAgICAgICAgICAgICAgdW5ob29rKHZOb2RlLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIGRlc3Ryb3lXaWRnZXRzKHZOb2RlLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBQYXRjaCByZWNvcmRzIGZvciBhbGwgZGVzdHJveWVkIHdpZGdldHMgbXVzdCBiZSBhZGRlZCBiZWNhdXNlIHdlIG5lZWRcbiAgICAgICAgICAgIC8vIGEgRE9NIG5vZGUgcmVmZXJlbmNlIGZvciB0aGUgZGVzdHJveSBmdW5jdGlvblxuICAgICAgICAgICAgZnVuY3Rpb24gZGVzdHJveVdpZGdldHModk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChpc1dpZGdldCh2Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2Tm9kZS5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoW2luZGV4XSA9IGFwcGVuZFBhdGNoKHBhdGNoW2luZGV4XSwgbmV3IFZQYXRjaChWUGF0Y2guUkVNT1ZFLCB2Tm9kZSwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1ZOb2RlKHZOb2RlKSAmJiAodk5vZGUuaGFzV2lkZ2V0cyB8fCB2Tm9kZS5oYXNUaHVua3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHZOb2RlLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Ryb3lXaWRnZXRzKGNoaWxkLCBwYXRjaCwgaW5kZXgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShjaGlsZCkgJiYgY2hpbGQuY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCArPSBjaGlsZC5jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNUaHVuayh2Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGh1bmtzKHZOb2RlLCBudWxsLCBwYXRjaCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgc3ViLXBhdGNoIGZvciB0aHVua3NcbiAgICAgICAgICAgIGZ1bmN0aW9uIHRodW5rcyhhLCBiLCBwYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZXMgPSBoYW5kbGVUaHVuayhhLCBiKTtcbiAgICAgICAgICAgICAgICB2YXIgdGh1bmtQYXRjaCA9IGRpZmYobm9kZXMuYSwgbm9kZXMuYik7XG4gICAgICAgICAgICAgICAgaWYgKGhhc1BhdGNoZXModGh1bmtQYXRjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0Y2hbaW5kZXhdID0gbmV3IFZQYXRjaChWUGF0Y2guVEhVTkssIG51bGwsIHRodW5rUGF0Y2gpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFzUGF0Y2hlcyhwYXRjaCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGluZGV4IGluIHBhdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gXCJhXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBFeGVjdXRlIGhvb2tzIHdoZW4gdHdvIG5vZGVzIGFyZSBpZGVudGljYWxcbiAgICAgICAgICAgIGZ1bmN0aW9uIHVuaG9vayh2Tm9kZSwgcGF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUodk5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2Tm9kZS5ob29rcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hbaW5kZXhdID0gYXBwZW5kUGF0Y2gocGF0Y2hbaW5kZXhdLCBuZXcgVlBhdGNoKFZQYXRjaC5QUk9QUywgdk5vZGUsIHVuZGVmaW5lZEtleXModk5vZGUuaG9va3MpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodk5vZGUuZGVzY2VuZGFudEhvb2tzIHx8IHZOb2RlLmhhc1RodW5rcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdk5vZGUuY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmhvb2soY2hpbGQsIHBhdGNoLCBpbmRleCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShjaGlsZCkgJiYgY2hpbGQuY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gY2hpbGQuY291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1RodW5rKHZOb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHVua3Modk5vZGUsIG51bGwsIHBhdGNoLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB1bmRlZmluZWRLZXlzKG9iaikge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB7fTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTGlzdCBkaWZmLCBuYWl2ZSBsZWZ0IHRvIHJpZ2h0IHJlb3JkZXJpbmdcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlb3JkZXIoYUNoaWxkcmVuLCBiQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAvLyBPKE0pIHRpbWUsIE8oTSkgbWVtb3J5XG4gICAgICAgICAgICAgICAgdmFyIGJDaGlsZEluZGV4ID0ga2V5SW5kZXgoYkNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB2YXIgYktleXMgPSBiQ2hpbGRJbmRleC5rZXlzO1xuICAgICAgICAgICAgICAgIHZhciBiRnJlZSA9IGJDaGlsZEluZGV4LmZyZWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoYkZyZWUubGVuZ3RoID09PSBiQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogYkNoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBPKE4pIHRpbWUsIE8oTikgbWVtb3J5XG4gICAgICAgICAgICAgICAgdmFyIGFDaGlsZEluZGV4ID0ga2V5SW5kZXgoYUNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB2YXIgYUtleXMgPSBhQ2hpbGRJbmRleC5rZXlzO1xuICAgICAgICAgICAgICAgIHZhciBhRnJlZSA9IGFDaGlsZEluZGV4LmZyZWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoYUZyZWUubGVuZ3RoID09PSBhQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogYkNoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBPKE1BWChOLCBNKSkgbWVtb3J5XG4gICAgICAgICAgICAgICAgdmFyIG5ld0NoaWxkcmVuID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgZnJlZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgZnJlZUNvdW50ID0gYkZyZWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciBkZWxldGVkSXRlbXMgPSAwO1xuXG4gICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGEgYW5kIG1hdGNoIGEgbm9kZSBpbiBiXG4gICAgICAgICAgICAgICAgLy8gTyhOKSB0aW1lLFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYUNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhSXRlbSA9IGFDaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1JbmRleDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYUl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYktleXMuaGFzT3duUHJvcGVydHkoYUl0ZW0ua2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hdGNoIHVwIHRoZSBvbGQga2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGJLZXlzW2FJdGVtLmtleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChiQ2hpbGRyZW5baXRlbUluZGV4XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBvbGQga2V5ZWQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBpIC0gZGVsZXRlZEl0ZW1zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hdGNoIHRoZSBpdGVtIGluIGEgd2l0aCB0aGUgbmV4dCBmcmVlIGl0ZW0gaW4gYlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZyZWVJbmRleCA8IGZyZWVDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGJGcmVlW2ZyZWVJbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGJDaGlsZHJlbltpdGVtSW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgYXJlIG5vIGZyZWUgaXRlbXMgaW4gYiB0byBtYXRjaCB3aXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGZyZWUgaXRlbXMgaW4gYSwgc28gdGhlIGV4dHJhIGZyZWUgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhcmUgZGVsZXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBpIC0gZGVsZXRlZEl0ZW1zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBsYXN0RnJlZUluZGV4ID0gZnJlZUluZGV4ID49IGJGcmVlLmxlbmd0aCA/IGJDaGlsZHJlbi5sZW5ndGggOiBiRnJlZVtmcmVlSW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGIgYW5kIGFwcGVuZCBhbnkgbmV3IGtleXNcbiAgICAgICAgICAgICAgICAvLyBPKE0pIHRpbWVcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGJDaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3SXRlbSA9IGJDaGlsZHJlbltqXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobmV3SXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYUtleXMuaGFzT3duUHJvcGVydHkobmV3SXRlbS5rZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGFueSBuZXcga2V5ZWQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBhcmUgYWRkaW5nIG5ldyBpdGVtcyB0byB0aGUgZW5kIGFuZCB0aGVuIHNvcnRpbmcgdGhlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluIHBsYWNlLiBJbiBmdXR1cmUgd2Ugc2hvdWxkIGluc2VydCBuZXcgaXRlbXMgaW4gcGxhY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChuZXdJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChqID49IGxhc3RGcmVlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBhbnkgbGVmdG92ZXIgbm9uLWtleWVkIGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG5ld0l0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNpbXVsYXRlID0gbmV3Q2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2ltdWxhdGVJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIHJlbW92ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgaW5zZXJ0cyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBzaW11bGF0ZUl0ZW07XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGJDaGlsZHJlbi5sZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3YW50ZWRJdGVtID0gYkNoaWxkcmVuW2tdO1xuICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XTtcblxuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHNpbXVsYXRlSXRlbSA9PT0gbnVsbCAmJiBzaW11bGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaW11bGF0ZUl0ZW0gfHwgc2ltdWxhdGVJdGVtLmtleSAhPT0gd2FudGVkSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIG5lZWQgYSBrZXkgaW4gdGhpcyBwb3NpdGlvbi4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdhbnRlZEl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNpbXVsYXRlSXRlbSAmJiBzaW11bGF0ZUl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIGFuIGluc2VydCBkb2Vzbid0IHB1dCB0aGlzIGtleSBpbiBwbGFjZSwgaXQgbmVlZHMgdG8gbW92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYktleXNbc2ltdWxhdGVJdGVtLmtleV0gIT09IGsgKyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBzaW11bGF0ZUl0ZW0ua2V5KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSByZW1vdmUgZGlkbid0IHB1dCB0aGUgd2FudGVkIGl0ZW0gaW4gcGxhY2UsIHdlIG5lZWQgdG8gaW5zZXJ0IGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNpbXVsYXRlSXRlbSB8fCBzaW11bGF0ZUl0ZW0ua2V5ICE9PSB3YW50ZWRJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7IGtleTogd2FudGVkSXRlbS5rZXksIHRvOiBrIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXRlbXMgYXJlIG1hdGNoaW5nLCBzbyBza2lwIGFoZWFkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goeyBrZXk6IHdhbnRlZEl0ZW0ua2V5LCB0bzogayB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7IGtleTogd2FudGVkSXRlbS5rZXksIHRvOiBrIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIGtleSBpbiBzaW11bGF0ZSBoYXMgbm8gbWF0Y2hpbmcgd2FudGVkIGtleSwgcmVtb3ZlIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzaW11bGF0ZUl0ZW0gJiYgc2ltdWxhdGVJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbS5rZXkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBhbGwgdGhlIHJlbWFpbmluZyBub2RlcyBmcm9tIHNpbXVsYXRlXG4gICAgICAgICAgICAgICAgd2hpbGUgKHNpbXVsYXRlSW5kZXggPCBzaW11bGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJdGVtID0gc2ltdWxhdGVbc2ltdWxhdGVJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbSAmJiBzaW11bGF0ZUl0ZW0ua2V5KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIG9ubHkgbW92ZXMgd2UgaGF2ZSBhcmUgZGVsZXRlcyB0aGVuIHdlIGNhbiBqdXN0XG4gICAgICAgICAgICAgICAgLy8gbGV0IHRoZSBkZWxldGUgcGF0Y2ggcmVtb3ZlIHRoZXNlIGl0ZW1zLlxuICAgICAgICAgICAgICAgIGlmIChyZW1vdmVzLmxlbmd0aCA9PT0gZGVsZXRlZEl0ZW1zICYmICFpbnNlcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IG5ld0NoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbmV3Q2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgICAgIG1vdmVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVzOiByZW1vdmVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0czogaW5zZXJ0c1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlKGFyciwgaW5kZXgsIGtleSkge1xuICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbTogaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24ga2V5SW5kZXgoY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5cyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBmcmVlID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGNoaWxkcmVuLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5c1tjaGlsZC5rZXldID0gaTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyZWUucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGtleXM6IGtleXMsIC8vIEEgaGFzaCBvZiBrZXkgbmFtZSB0byBpbmRleFxuICAgICAgICAgICAgICAgICAgICBmcmVlOiBmcmVlIC8vIEFuIGFycmF5IG9mIHVua2V5ZWQgaXRlbSBpbmRpY2VzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYXBwZW5kUGF0Y2goYXBwbHksIHBhdGNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFwcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KGFwcGx5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHkucHVzaChwYXRjaCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseSA9IFthcHBseSwgcGF0Y2hdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcGx5O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRjaDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgXCIuLi92bm9kZS9oYW5kbGUtdGh1bmtcIjogMjQsIFwiLi4vdm5vZGUvaXMtdGh1bmtcIjogMjUsIFwiLi4vdm5vZGUvaXMtdm5vZGVcIjogMjcsIFwiLi4vdm5vZGUvaXMtdnRleHRcIjogMjgsIFwiLi4vdm5vZGUvaXMtd2lkZ2V0XCI6IDI5LCBcIi4uL3Zub2RlL3ZwYXRjaFwiOiAzMiwgXCIuL2RpZmYtcHJvcHNcIjogMzQsIFwieC1pcy1hcnJheVwiOiAxMiB9XSB9LCB7fSwgWzRdKSg0KTtcbn0pO1xuXG5jb25zdCBDb3JlID0gQztcblxuZXhwb3J0IHsgQ29yZSwgRW51bSwgVmlydHVhbERPTSB9OyJdLCJmaWxlIjoiRWxpeGlyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=