var ElixirScript = (function () {
'use strict';

/* @flow */

class Variable {
  constructor(name = null, default_value = Symbol.for('tailored.no_value')) {
    this.name = name;
    this.default_value = default_value;
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
  constructor(head, tail) {
    this.head = head;
    this.tail = tail;
  }
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

class BitStringMatch {
  constructor(...values) {
    this.values = values;
  }

  length() {
    return values.length;
  }

  bit_size() {
    return this.byte_size() * 8;
  }

  byte_size() {
    let s = 0;

    for (let val of this.values) {
      s = s + val.unit * val.size / 8;
    }

    return s;
  }

  getValue(index) {
    return this.values(index);
  }

  getSizeOfValue(index) {
    let val = this.getValue(index);
    return val.unit * val.size;
  }

  getTypeOfValue(index) {
    return this.getValue(index).type;
  }
}

class NamedVariableResult {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
}

function variable(name = null, default_value = Symbol.for('tailored.no_value')) {
  return new Variable(name, default_value);
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

function headTail(head, tail) {
  return new HeadTail(head, tail);
}

function type(type, objPattern = {}) {
  return new Type(type, objPattern);
}

function bound(value) {
  return new Bound(value);
}

function bitStringMatch(...values) {
  return new BitStringMatch(...values);
}

function namedVariableResult(name, value) {
  return new NamedVariableResult(name, value);
}

/* @flow */

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

function is_object(value) {
  return typeof value === 'object';
}

function is_variable(value) {
  return value instanceof Variable;
}

function is_null(value) {
  return value === null;
}

function is_array(value) {
  return Array.isArray(value);
}

function is_function(value) {
  return Object.prototype.toString.call(value) == '[object Function]';
}

function is_map(value) {
  return value instanceof Map;
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
    let i,
        s = '';
    for (i = 0; i < this.values.length; i++) {
      if (s !== '') {
        s += ', ';
      }

      const stringToAppend = this.values[i] ? this.values[i].toString() : '';

      s += stringToAppend;
    }

    return '{' + s + '}';
  }

  put_elem(index, elem) {
    if (index === this.length) {
      let new_values = this.values.concat([elem]);
      return new Tuple(...new_values);
    }

    let new_values = this.values.concat([]);
    new_values.splice(index, 0, elem);
    return new Tuple(...new_values);
  }

  remove_elem(index) {
    let new_values = this.values.concat([]);
    new_values.splice(index, 1);
    return new Tuple(...new_values);
  }
}

let process_counter = -1;

class PID {
  constructor() {
    process_counter = process_counter + 1;
    this.id = process_counter;
  }

  toString() {
    return 'PID#<0.' + this.id + '.0>';
  }
}

let ref_counter = -1;

class Reference {
  constructor() {
    ref_counter = ref_counter + 1;
    this.id = ref_counter;
    this.ref = Symbol();
  }

  toString() {
    return 'Ref#<0.0.0.' + this.id + '>';
  }
}

class BitString$1 {
  constructor(...args) {
    this.value = Object.freeze(this.process(args));
    this.length = this.value.length;
    this.bit_size = this.length * 8;
    this.byte_size = this.length;
  }

  get(index) {
    return this.value[index];
  }

  count() {
    return this.value.length;
  }

  slice(start, end = null) {
    let s = this.value.slice(start, end);
    let ms = s.map(elem => BitString$1.integer(elem));
    return new BitString$1(...ms);
  }

  [Symbol.iterator]() {
    return this.value[Symbol.iterator]();
  }

  toString() {
    var i,
        s = '';
    for (i = 0; i < this.count(); i++) {
      if (s !== '') {
        s += ', ';
      }
      s += this.get(i).toString();
    }

    return '<<' + s + '>>';
  }

  process(bitStringParts) {
    let processed_values = [];

    var i;
    for (i = 0; i < bitStringParts.length; i++) {
      let processed_value = this['process_' + bitStringParts[i].type](bitStringParts[i]);

      for (let attr of bitStringParts[i].attributes) {
        processed_value = this['process_' + attr](processed_value);
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
      return BitString$1.float64ToBytes(value.value);
    } else if (value.size === 32) {
      return BitString$1.float32ToBytes(value.value);
    }

    throw new Error('Invalid size for float');
  }

  process_bitstring(value) {
    return value.value.value;
  }

  process_binary(value) {
    return BitString$1.toUTF8Array(value.value);
  }

  process_utf8(value) {
    return BitString$1.toUTF8Array(value.value);
  }

  process_utf16(value) {
    return BitString$1.toUTF16Array(value.value);
  }

  process_utf32(value) {
    return BitString$1.toUTF32Array(value.value);
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
    return BitString$1.wrap(value, { type: 'integer', unit: 1, size: 8 });
  }

  static float(value) {
    return BitString$1.wrap(value, { type: 'float', unit: 1, size: 64 });
  }

  static bitstring(value) {
    return BitString$1.wrap(value, {
      type: 'bitstring',
      unit: 1,
      size: value.bit_size
    });
  }

  static bits(value) {
    return BitString$1.bitstring(value);
  }

  static binary(value) {
    return BitString$1.wrap(value, {
      type: 'binary',
      unit: 8,
      size: value.length
    });
  }

  static bytes(value) {
    return BitString$1.binary(value);
  }

  static utf8(value) {
    return BitString$1.wrap(value, { type: 'utf8', unit: 1, size: value.length });
  }

  static utf16(value) {
    return BitString$1.wrap(value, {
      type: 'utf16',
      unit: 1,
      size: value.length * 2
    });
  }

  static utf32(value) {
    return BitString$1.wrap(value, {
      type: 'utf32',
      unit: 1,
      size: value.length * 4
    });
  }

  static signed(value) {
    return BitString$1.wrap(value, {}, 'signed');
  }

  static unsigned(value) {
    return BitString$1.wrap(value, {}, 'unsigned');
  }

  static native(value) {
    return BitString$1.wrap(value, {}, 'native');
  }

  static big(value) {
    return BitString$1.wrap(value, {}, 'big');
  }

  static little(value) {
    return BitString$1.wrap(value, {}, 'little');
  }

  static size(value, count) {
    return BitString$1.wrap(value, { size: count });
  }

  static unit(value, count) {
    return BitString$1.wrap(value, { unit: count });
  }

  static wrap(value, opt, new_attribute = null) {
    let the_value = value;

    if (!(value instanceof Object)) {
      the_value = { value: value, attributes: [] };
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
      if (charcode < 0x80) {
        utf8.push(charcode);
      } else if (charcode < 0x800) {
        utf8.push(0xc0 | charcode >> 6, 0x80 | charcode & 0x3f);
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(0xe0 | charcode >> 12, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
      } else {
        // surrogate pair
        i++;
        // UTF-16 encodes 0x10000-0x10FFFF by
        // subtracting 0x10000 and splitting the
        // 20 bits of 0x0-0xFFFFF into two halves
        charcode = 0x10000 + ((charcode & 0x3ff) << 10 | str.charCodeAt(i) & 0x3ff);
        utf8.push(0xf0 | charcode >> 18, 0x80 | charcode >> 12 & 0x3f, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
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
        utf16.push(codePoint >> 8 & 0xff);
        utf16.push(codePoint & 0xff);
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
        utf32.push(codePoint >> 8 & 0xff);
        utf32.push(codePoint & 0xff);
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

    bytes.push(intVersion >> 24 & 0xff);
    bytes.push(intVersion >> 16 & 0xff);
    bytes.push(intVersion >> 8 & 0xff);
    bytes.push(intVersion & 0xff);

    return bytes;
  }

  static float64ToBytes(f) {
    var bytes = [];

    var buf = new ArrayBuffer(8);
    new Float64Array(buf)[0] = f;

    var intVersion1 = new Uint32Array(buf)[0];
    var intVersion2 = new Uint32Array(buf)[1];

    bytes.push(intVersion2 >> 24 & 0xff);
    bytes.push(intVersion2 >> 16 & 0xff);
    bytes.push(intVersion2 >> 8 & 0xff);
    bytes.push(intVersion2 & 0xff);

    bytes.push(intVersion1 >> 24 & 0xff);
    bytes.push(intVersion1 >> 16 & 0xff);
    bytes.push(intVersion1 >> 8 & 0xff);
    bytes.push(intVersion1 & 0xff);

    return bytes;
  }
}

var ErlangTypes = {
  Tuple,
  PID,
  Reference,
  BitString: BitString$1
};

/* @flow */

const BitString = ErlangTypes.BitString;

function resolveSymbol(pattern) {
  return function (value) {
    return is_symbol(value) && value === pattern;
  };
}

function resolveString(pattern) {
  return function (value) {
    return is_string(value) && value === pattern;
  };
}

function resolveNumber(pattern) {
  return function (value) {
    return is_number(value) && value === pattern;
  };
}

function resolveBoolean(pattern) {
  return function (value) {
    return is_boolean(value) && value === pattern;
  };
}

function resolveFunction(pattern) {
  return function (value) {
    return is_function(value) && value === pattern;
  };
}

function resolveNull(pattern) {
  return function (value) {
    return is_null(value);
  };
}

function resolveBound(pattern) {
  return function (value, args) {
    if (typeof value === typeof pattern.value && value === pattern.value) {
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

function resolveVariable(pattern) {
  return function (value, args) {
    if (pattern.name === null) {
      args.push(value);
    } else if (!pattern.name.startsWith('_')) {
      args.push(namedVariableResult(pattern.name, value));
    }

    return true;
  };
}

function resolveHeadTail(pattern) {
  const headMatches = buildMatch(pattern.head);
  const tailMatches = buildMatch(pattern.tail);

  return function (value, args) {
    if (!is_array(value) || value.length === 0) {
      return false;
    }

    const head = value[0];
    const tail = value.slice(1);

    if (headMatches(head, args) && tailMatches(tail, args)) {
      return true;
    }

    return false;
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
    if (is_string(value) && value.startsWith(prefix)) {
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
      return matches(value, args);
    }

    return false;
  };
}

function resolveArray(pattern) {
  const matches = pattern.map(x => buildMatch(x));

  return function (value, args) {
    if (!is_array(value) || value.length != pattern.length) {
      return false;
    }

    return value.every(function (v, i) {
      return matches[i](value[i], args);
    });
  };
}

function resolveMap(pattern) {
  let matches = new Map();

  const keys = Array.from(pattern.keys());

  for (let key of keys) {
    matches.set(key, buildMatch(pattern.get(key)));
  }

  return function (value, args) {
    if (!is_map(value) || pattern.size > value.size) {
      return false;
    }

    for (let key of keys) {
      if (!value.has(key) || !matches.get(key)(value.get(key), args)) {
        return false;
      }
    }

    return true;
  };
}

function resolveObject(pattern) {
  let matches = {};

  const keys = Object.keys(pattern).concat(Object.getOwnPropertySymbols(pattern));

  for (let key of keys) {
    matches[key] = buildMatch(pattern[key]);
  }

  return function (value, args) {
    if (!is_object(value) || pattern.length > value.length) {
      return false;
    }

    for (let key of keys) {
      if (!(key in value) || !matches[key](value[key], args)) {
        return false;
      }
    }

    return true;
  };
}

function resolveBitString(pattern) {
  let patternBitString = [];

  for (let bitstringMatchPart of pattern.values) {
    if (is_variable(bitstringMatchPart.value)) {
      let size = getSize(bitstringMatchPart.unit, bitstringMatchPart.size);
      fillArray(patternBitString, size);
    } else {
      patternBitString = patternBitString.concat(new BitString(bitstringMatchPart).value);
    }
  }

  let patternValues = pattern.values;

  return function (value, args) {
    let bsValue = null;

    if (!is_string(value) && !(value instanceof BitString)) {
      return false;
    }

    if (is_string(value)) {
      bsValue = new BitString(BitString.binary(value));
    } else {
      bsValue = value;
    }

    let beginningIndex = 0;

    for (let i = 0; i < patternValues.length; i++) {
      let bitstringMatchPart = patternValues[i];

      if (is_variable(bitstringMatchPart.value) && bitstringMatchPart.type == 'binary' && bitstringMatchPart.size === undefined && i < patternValues.length - 1) {
        throw new Error('a binary field without size is only allowed at the end of a binary pattern');
      }

      let size = 0;
      let bsValueArrayPart = [];
      let patternBitStringArrayPart = [];
      size = getSize(bitstringMatchPart.unit, bitstringMatchPart.size);

      if (i === patternValues.length - 1) {
        bsValueArrayPart = bsValue.value.slice(beginningIndex);
        patternBitStringArrayPart = patternBitString.slice(beginningIndex);
      } else {
        bsValueArrayPart = bsValue.value.slice(beginningIndex, beginningIndex + size);
        patternBitStringArrayPart = patternBitString.slice(beginningIndex, beginningIndex + size);
      }

      if (is_variable(bitstringMatchPart.value)) {
        switch (bitstringMatchPart.type) {
          case 'integer':
            if (bitstringMatchPart.attributes && bitstringMatchPart.attributes.indexOf('signed') != -1) {
              args.push(new Int8Array([bsValueArrayPart[0]])[0]);
            } else {
              args.push(new Uint8Array([bsValueArrayPart[0]])[0]);
            }
            break;

          case 'float':
            if (size === 64) {
              args.push(Float64Array.from(bsValueArrayPart)[0]);
            } else if (size === 32) {
              args.push(Float32Array.from(bsValueArrayPart)[0]);
            } else {
              return false;
            }
            break;

          case 'bitstring':
            args.push(createBitString(bsValueArrayPart));
            break;

          case 'binary':
            args.push(String.fromCharCode.apply(null, new Uint8Array(bsValueArrayPart)));
            break;

          case 'utf8':
            args.push(String.fromCharCode.apply(null, new Uint8Array(bsValueArrayPart)));
            break;

          case 'utf16':
            args.push(String.fromCharCode.apply(null, new Uint16Array(bsValueArrayPart)));
            break;

          case 'utf32':
            args.push(String.fromCharCode.apply(null, new Uint32Array(bsValueArrayPart)));
            break;

          default:
            return false;
        }
      } else if (!arraysEqual(bsValueArrayPart, patternBitStringArrayPart)) {
        return false;
      }

      beginningIndex = beginningIndex + size;
    }

    return true;
  };
}

function getSize(unit, size) {
  return unit * size / 8;
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

function fillArray(arr, num) {
  for (let i = 0; i < num; i++) {
    arr.push(0);
  }
}

function createBitString(arr) {
  let integerParts = arr.map(elem => BitString.integer(elem));
  return new BitString(...integerParts);
}

function resolveNoMatch() {
  return function () {
    return false;
  };
}

const patternMap = new Map();
patternMap.set(Variable.prototype, resolveVariable);
patternMap.set(Wildcard.prototype, resolveWildcard);
patternMap.set(HeadTail.prototype, resolveHeadTail);
patternMap.set(StartsWith.prototype, resolveStartsWith);
patternMap.set(Capture.prototype, resolveCapture);
patternMap.set(Bound.prototype, resolveBound);
patternMap.set(Type.prototype, resolveType);
patternMap.set(BitStringMatch.prototype, resolveBitString);
patternMap.set(Number.prototype, resolveNumber);
patternMap.set(Symbol.prototype, resolveSymbol);
patternMap.set(Map.prototype, resolveMap);
patternMap.set(Array.prototype, resolveArray);
patternMap.set(String.prototype, resolveString);
patternMap.set(Boolean.prototype, resolveBoolean);
patternMap.set(Function.prototype, resolveFunction);
patternMap.set(Object.prototype, resolveObject);

function buildMatch(pattern) {
  if (pattern === null) {
    return resolveNull(pattern);
  }

  if (typeof pattern === 'undefined') {
    return resolveWildcard(pattern);
  }

  const type$$1 = pattern.constructor.prototype;
  const resolver = patternMap.get(type$$1);

  if (resolver) {
    return resolver(pattern);
  }

  if (typeof pattern === 'object') {
    return resolveObject(pattern);
  }

  return resolveNoMatch();
}

class MatchError extends Error {
  constructor(arg) {
    super();

    if (typeof arg === 'symbol') {
      this.message = 'No match for: ' + arg.toString();
    } else if (Array.isArray(arg)) {
      let mappedValues = arg.map(x => {
        if (x === null) {
          return 'null';
        } else if (typeof x === 'undefined') {
          return 'undefined';
        }

        return x.toString();
      });

      this.message = 'No match for: ' + mappedValues;
    } else {
      this.message = 'No match for: ' + arg;
    }

    this.stack = new Error().stack;
    this.name = this.constructor.name;
  }
}

class Clause {
  constructor(pattern, fn, guard = () => true) {
    this.pattern = buildMatch(pattern);
    this.arity = pattern.length;
    this.optionals = getOptionalValues(pattern);
    this.fn = fn;
    this.guard = guard;
  }
}

function clause(pattern, fn, guard = () => true) {
  return new Clause(pattern, fn, guard);
}



function defmatch(...clauses) {
  const arities = getArityMap(clauses);

  return function (...args) {
    let [funcToCall, params] = findMatchingFunction(args, arities);
    return funcToCall.apply(this, params);
  };
}

function defmatchgen(...clauses) {
  const arities = getArityMap(clauses);

  return function* (...args) {
    let [funcToCall, params] = findMatchingFunction(args, arities);
    return yield* funcToCall.apply(this, params);
  };
}

function defmatchGen(...args) {
  return defmatchgen(...args);
}

function defmatchAsync(...clauses) {
  const arities = getArityMap(clauses);

  return async function (...args) {
    if (arities.has(args.length)) {
      const arityClauses = arities.get(args.length);

      let funcToCall = null;
      let params = null;
      for (let processedClause of arityClauses) {
        let result = [];
        args = fillInOptionalValues(args, processedClause.arity, processedClause.optionals);

        const doesMatch = processedClause.pattern(args, result);
        const [filteredResult, allNamesMatch] = checkNamedVariables(result);

        if (doesMatch && allNamesMatch && (await processedClause.guard.apply(this, result))) {
          funcToCall = processedClause.fn;
          params = result;
          break;
        }
      }

      if (!funcToCall) {
        console.error('No match for:', args);
        throw new MatchError(args);
      }

      return funcToCall.apply(this, params);
    } else {
      console.error('Arity of', args.length, 'not found. No match for:', args);
      throw new MatchError(args);
    }
  };
}

function findMatchingFunction(args, arities) {
  if (arities.has(args.length)) {
    const arityClauses = arities.get(args.length);

    let funcToCall = null;
    let params = null;
    for (let processedClause of arityClauses) {
      let result = [];
      args = fillInOptionalValues(args, processedClause.arity, processedClause.optionals);

      const doesMatch = processedClause.pattern(args, result);
      const [filteredResult, allNamesMatch] = checkNamedVariables(result);

      if (doesMatch && allNamesMatch && processedClause.guard.apply(this, filteredResult)) {
        funcToCall = processedClause.fn;
        params = filteredResult;
        break;
      }
    }

    if (!funcToCall) {
      console.error('No match for:', args);
      throw new MatchError(args);
    }

    return [funcToCall, params];
  } else {
    console.error('Arity of', args.length, 'not found. No match for:', args);
    throw new MatchError(args);
  }
}

function getArityMap(clauses) {
  let map = new Map();

  for (const clause of clauses) {
    const range = getArityRange(clause);

    for (const arity of range) {
      let arityClauses = [];

      if (map.has(arity)) {
        arityClauses = map.get(arity);
      }

      arityClauses.push(clause);
      map.set(arity, arityClauses);
    }
  }

  return map;
}

function getArityRange(clause) {
  const min = clause.arity - clause.optionals.length;
  const max = clause.arity;

  let range = [min];

  while (range[range.length - 1] != max) {
    range.push(range[range.length - 1] + 1);
  }

  return range;
}

function getOptionalValues(pattern) {
  let optionals = [];

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] instanceof Variable && pattern[i].default_value != Symbol.for('tailored.no_value')) {
      optionals.push([i, pattern[i].default_value]);
    }
  }

  return optionals;
}

function fillInOptionalValues(args, arity, optionals) {
  if (args.length === arity || optionals.length === 0) {
    return args;
  }

  if (args.length + optionals.length < arity) {
    return args;
  }

  let numberOfOptionalsToFill = arity - args.length;
  let optionalsToRemove = optionals.length - numberOfOptionalsToFill;

  let optionalsToUse = optionals.slice(optionalsToRemove);

  for (let [index, value] of optionalsToUse) {
    args.splice(index, 0, value);
    if (args.length === arity) {
      break;
    }
  }

  return args;
}

function match(pattern, expr, guard = () => true) {
  let result = [];
  let processedPattern = buildMatch(pattern);
  const doesMatch = processedPattern(expr, result);
  const [filteredResult, allNamesMatch] = checkNamedVariables(result);

  if (doesMatch && allNamesMatch && guard.apply(this, filteredResult)) {
    return filteredResult;
  } else {
    console.error('No match for:', expr);
    throw new MatchError(expr);
  }
}

function checkNamedVariables(results) {
  const namesMap = {};
  const filteredResults = [];

  for (let i = 0; i < results.length; i++) {
    const current = results[i];
    if (current instanceof NamedVariableResult) {
      if (namesMap[current.name] && namesMap[current.name] !== current.value) {
        return [results, false];
      } else if (namesMap[current.name] && namesMap[current.name] === current.value) {
        filteredResults.push(current.value);
      } else {
        namesMap[current.name] = current.value;
        filteredResults.push(current.value);
      }
    } else {
      filteredResults.push(current);
    }
  }

  return [filteredResults, true];
}

function match_or_default(pattern, expr, guard = () => true, default_value = null) {
  let result = [];
  let processedPattern = buildMatch(pattern);
  const doesMatch = processedPattern(expr, result);
  const [filteredResult, allNamesMatch] = checkNamedVariables(result);

  if (doesMatch && allNamesMatch && guard.apply(this, filteredResult)) {
    return filteredResult;
  } else {
    return default_value;
  }
}

const NO_MATCH = Symbol();

function bitstring_generator(pattern, bitstring) {
  return function () {
    let returnResult = [];
    let bsSlice = bitstring.slice(0, pattern.byte_size());
    let i = 1;

    while (bsSlice.byte_size == pattern.byte_size()) {
      const result = match_or_default(pattern, bsSlice, () => true, NO_MATCH);

      if (result != NO_MATCH) {
        const [value] = result;
        returnResult.push(result);
      }

      bsSlice = bitstring.slice(pattern.byte_size() * i, pattern.byte_size() * (i + 1));

      i++;
    }

    return returnResult;
  };
}

function list_generator(pattern, list) {
  return function () {
    let returnResult = [];
    for (let i of list) {
      const result = match_or_default(pattern, i, () => true, NO_MATCH);
      if (result != NO_MATCH) {
        const [value] = result;
        returnResult.push(value);
      }
    }

    return returnResult;
  };
}

function list_comprehension(expression, generators) {
  const generatedValues = run_generators(generators.pop()(), generators);

  let result = [];

  for (let value of generatedValues) {
    if (expression.guard.apply(this, value)) {
      result.push(expression.fn.apply(this, value));
    }
  }

  return result;
}

function run_generators(generator, generators) {
  if (generators.length == 0) {
    return generator.map(x => {
      if (Array.isArray(x)) {
        return x;
      } else {
        return [x];
      }
    });
  } else {
    const list = generators.pop();

    let next_gen = [];
    for (let j of list()) {
      for (let i of generator) {
        next_gen.push([j].concat(i));
      }
    }

    return run_generators(next_gen, generators);
  }
}

function bitstring_comprehension(expression, generators) {
  const generatedValues = run_generators(generators.pop()(), generators);

  let result = [];

  for (let value of generatedValues) {
    if (expression.guard.apply(this, value)) {
      result.push(expression.fn.apply(this, value));
    }
  }

  result = result.map(x => ErlangTypes.BitString.integer(x));
  return new ErlangTypes.BitString(...result);
}

var Patterns = {
  defmatch,
  match,
  MatchError,
  variable,
  wildcard,
  startsWith,
  capture,
  headTail,
  type,
  bound,
  Clause,
  clause,
  bitStringMatch,
  match_or_default,
  defmatchgen,
  list_comprehension,
  list_generator,
  bitstring_generator,
  bitstring_comprehension,
  defmatchGen,
  defmatchAsync
};

// https://github.com/airportyh/protomorphism
class Protocol {
  constructor(spec) {
    this.registry = new Map();
    this.fallback = null;

    function createFun(funName) {
      return function (...args) {
        const thing = args[0];
        let fun = null;

        if (thing === null && this.hasImplementation(Symbol('null'))) {
          fun = this.registry.get(Symbol)[funName];
        } else if (Number.isInteger(thing) && this.hasImplementation(Core.Integer)) {
          fun = this.registry.get(Core.Integer)[funName];
        } else if (typeof thing === 'number' && !Number.isInteger(thing) && this.hasImplementation(Core.Float)) {
          fun = this.registry.get(Core.Float)[funName];
        } else if (typeof thing === 'string' && this.hasImplementation(Core.BitString)) {
          fun = this.registry.get(Core.BitString)[funName];
        } else if (thing && thing instanceof Map && thing.has(Symbol.for('__struct__')) && this.hasImplementation(thing)) {
          fun = this.registry.get(thing.get(Symbol.for('__struct__')).__MODULE__)[funName];
        } else if (thing !== null && this.hasImplementation(thing)) {
          fun = this.registry.get(thing.constructor)[funName];
        } else if (this.fallback) {
          fun = this.fallback[funName];
        }

        if (fun != null) {
          const retval = fun.apply(this, args);
          return retval;
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
    if (thing === Core.Integer || thing === Core.Float || thing === Core.BitString) {
      return this.registry.has(thing);
    } else if (thing && thing instanceof Map && thing.has(Symbol.for('__struct__'))) {
      return this.registry.has(thing.get(Symbol.for('__struct__')).__MODULE__);
    }

    return this.registry.has(thing.constructor);
  }
}

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

  if (typeof item === 'number' || typeof item === 'symbol' || typeof item === 'boolean' || typeof item === 'string') {
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

function map_to_object(map) {
  const object = {};

  for (const [key, value] of map.entries()) {
    if (value instanceof Map) {
      object[key] = map_to_object(value);
    } else {
      object[key] = value;
    }
  }

  return object;
}

class Recurse {
  constructor(func) {
    this.func = func;
    this.pid = Core.global.__process_system__.pid();
  }
}

function trampoline$1(f) {
  let currentValue = f;

  while (currentValue && currentValue instanceof Recurse) {
    currentValue = currentValue.func();
  }

  return currentValue;
}

var Functions = {
  call_property,
  defprotocol,
  defimpl,
  build_namespace,
  map_to_object,
  trampoline: trampoline$1,
  Recurse
};

function _case(condition, clauses) {
  return Core.Patterns.defmatch(...clauses)(condition);
}

function cond(...clauses) {
  for (const clause of clauses) {
    if (clause[0]) {
      return clause[1]();
    }
  }

  throw new Error();
}

function _for(expression, generators, collectable_protocol, into = []) {
  let [result, fun] = collectable_protocol.into(into);

  const generatedValues = run_list_generators(generators.pop()(), generators);

  for (const value of generatedValues) {
    if (expression.guard.apply(this, value)) {
      result = fun(result, new Core.Tuple(Symbol.for('cont'), expression.fn.apply(this, value)));
    }
  }

  return fun(result, Symbol.for('done'));
}

function run_list_generators(generator, generators) {
  if (generators.length == 0) {
    return generator.map(x => {
      if (Array.isArray(x)) {
        return x;
      }
      return [x];
    });
  }
  const list = generators.pop();

  const next_gen = [];
  for (const j of list()) {
    for (const i of generator) {
      next_gen.push([j].concat(i));
    }
  }

  return run_list_generators(next_gen, generators);
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
        if (ex instanceof Core.Patterns.MatchError) {
          throw ex;
        }
      }
    }

    if (catch_fun) {
      try {
        ex_result = catch_fun(e);
        return ex_result;
      } catch (ex) {
        if (ex instanceof Core.Patterns.MatchError) {
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
      if (ex instanceof Core.Patterns.MatchError) {
        throw new Error('No Match Found in Else');
      }

      throw ex;
    }
  } else {
    return result;
  }
}

function _with(...args) {
  let argsToPass = [];
  let successFunction = null;
  let elseFunction = null;

  if (typeof args[args.length - 2] === 'function') {
    [successFunction, elseFunction] = args.splice(-2);
  } else {
    successFunction = args.pop();
  }

  for (let i = 0; i < args.length; i++) {
    const [pattern, func] = args[i];

    const result = func(...argsToPass);

    const patternResult = Core.Patterns.match_or_default(pattern, result);

    if (patternResult == null) {
      if (elseFunction) {
        return elseFunction.call(null, result);
      }
      return result;
    }

    argsToPass = argsToPass.concat(patternResult);
  }

  return successFunction(...argsToPass);
}

function receive(clauses, after) {
  console.warn('Receive not supported');
}

var SpecialForms = {
  _case,
  cond,
  _for,
  _try,
  _with,
  receive
};

// http://erlang.org/doc/man/lists.html
function reverse(list) {
  return [...list].reverse();
}

function foreach(fun, list) {
  list.forEach(x => fun(x));

  return Symbol.for('ok');
}

function duplicate(n, elem) {
  const list = [];

  while (list.length < n) {
    list.push(elem);
  }

  return list;
}

function flatten(deepList, tail = []) {
  const val = deepList.reduce((acc, value) => {
    if (Array.isArray(value)) {
      return acc.concat(flatten(value));
    }

    return acc.concat(value);
  }, []);

  return val.concat(tail);
}

function foldl(fun, acc0, list) {
  return list.reduce((acc, value) => {
    return fun(value, acc);
  }, acc0);
}

function foldr(fun, acc0, list) {
  return foldl(fun, acc0, reverse(list));
}

function keyfind(key, n, tupleList) {
  for (const tuple of tupleList) {
    if (tuple.get(n - 1) === key) {
      return tuple;
    }
  }

  return false;
}

function keymember(key, n, tupleList) {
  if (keyfind(key, n, tupleList) === false) {
    return false;
  }

  return true;
}

function keyreplace(key, n, tupleList, newTuple) {
  const newTupleList = [...tupleList];

  for (let index = 0; index < newTupleList.length; index++) {
    if (newTupleList[index].get(n - 1) === key) {
      newTupleList[index] = newTuple;
      return newTupleList;
    }
  }

  return newTupleList;
}

function keysort(n, tupleList) {
  const newTupleList = [...tupleList];

  return newTupleList.sort((a, b) => {
    if (a.get(n - 1) < b.get(n - 1)) {
      return -1;
    } else if (a.get(n - 1) > b.get(n - 1)) {
      return 1;
    }

    return 0;
  });
}

function keystore(key, n, tupleList, newTuple) {
  const newTupleList = [...tupleList];

  for (let index = 0; index < newTupleList.length; index++) {
    if (newTupleList[index].get(n - 1) === key) {
      newTupleList[index] = newTuple;
      return newTupleList;
    }
  }

  return newTupleList.concat(newTuple);
}

function keydelete(key, n, tupleList) {
  const newTupleList = [];
  let deleted = false;

  for (let index = 0; index < tupleList.length; index++) {
    if (deleted === false && tupleList[index].get(n - 1) === key) {
      deleted = true;
    } else {
      newTupleList.push(tupleList[index]);
    }
  }

  return newTupleList;
}

function keytake(key, n, tupleList) {
  const result = keyfind(key, n, tupleList);

  if (result !== false) {
    return new ErlangTypes.Tuple(result.get(n - 1), result, keydelete(key, n, tupleList));
  }

  return false;
}

function mapfoldl(fun, acc0, list1) {
  const listResult = [];
  let accResult = acc0;

  for (const item of list1) {
    const tuple = fun(item, accResult);
    listResult.push(tuple.get(0));
    accResult = tuple.get(1);
  }

  return new ErlangTypes.Tuple(listResult, accResult);
}

function concat(things) {
  return things.map(v => v.toString()).join();
}

function map(fun, list) {
  return list.map(value => fun(value));
}

function filter(pred, list1) {
  return list1.filter(x => pred(x));
}

function filtermap(fun, list1) {
  const list2 = [];

  for (const item of list1) {
    const value = fun(item);

    if (value === true) {
      list2.push(item);
    } else if (value instanceof ErlangTypes.Tuple && value.get(0) === true) {
      list2.push(value.get(1));
    }
  }

  return list2;
}

function member(elem, list) {
  for (const item of list) {
    if (item === elem) {
      return true;
    }
  }

  return false;
}

function all(pred, list) {
  for (const item of list) {
    if (pred(item) === false) {
      return false;
    }
  }

  return true;
}

function any(pred, list) {
  for (const item of list) {
    if (pred(item) === true) {
      return true;
    }
  }

  return false;
}

function splitwith(pred, list) {
  let switchToList2 = false;
  const list1 = [];
  const list2 = [];

  for (const item of list) {
    if (switchToList2 === true) {
      list2.push(item);
    } else if (pred(item) === true) {
      list1.push(item);
    } else {
      switchToList2 = true;
      list2.push(item);
    }
  }

  return new ErlangTypes.Tuple(list1, list2);
}

function sort(...args) {
  if (args.length === 1) {
    const list2 = [...args[0]];
    return list2.sort();
  }

  const fun = args[0];
  const list2 = [...args[1]];

  return list2.sort((a, b) => {
    const result = fun(a, b);

    if (result === true) {
      return -1;
    }

    return 1;
  });
}

var lists = {
  reverse,
  foreach,
  duplicate,
  flatten,
  foldl,
  foldr,
  keydelete,
  keyfind,
  keymember,
  keyreplace,
  keysort,
  keystore,
  keytake,
  mapfoldl,
  concat,
  map,
  filter,
  filtermap,
  member,
  all,
  any,
  splitwith,
  sort
};

// http://erlang.org/doc/man/erlang.html
const selfPID = new ErlangTypes.PID();

function atom_to_binary(atom, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  if (atom === null) {
    return 'nil';
  } else if (is_boolean$1(atom)) {
    return atom.toString();
  } else if (atom.__MODULE__) {
    return Symbol.keyFor(atom.__MODULE__);
  }

  return Symbol.keyFor(atom);
}

function atom_to_list(atom) {
  return atom_to_binary(atom);
}

function binary_to_atom(binary, encoding = Symbol.for('utf8')) {
  if (encoding !== Symbol.for('utf8')) {
    throw new Error(`unsupported encoding ${encoding}`);
  }

  if (binary === 'nil') {
    return null;
  } else if (binary === 'true') {
    return true;
  } else if (binary === 'false') {
    return false;
  }

  return Symbol.for(binary);
}

function binary_to_existing_atom(binary, encoding = Symbol.for('utf8')) {
  return binary_to_atom(binary, encoding);
}

function list_concatenation(list1, list2) {
  return list1.concat(list2);
}

function list_subtraction(list1, list2) {
  const list = [...list1];

  for (const item of list2) {
    const index = list.indexOf(item);

    if (index > -1) {
      list.splice(index, 1);
    }
  }

  return list;
}

function div(left, right) {
  return left / right;
}

function not(x) {
  return !x;
}

function rem(left, right) {
  return left % right;
}

function band(left, right) {
  return left & right;
}

function bor(left, right) {
  return left | right;
}

function bnot(x) {
  return ~x;
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

function is_atom(value) {
  if (value === null) {
    return true;
  } else if (is_boolean$1(value)) {
    return true;
  }

  return typeof value === 'symbol' || value instanceof Symbol || value.__MODULE__ != null;
}

function is_bitstring$1(value) {
  return value instanceof ErlangTypes.BitString;
}

function is_boolean$1(value) {
  return typeof value === 'boolean' || value instanceof Boolean;
}

function is_number$1(value) {
  return typeof value === 'number' || value instanceof Number;
}

function is_float(value) {
  return is_number$1(value) && !Number.isInteger(value);
}

function is_function$1(value) {
  return typeof value === 'function' || value instanceof Function;
}

function is_integer(value) {
  return Number.isInteger(value);
}

function is_list(value) {
  return Array.isArray(value);
}

function is_map$1(value) {
  return value instanceof Map;
}

function is_pid(value) {
  return value instanceof ErlangTypes.PID;
}

function is_port() {
  return false;
}

function is_reference(value) {
  return value instanceof ErlangTypes.Reference;
}

function is_tuple(value) {
  return value instanceof ErlangTypes.Tuple;
}

function is_binary(value) {
  return typeof value === 'string' || value instanceof String;
}

function element(n, tuple) {
  return tuple.get(n - 1);
}

function setelement(index, tuple1, value) {
  const tupleData = [...tuple1.values];

  tupleData[index - 1] = value;

  return new ErlangTypes.Tuple(...tupleData);
}

function make_tuple(arity, initialValue) {
  const list = [];

  for (let i = 0; i < arity; i++) {
    list.push(initialValue);
  }

  return new ErlangTypes.Tuple(...list);
}

function insert_element(index, tuple, term) {
  const list = [...tuple.values];
  list.splice(index - 1, 0, term);

  return new ErlangTypes.Tuple(...list);
}

function append_element(tuple, term) {
  const list = [...tuple.values];
  list.push(term);

  return new ErlangTypes.Tuple(...list);
}

function delete_element(index, tuple) {
  const list = [...tuple.values];
  list.splice(index - 1, 1);

  return new ErlangTypes.Tuple(...list);
}

function tuple_to_list(tuple) {
  const list = [...tuple.values];
  return list;
}

function abs(number) {
  return Math.abs(number);
}

function apply(...args) {
  if (args.length === 2) {
    return args[0].apply(this, ...args[1]);
  }

  return args[0][atom_to_binary(args[1])].apply(this, ...args[2]);
}

function binary_part(binary, start, _length) {
  return binary.substring(start, start + _length);
}

function bit_size(bitstring) {
  return bitstring.bit_size;
}

function byte_size(bitstring) {
  return bitstring.byte_size;
}

function hd(list) {
  return list[0];
}

function length(list) {
  return list.length;
}

function make_ref() {
  return new ErlangTypes.Reference();
}

function map_size(map) {
  return map.size;
}

function max(first, second) {
  return Math.max(first, second);
}

function min(first, second) {
  return Math.min(first, second);
}

function round(number) {
  return Math.round(number);
}

function tl(list) {
  return list.slice(1);
}

function trunc(number) {
  return Math.trunc(number);
}

function tuple_size(tuple) {
  return tuple.length;
}

function binary_to_float(str) {
  return parseFloat(str);
}

function binary_to_integer(str, base = 10) {
  return parseInt(str, base);
}

function process_info(pid, item) {
  if (item) {
    if (item === Symbol.for('current_stacktrace')) {
      return new ErlangTypes.Tuple(item, []);
    }

    return new ErlangTypes.Tuple(item, null);
  }

  return [];
}

function list_to_binary(iolist) {
  const iolistFlattened = lists.flatten(iolist);

  const value = iolistFlattened.reduce((acc, current) => {
    if (current === null) {
      return acc;
    } else if (is_integer(current)) {
      return acc + String.fromCodePoint(current);
    } else if (is_bitstring$1(current)) {
      return acc + String.fromCodePoint(...current.value);
    }

    return acc + current;
  }, '');

  return value;
}

function iolist_to_binary(ioListOrBinary) {
  if (ioListOrBinary === null) {
    return '';
  }

  if (is_binary(ioListOrBinary)) {
    return ioListOrBinary;
  }

  if (is_bitstring$1(ioListOrBinary)) {
    return String.fromCodePoint(...ioListOrBinary.value);
  }

  if (is_number$1(ioListOrBinary)) {
    return String.fromCodePoint(ioListOrBinary);
  }

  const iolistFlattened = lists.flatten(ioListOrBinary);

  const value = iolistFlattened.reduce((acc, current) => {
    if (current === null) {
      return acc;
    } else if (is_integer(current)) {
      return acc + String.fromCodePoint(current);
    } else if (is_bitstring$1(current)) {
      return acc + String.fromCodePoint(...current.value);
    }

    return acc + iolist_to_binary(current);
  }, '');

  return value;
}

function io_size(ioListOrBinary) {
  return iolist_to_binary(ioListOrBinary).length;
}

function integer_to_binary(integer, base = 10) {
  return integer.toString(base);
}

function node() {
  return Symbol.for('nonode@nohost');
}

function self$1() {
  return selfPID;
}

function _throw(term) {
  throw term;
}

function error(reason) {
  throw new ErlangTypes.Tuple(reason, []);
}

function exit(...args) {
  if (args.length === 2) {
    throw args[1];
  } else {
    throw args[0];
  }
}

function raise(_class, reason) {
  if (_class === Symbol.for('throw')) {
    _throw(reason);
  } else if (_class === Symbol.for('error')) {
    error(reason);
  } else {
    exit(reason);
  }
}

var erlang = {
  atom_to_binary,
  binary_to_atom,
  binary_to_existing_atom,
  list_concatenation,
  list_subtraction,
  div,
  not,
  rem,
  band,
  bor,
  bsl,
  bsr,
  bxor,
  bnot,
  is_bitstring: is_bitstring$1,
  is_boolean: is_boolean$1,
  is_float,
  is_function: is_function$1,
  is_integer,
  is_list,
  is_map: is_map$1,
  is_number: is_number$1,
  is_pid,
  is_port,
  is_reference,
  is_tuple,
  is_atom,
  is_binary,
  element,
  setelement,
  make_tuple,
  insert_element,
  append_element,
  delete_element,
  tuple_to_list,
  abs,
  apply,
  binary_part,
  bit_size,
  byte_size,
  hd,
  length,
  make_ref,
  map_size,
  max,
  min,
  round,
  tl,
  trunc,
  tuple_size,
  binary_to_float,
  binary_to_integer,
  process_info,
  iolist_to_binary,
  io_size,
  integer_to_binary,
  atom_to_list,
  node,
  self: self$1,
  throw: _throw,
  error,
  exit,
  raise,
  list_to_binary
};

// http://erlang.org/doc/man/maps.html
const OK = Symbol.for('ok');
const ERROR = Symbol.for('error');
const BADMAP = Symbol.for('badmap');
const BADKEY = Symbol.for('badkey');

function find(key, map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const value = map.get(key);

  if (typeof value !== 'undefined') {
    return new ErlangTypes.Tuple(OK, value);
  }

  return ERROR;
}

function fold(fun, init, map) {
  let acc = init;

  for (const [key, value] of map.entries()) {
    acc = fun(key, value, acc);
  }

  return acc;
}

function remove(key, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  const map2 = new Map(map1);

  map2.delete(key);

  return map2;
}

function to_list(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  const list = [];

  for (const [key, value] of map.entries()) {
    list.push(new ErlangTypes.Tuple(key, value));
  }

  return list;
}

function from_list(list) {
  return list.reduce((acc, item) => {
    const [key, value] = item;
    acc.set(key, value);

    return acc;
  }, new Map());
}

function keys(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  return Array.from(map.keys());
}

function values$1(map) {
  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  return Array.from(map.values());
}

function is_key(key, map) {
  return map.has(key);
}

function put(key, value, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  const map2 = new Map(map1);
  map2.set(key, value);

  return map2;
}

function merge(map1, map2) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  if (erlang.is_map(map2) === false) {
    return new ErlangTypes.Tuple(BADMAP, map2);
  }

  return new Map([...map1, ...map2]);
}

function update(key, value, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  if (is_key(key, map1) === false) {
    return new ErlangTypes.Tuple(BADKEY, key);
  }

  return new Map([...map1, [key, value]]);
}

function get(...args) {
  const key = args[0];
  const map = args[1];

  if (erlang.is_map(map) === false) {
    return new ErlangTypes.Tuple(BADMAP, map);
  }

  if (is_key(key)) {
    return map.get(key);
  }

  if (args.length === 3) {
    return args[2];
  }

  return new ErlangTypes.Tuple(BADKEY, key);
}

function take(key, map1) {
  if (erlang.is_map(map1) === false) {
    return new ErlangTypes.Tuple(BADMAP, map1);
  }

  if (!is_key(key)) {
    return ERROR;
  }

  const value = map1.get(key);
  const map2 = new Map(map1);
  map2.delete(key);

  return new ErlangTypes.Tuple(value, map2);
}

var maps = {
  find,
  fold,
  remove,
  to_list,
  from_list,
  keys,
  values: values$1,
  is_key,
  put,
  merge,
  update,
  get,
  take
};

function warn(message) {
  const messageString = message.join('');
  console.warn(`warning: ${messageString}`);

  return Symbol.for('ok');
}

var elixir_errors = {
  warn
};

const MODULE = Symbol.for('elixir_config');
const ets = new Map();

function _new(opts) {
  ets.set(MODULE, new Map());
  ets.get(MODULE).set(MODULE, opts);
  return MODULE;
}

function _delete(module) {
  ets.delete(module);
  return true;
}

function put$1(key, value) {
  ets.get(MODULE).set(key, value);
  return Symbol.for('ok');
}

function get$1(key) {
  return ets.get(MODULE).get(key);
}

function update$1(key, fun) {
  const value = fun(ets.get(MODULE).get(key));
  put$1(key, value);
  return value;
}

function get_and_put(key, value) {
  const oldValue = get$1(key);
  put$1(key, value);
  return oldValue;
}

var elixir_config = {
  new: _new,
  delete: _delete,
  put: put$1,
  get: get$1,
  update: update$1,
  get_and_put
};

function put_chars(ioDevice, charData) {
  const dataToWrite = erlang.iolist_to_binary(charData);

  if (ioDevice === Symbol.for('stderr')) {
    console.error(dataToWrite);
  } else {
    console.log(dataToWrite);
  }

  return Symbol.for('ok');
}

var io = {
  put_chars
};

function copy(subject, n = 1) {
  return subject.repeat(n);
}

function list_to_bin(bytelist) {
  return erlang.list_to_binary(bytelist);
}

var binary = {
  copy,
  list_to_bin
};

function characters_to_list(characters, inEncoding = Symbol.for('unicode')) {
  let values = characters;

  if (Array.isArray(characters)) {
    values = lists.flatten(characters);
  }

  if (erlang.is_binary(values)) {
    return values.split('').map(c => c.codePointAt(0));
  }

  return values.reduce((acc, c) => {
    if (erlang.is_integer(c)) {
      return acc.concat(c);
    }

    return acc.concat(characters_to_list(c, inEncoding));
  }, []);
}

function characters_to_binary(characters) {
  const values = characters_to_list(characters);

  return String.fromCodePoint(...values);
}

var unicode = {
  characters_to_list,
  characters_to_binary
};

function get_key(key) {
  let real_key = key;

  if (__elixirscript_names__.has(key)) {
    real_key = __elixirscript_names__.get(key);
  }

  if (__elixirscript_store__.has(real_key)) {
    return real_key;
  }

  throw new Error(`Key ${real_key} not found`);
}

function create(value, name = null) {
  const key = new Core.PID();

  if (name !== null) {
    __elixirscript_names__.set(name, key);
  }

  return __elixirscript_store__.set(key, value);
}

function update$2(key, value) {
  const real_key = get_key(key);
  return __elixirscript_store__.set(real_key, value);
}

function read(key) {
  const real_key = get_key(key);
  return __elixirscript_store__.get(real_key);
}

function remove$1(key) {
  const real_key = get_key(key);
  return __elixirscript_store__.delete(real_key);
}

var Store = {
  create,
  update: update$2,
  read,
  remove: remove$1
};

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
  NORMAL: Symbol.for('normal'),
  KILL: Symbol.for('kill'),
  SUSPEND: Symbol.for('suspend'),
  CONTINUE: Symbol.for('continue'),
  RECEIVE: Symbol.for('receive'),
  SEND: Symbol.for('send'),
  SLEEPING: Symbol.for('sleeping'),
  RUNNING: Symbol.for('running'),
  SUSPENDED: Symbol.for('suspended'),
  STOPPED: Symbol.for('stopped'),
  SLEEP: Symbol.for('sleep'),
  EXIT: Symbol.for('exit'),
  NOMATCH: Symbol.for('no_match')
};

function is_sleep(value) {
  return Array.isArray(value) && value[0] === States.SLEEP;
}

function is_receive(value) {
  return Array.isArray(value) && value[0] === States.RECEIVE;
}

function receive_timed_out(value) {
  return value[2] != null && value[2] < Date.now();
}

class Process {
  constructor(pid, func, args, mailbox, system) {
    this.pid = pid;
    this.func = func;
    this.args = args;
    this.mailbox = mailbox;
    this.system = system;
    this.status = States.STOPPED;
    this.dict = {};
    this.flags = {};
    this.monitors = [];
  }

  start() {
    const function_scope = this;
    console.log('HERE!!!!');
    const machine = new Functions.Recurse(this.main.bind(null, []));

    this.system.schedule(() => {
      function_scope.system.set_current(function_scope.pid);
      function_scope.run(machine);
    }, this.pid);
  }

  main() {
    let retval = States.NORMAL;

    try {
      this.func.apply(null, this.args);
    } catch (e) {
      console.error(e);
      retval = e;
    }

    this.system.exit(retval);
  }

  process_flag(flag, value) {
    const old_value = this.flags[flag];
    this.flags[flag] = value;
    return old_value;
  }

  is_trapping_exits() {
    return this.flags[Symbol.for('trap_exit')] && this.flags[Symbol.for('trap_exit')] === true;
  }

  signal(reason) {
    if (reason !== States.NORMAL) {
      console.error(reason);
    }

    this.system.remove_proc(this.pid, reason);
  }

  receive(fun) {
    let value = States.NOMATCH;
    const messages = this.mailbox.get();

    for (let i = 0; i < messages.length; i++) {
      try {
        value = fun(messages[i]);
        if (value !== States.NOMATCH) {
          this.mailbox.removeAt(i);
          break;
        }
      } catch (e) {
        if (e.constructor.name !== 'MatchError') {
          this.exit(e);
        }
      }
    }

    return value;
  }

  run(f) {
    const currentValue = f;

    if (currentValue && currentValue instanceof Functions.Recurse) {
      const function_scope = this;

      if (is_sleep(currentValue)) {
        this.system.delay(() => {
          function_scope.system.set_current(function_scope.pid);
          function_scope.run(currentValue);
        }, currentValue[1]);
      } else if (is_receive(currentValue) && receive_timed_out(currentValue)) {
        const result = currentValue[3]();

        this.system.schedule(() => {
          function_scope.system.set_current(function_scope.pid);
          function_scope.run(currentValue.receivedTimedOut(result));
        });
      } else if (is_receive(currentValue)) {
        const result = function_scope.receive(currentValue[1]);

        if (result === States.NOMATCH) {
          this.system.suspend(() => {
            function_scope.system.set_current(function_scope.pid);
            function_scope.run(currentValue);
          });
        } else {
          this.system.schedule(() => {
            function_scope.system.set_current(function_scope.pid);
            function_scope.run(currentValue.received(result));
          });
        }
      } else {
        this.system.schedule(() => {
          function_scope.system.set_current(function_scope.pid);
          function_scope.run(currentValue.received(value));
        });
      }
    }
  }
}

class ProcessQueue {
  constructor(pid) {
    this.pid = pid;
    this.tasks = [];
  }

  empty() {
    return this.tasks.length === 0;
  }

  add(task) {
    this.tasks.push(task);
  }

  next() {
    return this.tasks.shift();
  }
}

class Scheduler {
  constructor(throttle = 0, reductions_per_process = 8) {
    this.isRunning = false;
    this.invokeLater = callback => {
      setTimeout(callback, throttle);
    };

    // In our case a reduction is equal to a task call
    // Controls how many tasks are called at a time per process
    this.reductions_per_process = reductions_per_process;
    this.queues = new Map();
    this.run();
  }

  addToQueue(pid, task) {
    if (!this.queues.has(pid)) {
      this.queues.set(pid, new ProcessQueue(pid));
    }

    this.queues.get(pid).add(task);
  }

  removePid(pid) {
    this.isRunning = true;

    this.queues.delete(pid);

    this.isRunning = false;
  }

  run() {
    if (this.isRunning) {
      this.invokeLater(() => {
        this.run();
      });
    } else {
      for (let [pid, queue] of this.queues) {
        let reductions = 0;
        while (queue && !queue.empty() && reductions < this.reductions_per_process) {
          let task = queue.next();
          this.isRunning = true;

          let result;

          try {
            result = task();
          } catch (e) {
            console.error(e);
            result = e;
          }

          this.isRunning = false;

          if (result instanceof Error) {
            throw result;
          }

          reductions++;
        }
      }

      this.invokeLater(() => {
        this.run();
      });
    }
  }

  addToScheduler(pid, task, dueTime = 0) {
    if (dueTime === 0) {
      this.invokeLater(() => {
        this.addToQueue(pid, task);
      });
    } else {
      setTimeout(() => {
        this.addToQueue(pid, task);
      }, dueTime);
    }
  }

  schedule(pid, task) {
    this.addToScheduler(pid, () => {
      task();
    });
  }

  scheduleFuture(pid, dueTime, task) {
    this.addToScheduler(pid, () => {
      task();
    }, dueTime);
  }
}

class ProcessSystem {
  constructor() {
    this.pids = new Map();
    this.mailboxes = new Map();
    this.names = new Map();
    this.links = new Map();
    this.monitors = new Map();

    const throttle = 5; // ms between scheduled tasks
    this.current_process = null;
    this.scheduler = new Scheduler(throttle);
    this.suspended = new Map();

    this.main_process_pid = new ErlangTypes.PID();
    this.set_current(this.main_process_pid);
  }

  spawn(...args) {
    if (args.length === 1) {
      const fun = args[0];
      return this.add_proc(fun, [], false).pid;
    }
    const mod = args[0];
    const fun = args[1];
    const the_args = args[2];

    return this.add_proc(mod[fun], the_args, false, false).pid;
  }

  spawn_link(...args) {
    if (args.length === 1) {
      const fun = args[0];
      return this.add_proc(fun, [], true, false).pid;
    }

    const mod = args[0];
    const fun = args[1];
    const the_args = args[2];

    return this.add_proc(mod[fun], the_args, true, false).pid;
  }

  link(pid) {
    this.links.get(this.pid()).add(pid);
    this.links.get(pid).add(this.pid());
  }

  unlink(pid) {
    this.links.get(this.pid()).delete(pid);
    this.links.get(pid).delete(this.pid());
  }

  spawn_monitor(...args) {
    if (args.length === 1) {
      const fun = args[0];
      const process = this.add_proc(fun, [], false, true);
      return [process.pid, process.monitors[0]];
    }

    const mod = args[0];
    const fun = args[1];
    const the_args = args[2];
    const process = this.add_proc(mod[fun], the_args, false, true);

    return [process.pid, process.monitors[0]];
  }

  monitor(pid) {
    const real_pid = this.pidof(pid);
    const ref = this.make_ref();

    if (real_pid) {
      this.monitors.set(ref, {
        monitor: this.current_process.pid,
        monitee: real_pid
      });
      this.pids.get(real_pid).monitors.push(ref);
      return ref;
    }

    this.send(this.current_process.pid, new ErlangTypes.Tuple('DOWN', ref, pid, real_pid, Symbol.for('noproc')));
    return ref;
  }

  demonitor(ref) {
    if (this.monitor.has(ref)) {
      this.monitor.delete(ref);
      return true;
    }

    return false;
  }

  set_current(id) {
    const pid = this.pidof(id);
    if (pid !== null) {
      this.current_process = this.pids.get(pid);
      this.current_process.status = States.RUNNING;
    }
  }

  add_proc(fun, args, linked, monitored) {
    const newpid = new ErlangTypes.PID();
    const mailbox = new Mailbox();
    const newproc = new Process(newpid, fun, args, mailbox, this);

    this.pids.set(newpid, newproc);
    this.mailboxes.set(newpid, mailbox);
    this.links.set(newpid, new Set());

    if (linked) {
      this.link(newpid);
    }

    if (monitored) {
      this.monitor(newpid);
    }

    newproc.start();
    return newproc;
  }

  remove_proc(pid, exitreason) {
    this.pids.delete(pid);
    this.unregister(pid);
    this.scheduler.removePid(pid);

    if (this.links.has(pid)) {
      for (const linkpid of this.links.get(pid)) {
        this.exit(linkpid, exitreason);
        this.links.get(linkpid).delete(pid);
      }

      this.links.delete(pid);
    }
  }

  register(name, pid) {
    if (!this.names.has(name)) {
      this.names.set(name, pid);
    } else {
      throw new Error('Name is already registered to another process');
    }
  }

  whereis(name) {
    return this.names.has(name) ? this.names.get(name) : null;
  }

  registered() {
    return this.names.keys();
  }

  unregister(pid) {
    for (const name of this.names.keys()) {
      if (this.names.has(name) && this.names.get(name) === pid) {
        this.names.delete(name);
      }
    }
  }

  pid() {
    return this.current_process ? this.current_process.pid : this.main_process_pid;
  }

  pidof(id) {
    if (id instanceof ErlangTypes.PID) {
      return this.pids.has(id) ? id : null;
    } else if (id instanceof Process) {
      return id.pid;
    }

    const pid = this.whereis(id);
    if (pid === null) {
      throw `Process name not registered: ${id} (${typeof id})`;
    }

    return pid;
  }

  send(id, msg) {
    const pid = this.pidof(id);

    if (pid) {
      this.mailboxes.get(pid).deliver(msg);

      if (this.suspended.has(pid)) {
        const fun = this.suspended.get(pid);
        this.suspended.delete(pid);
        this.schedule(fun);
      }
    }

    return msg;
  }

  receive(fun, timeout = 0, timeoutFn = () => true) {
    let DateTimeout = null;

    if (timeout === 0 || timeout === Infinity) {
      DateTimeout = null;
    } else {
      DateTimeout = Date.now() + timeout;
    }

    return [States.RECEIVE, fun, DateTimeout, timeoutFn];
  }

  sleep(duration) {
    return [States.SLEEP, duration];
  }

  suspend(fun) {
    this.current_process.status = States.SUSPENDED;
    this.suspended.set(this.current_process.pid, fun);
  }

  delay(fun, time) {
    this.current_process.status = States.SLEEPING;

    if (Number.isInteger(time)) {
      this.scheduler.scheduleFuture(this.current_process.pid, time, fun);
    }
  }

  schedule(fun, pid) {
    const the_pid = pid != null ? pid : this.current_process.pid;
    this.scheduler.schedule(the_pid, fun);
  }

  exit(one, two) {
    let pid = null;
    let reason = null;
    let process = null;

    if (two) {
      pid = one;
      reason = two;
      process = this.pids.get(this.pidof(pid));

      if (process && process.is_trapping_exits() || reason === States.KILL || reason === States.NORMAL) {
        this.mailboxes.get(process.pid).deliver(new ErlangTypes.Tuple(States.EXIT, this.pid(), reason));
      } else {
        process.signal(reason);
      }
    } else {
      pid = this.current_process.pid;
      reason = one;
      process = this.current_process;

      process.signal(reason);
    }

    for (const ref in process.monitors) {
      const mons = this.monitors.get(ref);
      this.send(mons.monitor, new ErlangTypes.Tuple('DOWN', ref, mons.monitee, mons.monitee, reason));
    }
  }

  error(reason) {
    this.current_process.signal(reason);
  }

  process_flag(...args) {
    if (args.length === 2) {
      const flag = args[0];
      const value = args[1];
      return this.current_process.process_flag(flag, value);
    }

    const pid = this.pidof(args[0]);
    const flag = args[1];
    const value = args[2];
    return this.pids.get(pid).process_flag(flag, value);
  }

  put(key, value) {
    this.current_process.dict[key] = value;
  }

  get_process_dict() {
    return this.current_process.dict;
  }

  get(key, default_value = null) {
    if (key in this.current_process.dict) {
      return this.current_process.dict[key];
    }

    return default_value;
  }

  get_keys(value) {
    if (value) {
      const keys = [];

      for (const key of Object.keys(this.current_process.dict)) {
        if (this.current_process.dict[key] === value) {
          keys.push(key);
        }
      }

      return keys;
    }

    return Object.keys(this.current_process.dict);
  }

  erase(key) {
    if (key != null) {
      delete this.current_process.dict[key];
    } else {
      this.current_process.dict = {};
    }
  }

  is_alive(pid) {
    const real_pid = this.pidof(pid);
    return real_pid != null;
  }

  list() {
    return Array.from(this.pids.keys());
  }

  make_ref() {
    return new ErlangTypes.Reference();
  }
}

class Integer {}
class Float {}

function get_global() {
  if (typeof self !== 'undefined') {
    return self;
  } else if (typeof window !== 'undefined') {
    return window;
  } else if (typeof global !== 'undefined') {
    return global;
  }

  console.warn('No global state found');
  return null;
}

const globalState = get_global();

globalState.__elixirscript_store__ = new Map();
globalState.__elixirscript_names__ = new Map();

globalState.__process_system__ = new ProcessSystem();

var Core = {
  Tuple: ErlangTypes.Tuple,
  PID: ErlangTypes.PID,
  BitString: ErlangTypes.BitString,
  Patterns,
  Integer,
  Float,
  Functions,
  SpecialForms,
  Store,
  global: globalState,
  erlang,
  maps,
  lists,
  elixir_errors,
  io,
  binary,
  unicode,
  elixir_config
};

var elixir = {
  Core
};

return elixir;

}());
