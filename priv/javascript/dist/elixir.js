"use strict";

var Atom = undefined;

Atom = function (_value) {
  return Symbol["for"](_value);
};

Atom.__MODULE__ = Atom("Atom");

Atom.to_string = function (atom) {
  var atomString = atom.toString();
  var indexOfOpenParen = atomString.indexOf("(");
  var indexOfCloseParen = atomString.lastIndexOf(")");
  return atomString.substring(indexOfOpenParen + 1, indexOfCloseParen);
};

Atom.to_char_list = function (atom) {
  var char_list = [];

  var atomString = Atom.to_string(atom);

  for (var i = 0; i < atomString.length; i++) {
    char_list.push(atomString.charAt(i));
  }

  return char_list;
};
'use strict';

var _bind = Function.prototype.bind;
'use strict';

if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function value(target, firstSource) {
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

if (!String.prototype.codePointAt) {
  (function () {
    var codePointAt = function codePointAt(position) {
      if (this == null) {
        throw TypeError();
      }
      var string = String(this);
      var size = string.length;
      // `ToInteger`
      var index = position ? Number(position) : 0;
      if (index !== index) {
        // better `isNaN`
        index = 0;
      }
      // Account for out-of-bounds indices:
      if (index < 0 || index >= size) {
        return undefined;
      }
      // Get the first code unit
      var first = string.charCodeAt(index);
      var second;
      if ( // check if it’s the start of a surrogate pair
      first >= 55296 && first <= 56319 && // high surrogate
      size > index + 1 // there is a next code unit
      ) {
        second = string.charCodeAt(index + 1);
        if (second >= 56320 && second <= 57343) {
          // low surrogate
          // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          return (first - 55296) * 1024 + second - 56320 + 65536;
        }
      }
      return first;
    };
    if (Object.defineProperty) {
      Object.defineProperty(String.prototype, 'codePointAt', {
        'value': codePointAt,
        'configurable': true,
        'writable': true
      });
    } else {
      String.prototype.codePointAt = codePointAt;
    }
  })();
}

var BitString = function BitString() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (!(this instanceof BitString)) {
    return new (_bind.apply(BitString, [null].concat(args)))();
  }

  this.raw_value = function () {
    return Object.freeze(args);
  };

  var _value = Object.freeze(this.process(args));

  this.value = function () {
    return _value;
  };

  this.length = function () {
    return _value.length;
  };

  this.get = function (i) {
    return _value[i];
  };

  return this;
};

BitString.prototype.__MODULE__ = Atom('BitString');

BitString.prototype[Symbol.iterator] = function () {
  return this.value()[Symbol.iterator]();
};

BitString.prototype.toString = function () {
  var i,
      s = '';
  for (i = 0; i < this.length(); i++) {
    if (s !== '') {
      s += ', ';
    }
    s += this.get(i).toString();
  }

  return '<<' + s + '>>';
};

BitString.prototype.process = function () {
  var processed_values = [];

  var i;
  for (i = 0; i < this.raw_value().length; i++) {
    var processed_value = this['process_' + this.raw_value()[i].type](this.raw_value()[i]);

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = this.raw_value()[i].attributes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var attr = _step.value;

        processed_value = this['process_' + attr](processed_value);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    processed_values = processed_values.concat(processed_value);
  }

  return processed_values;
};

BitString.prototype.process_integer = function (value) {
  return value.value;
};

BitString.prototype.process_float = function (value) {
  if (value.size === 64) {
    return BitString.float64ToBytes(value.value);
  } else if (value.size === 32) {
    return BitString.float32ToBytes(value.value);
  }

  throw new Error('Invalid size for float');
};

BitString.prototype.process_bitstring = function (value) {
  return value.value.value;
};

BitString.prototype.process_binary = function (value) {
  return BitString.toUTF8Array(value.value);
};

BitString.prototype.process_utf8 = function (value) {
  return BitString.toUTF8Array(value.value);
};

BitString.prototype.process_utf16 = function (value) {
  return BitString.toUTF16Array(value.value);
};

BitString.prototype.process_utf32 = function (value) {
  return BitString.toUTF32Array(value.value);
};

BitString.prototype.process_signed = function (value) {
  return new Uint8Array([value])[0];
};

BitString.prototype.process_unsigned = function (value) {
  return value;
};

BitString.prototype.process_native = function (value) {
  return value;
};

BitString.prototype.process_big = function (value) {
  return value;
};

BitString.prototype.process_little = function (value) {
  return value.reverse();
};

BitString.prototype.process_size = function (value) {
  return value;
};

BitString.prototype.process_unit = function (value) {
  return value;
};

BitString.integer = function (value) {
  return BitString.wrap(value, { 'type': 'integer', 'unit': 1, 'size': 8 });
};

BitString.float = function (value) {
  return BitString.wrap(value, { 'type': 'float', 'unit': 1, 'size': 64 });
};

BitString.bitstring = function (value) {
  return BitString.wrap(value, { 'type': 'bitstring', 'unit': 1, 'size': value.length });
};

BitString.bits = function (value) {
  return BitString.bitstring(value);
};

BitString.binary = function (value) {
  return BitString.wrap(value, { 'type': 'binary', 'unit': 8, 'size': value.length });
};

BitString.bytes = function (value) {
  return BitString.binary(value);
};

BitString.utf8 = function (value) {
  return BitString.wrap(value, { 'type': 'utf8' });
};

BitString.utf16 = function (value) {
  return BitString.wrap(value, { 'type': 'utf16' });
};

BitString.utf32 = function (value) {
  return BitString.wrap(value, { 'type': 'utf32' });
};

BitString.signed = function (value) {
  return BitString.wrap(value, {}, 'signed');
};

BitString.unsigned = function (value) {
  return BitString.wrap(value, {}, 'unsigned');
};

BitString.native = function (value) {
  return BitString.wrap(value, {}, 'native');
};

BitString.big = function (value) {
  return BitString.wrap(value, {}, 'big');
};

BitString.little = function (value) {
  return BitString.wrap(value, {}, 'little');
};

BitString.size = function (value, count) {
  return BitString.wrap(value, { 'size': count });
};

BitString.unit = function (value, count) {
  return BitString.wrap(value, { 'unit': count });
};

BitString.wrap = function (value, opt) {
  var new_attribute = arguments[2] === undefined ? null : arguments[2];

  var the_value = value;

  if (!(value instanceof Object)) {
    the_value = { 'value': value, 'attributes': [] };
  }

  the_value = Object.assign(the_value, opt);

  if (new_attribute) {
    the_value.attributes.push(new_attribute);
  }

  return the_value;
};

BitString.toUTF8Array = function (str) {
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
};

BitString.toUTF16Array = function (str) {
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
};

BitString.toUTF32Array = function (str) {
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
};

//http://stackoverflow.com/questions/2003493/javascript-float-from-to-bits
BitString.float32ToBytes = function (f) {
  var bytes = [];

  var buf = new ArrayBuffer(4);
  new Float32Array(buf)[0] = f;

  var intVersion = new Uint32Array(buf)[0];

  bytes.push(intVersion >> 24 & 255);
  bytes.push(intVersion >> 16 & 255);
  bytes.push(intVersion >> 8 & 255);
  bytes.push(intVersion & 255);

  return bytes;
};

BitString.float64ToBytes = function (f) {
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
};
'use strict';

var ElixirScript = {
  __MODULE__: Atom('ElixirScript'),

  get_property_or_call_function: function get_property_or_call_function(item, property) {
    if (item[property] instanceof Function) {
      return item[property]();
    } else {
      return item[property];
    }
  }
};
'use strict';

var Enum = {
  __MODULE__: Atom('Enum'),

  all__qmark__: function all__qmark__(collection) {
    var fun = arguments[1] === undefined ? function (x) {
      return x;
    } : arguments[1];

    var result = Enum.filter(collection, function (x) {
      return !fun(x);
    });

    return result === [];
  },

  any__qmark__: function any__qmark__(collection) {
    var fun = arguments[1] === undefined ? function (x) {
      return x;
    } : arguments[1];

    var result = Enum.filter(collection, function (x) {
      return fun(x);
    });

    return result !== [];
  },

  at: function at(collection, n) {
    var the_default = arguments[2] === undefined ? null : arguments[2];

    for (var i = 0; i < collection.length(); i++) {
      if (i === n) {
        return collection.get(i);
      }
    }

    return the_default;
  },

  count: function count(collection) {
    var fun = arguments[1] === undefined ? null : arguments[1];

    if (fun == null) {
      return Kernel.length(collection);
    } else {
      return Kernel.length(collection.value().filter(fun));
    }
  },

  each: function each(collection, fun) {
    [].forEach.call(collection.value(), fun);
  },

  empty__qmark__: function empty__qmark__(collection) {
    return Kernel.length(collection) === 0;
  },

  fetch: function fetch(collection, n) {
    if (Kernel.is_list(collection)) {
      if (n < collection.length() && n >= 0) {
        return Tuple(Atom('ok'), collection.get(n));
      } else {
        return Atom('error');
      }
    }

    throw new Error('collection is not an Enumerable');
  },

  fetch__emark__: function fetch__emark__(collection, n) {
    if (Kernel.is_list(collection)) {
      if (n < collection.length() && n >= 0) {
        return collection.get(n);
      } else {
        throw new Error('out of bounds error');
      }
    }

    throw new Error('collection is not an Enumerable');
  },

  filter: function filter(collection, fun) {
    return [].filter.call(collection.value(), fun);
  },

  map: function map(collection, fun) {
    return [].map.call(collection.value(), fun);
  },

  map_reduce: function map_reduce(collection, acc, fun) {
    var mapped = List();
    var the_acc = acc;

    for (var i = 0; i < collection.length(); i++) {
      var tuple = fun(collection.get(i), the_acc);

      the_acc = tuple.get(1);
      mapped = List.append(mapped, tuple.get(0));
    };

    return Tuple(mapped, the_acc);
  },

  member: function member(collection, value) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = collection.value()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var x = _step.value;

        if (x === value) {
          return true;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return false;
  },

  reduce: function reduce(collection, acc, fun) {
    var the_acc = acc;

    for (var i = 0; i < collection.length(); i++) {
      the_acc = fun(collection.get(i), the_acc);
    }

    return the_acc;
  }
};
'use strict';

var Integer = {
  __MODULE__: Atom('Integer'),

  is_even: function is_even(n) {
    return n % 2 === 0;
  },

  is_odd: function is_odd(n) {
    return n % 2 !== 0;
  },

  parse: function parse(bin) {
    var result = parseInt(bin);

    if (isNaN(result)) {
      return Atom('error');
    }

    var indexOfDot = bin.indexOf('.');

    if (indexOfDot >= 0) {
      return Tuple(result, bin.substring(indexOfDot));
    }

    return Tuple(result, '');
  },

  to_char_list: function to_char_list(number) {
    var base = arguments[1] === undefined ? 10 : arguments[1];

    return number.toString(base).split('');
  },

  to_string: function to_string(number) {
    var base = arguments[1] === undefined ? 10 : arguments[1];

    return number.toString(base);
  }
};
'use strict';

var Kernel = {
  __MODULE__: Atom('Kernel'),

  tl: function tl(list) {
    return List.delete_at(list, 0);
  },

  hd: function hd(list) {
    return List.first(list);
  },

  is_nil: function is_nil(x) {
    return x == null;
  },

  is_atom: function is_atom(x) {
    return typeof x === 'symbol';
  },

  is_binary: function is_binary(x) {
    return typeof x === 'string' || x instanceof String;
  },

  is_boolean: function is_boolean(x) {
    return typeof x === 'boolean' || x instanceof Boolean;
  },

  is_function: function is_function(x) {
    var arity = arguments[1] === undefined ? -1 : arguments[1];

    return typeof x === 'function' || x instanceof Function;
  },

  // from: http://stackoverflow.com/a/3885844
  is_float: function is_float(x) {
    return x === +x && x !== (x | 0);
  },

  is_integer: function is_integer(x) {
    return x === +x && x === (x | 0);
  },

  is_list: function is_list(x) {
    return x instanceof List;
  },

  is_map: function is_map(x) {
    return typeof x === 'object' || x instanceof Object;
  },

  is_number: function is_number(x) {
    return Kernel.is_integer(x) || Kernel.is_float(x);
  },

  is_tuple: function is_tuple(x) {
    return x instanceof Tuple;
  },

  length: function length(x) {
    if (Kernel.is_list(x) || Kernel.is_tuple(x)) {
      return x.length();
    }

    return x.length;
  },

  is_pid: function is_pid(x) {
    return false;
  },

  is_port: function is_port(x) {},

  is_reference: function is_reference(x) {},

  is_bitstring: function is_bitstring(x) {
    return Kernel.is_binary(x) || x instanceof BitString;
  },

  __in__: function __in__(left, right) {
    return Enum.member(right, left);
  },

  abs: function abs(number) {
    return Math.abs(number);
  },

  round: function round(number) {
    return Math.round(number);
  },

  elem: function elem(tuple, index) {
    return tuple.get(index);
  },

  rem: function rem(left, right) {
    return left % right;
  },

  div: function div(left, right) {
    return left / right;
  },

  and: function and(left, right) {
    return left && right;
  },

  or: function or(left, right) {
    return left || right;
  },

  not: function not(arg) {
    return !arg;
  },

  apply: function apply(module, fun, args) {
    if (arguments.length === 3) {
      return module[fun].apply(null, args);
    } else {
      return module.apply(null, fun);
    }
  },

  to_string: function to_string(arg) {
    return arg.toString();
  },

  match__qmark__: function match__qmark__(pattern, expr) {
    var guard = arguments[2] === undefined ? function () {
      return true;
    } : arguments[2];

    if (!guard()) {
      return false;
    }

    if (pattern === undefined) {
      return true;
    }

    if (Kernel.is_atom(expr)) {
      return Kernel.is_atom(pattern) && pattern === expr;
    } else if (Kernel.is_nil(expr) || Kernel.is_number(expr) || Kernel.is_binary(expr) || Kernel.is_boolean(expr)) {
      return pattern === expr;
    } else if (Kernel.is_tuple(expr)) {
      return Kernel.is_tuple(pattern) && Kernel.match__qmark__(pattern.value(), expr.value());
    } else if (Kernel.is_list(expr)) {
      if (Kernel.length(pattern) !== Kernel.length(expr)) {
        return false;
      }

      for (var i = 0; i <= pattern.length; i++) {
        if (Kernel.match__qmark__(pattern[i], expr[i]) === false) {
          return false;
        }
      }

      return true;
    } else if (Kernel.is_map(expr)) {
      if (!Kernel.is_map(pattern)) {
        return false;
      }

      for (var key in pattern) {
        if (!(key in expr)) {
          return false;
        }

        if (Kernel.match__qmark__(pattern[key], expr[key]) === false) {
          return false;
        }
      }

      return true;
    }
  }
};
'use strict';

var _bind = Function.prototype.bind;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var List = function List() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (!(this instanceof List)) {
    return new (_bind.apply(List, [null].concat(args)))();
  }

  var _value = Object.freeze(args);

  this.length = function () {
    return _value.length;
  };

  this.get = function (i) {
    return _value[i];
  };

  this.value = function () {
    return _value;
  };

  this.toString = function () {
    return _value.toString();
  };

  return this;
};

List.__MODULE__ = Atom('List');

List.prototype[Symbol.iterator] = function () {
  return this.value()[Symbol.iterator]();
};

List['delete'] = function (list, item) {
  var new_value = [];
  var value_found = false;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var x = _step.value;

      if (x === item && value_found !== false) {
        new_value.push(x);
        value_found = true;
      } else if (x !== item) {
        new_value.push(x);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return List.apply(undefined, new_value);
};

List.delete_at = function (list, index) {
  var new_value = [];

  for (var i = 0; i < list.length(); i++) {
    if (i !== index) {
      new_value.push(list.get(i));
    }
  }

  return List.apply(undefined, new_value);
};

List.duplicate = function (elem, n) {
  var new_value = [];

  for (var i = 0; i < n; i++) {
    new_value.push(elem);
  }

  return List.apply(undefined, new_value);
};

List.first = function (list) {
  if (list.length() === 0) {
    return null;
  }

  return list.get(0);
};

List.flatten = function (list) {
  var tail = arguments[1] === undefined ? List() : arguments[1];

  var new_value = [];

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var x = _step2.value;

      if (Kernel.is_list(x)) {
        new_value = new_value.concat(List.flatten(x).value());
      } else {
        new_value.push(x);
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  new_value = new_value.concat(tail.value());

  return List.apply(undefined, new_value);
};

List.foldl = function (list, acc, func) {
  var new_acc = acc;

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var x = _step3.value;

      new_acc = func(x, new_acc);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3['return']) {
        _iterator3['return']();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return new_acc;
};

List.foldr = function (list, acc, func) {
  var new_acc = acc;

  for (var i = list.length() - 1; i >= 0; i--) {
    new_acc = func(list.get(i), new_acc);
  }

  return new_acc;
};

List.insert_at = function (list, index, value) {
  var new_value = [];

  for (var i = 0; i < list.length(); i++) {
    if (i === index) {
      new_value.push(value);
      new_value.push(list.get(i));
    } else {
      new_value.push(list.get(i));
    }
  }

  return List.apply(undefined, new_value);
};

List.keydelete = function (list, key, position) {
  var new_list = [];

  for (var i = 0; i < list.length(); i++) {
    if (!Kernel.match__qmark__(list.get(i).get(position), key)) {
      new_list.push(list.get(i));
    }
  }

  return List.apply(undefined, new_list);
};

List.keyfind = function (list, key, position) {
  var _default = arguments[3] === undefined ? null : arguments[3];

  for (var i = 0; i < list.length(); i++) {
    if (Kernel.match__qmark__(list.get(i).get(position), key)) {
      return list.get(i);
    }
  }

  return _default;
};

List.keymember__qmark__ = function (list, key, position) {

  for (var i = 0; i < list.length(); i++) {
    if (Kernel.match__qmark__(list.get(i).get(position), key)) {
      return true;
    }
  }

  return false;
};

List.keyreplace = function (list, key, position, new_tuple) {
  var new_list = [];

  for (var i = 0; i < list.length(); i++) {
    if (!Kernel.match__qmark__(list.get(i).get(position), key)) {
      new_list.push(list.get(i));
    } else {
      new_list.push(new_tuple);
    }
  }

  return List.apply(undefined, new_list);
};

List.keysort = function (list, position) {
  var new_list = list;

  new_list.sort(function (a, b) {
    if (position === 0) {
      if (a.get(position).value < b.get(position).value) {
        return -1;
      }

      if (a.get(position).value > b.get(position).value) {
        return 1;
      }

      return 0;
    } else {
      if (a.get(position) < b.get(position)) {
        return -1;
      }

      if (a.get(position) > b.get(position)) {
        return 1;
      }

      return 0;
    }
  });

  return List.apply(undefined, _toConsumableArray(new_list));
};

List.keystore = function (list, key, position, new_tuple) {
  var new_list = [];
  var replaced = false;

  for (var i = 0; i < list.length(); i++) {
    if (!Kernel.match__qmark__(list.get(i).get(position), key)) {
      new_list.push(list.get(i));
    } else {
      new_list.push(new_tuple);
      replaced = true;
    }
  }

  if (!replaced) {
    new_list.push(new_tuple);
  }

  return List.apply(undefined, new_list);
};

List.last = function (list) {
  if (list.length() === 0) {
    return null;
  }

  return list.get(list.length() - 1);
};

List.replace_at = function (list, index, value) {
  var new_value = [];

  for (var i = 0; i < list.length(); i++) {
    if (i === index) {
      new_value.push(value);
    } else {
      new_value.push(list.get(i));
    }
  }

  return List.apply(undefined, new_value);
};

List.update_at = function (list, index, fun) {
  var new_value = [];

  for (var i = 0; i < list.length(); i++) {
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
    return List();
  } else {
    return List(list);
  }
};

List.zip = function (list_of_lists) {
  if (list_of_lists.length() === 0) {
    return List();
  }

  var new_value = [];
  var smallest_length = list_of_lists.get(0);

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = list_of_lists[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var x = _step4.value;

      if (x.length() < smallest_length) {
        smallest_length = x.length();
      }
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4['return']) {
        _iterator4['return']();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  for (var i = 0; i < smallest_length; i++) {
    var current_value = [];
    for (var j = 0; j < list_of_lists.length; j++) {
      current_value.push(list_of_lists.get(j).get(i));
    }

    new_value.push(Tuple.apply(undefined, current_value));
  }

  return List.apply(undefined, new_value);
};

List.to_tuple = function (list) {
  return Tuple.apply(null, list.value());
};

List.append = function (list, value) {
  return List.apply(undefined, _toConsumableArray(list.value().concat([value])));
};

List.concat = function (left, right) {
  return List.apply(undefined, _toConsumableArray(left.value().concat(right.value())));
};
'use strict';

var Logger = {
  __MODULE__: Atom('Logger'),

  debug: function debug(message) {
    console.debug(message);
  },

  warn: function warn(message) {
    console.warn(message);
  },

  info: function info(message) {
    console.info(message);
  },

  error: function error(message) {
    console.error(message);
  },

  log: function log(type, message) {
    if (type.value === 'warn') {
      console.warn(message);
    } else if (type.value === 'debug') {
      console.debug(message);
    } else if (type.value === 'info') {
      console.info(message);
    } else if (type.value === 'error') {
      console.error(message);
    } else {
      throw new Error('invalid type');
    }
  }
};
'use strict';

var Mutable = {
  __MODULE__: Atom('Mutable'),

  update: function update(obj, prop, value) {
    obj[prop] = value;
  }
};
'use strict';

var Range = function Range(_first, _last) {
  if (!(this instanceof Range)) {
    return new Range(_first, _last);
  }

  this.first = function () {
    return _first;
  };

  this.last = function () {
    return _last;
  };

  var _range = [];

  for (var i = _first; i <= _last; i++) {
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

Range.__MODULE__ = Atom('Range');

Range.prototype[Symbol.iterator] = function () {
  return this.value()[Symbol.iterator]();
};

Range['new'] = function (first, last) {
  return Range(first, last);
};

Range.range__qmark__ = function (range) {
  return range instanceof Range;
};
'use strict';

var _bind = Function.prototype.bind;

var Tuple = function Tuple() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (!(this instanceof Tuple)) {
    return new (_bind.apply(Tuple, [null].concat(args)))();
  }

  var _value = Object.freeze(args);

  this.value = function () {
    return _value;
  };

  this.length = function () {
    return _value.length;
  };

  this.get = function (i) {
    return _value[i];
  };

  return this;
};

Tuple.__MODULE__ = Atom('Tuple');

Tuple.prototype[Symbol.iterator] = function () {
  return this.value()[Symbol.iterator]();
};

Tuple.prototype.toString = function () {
  var i,
      s = '';
  for (i = 0; i < this.length(); i++) {
    if (s !== '') {
      s += ', ';
    }
    s += this.get(i).toString();
  }

  return '{' + s + '}';
};

Tuple.to_string = function (tuple) {
  return tuple.toString();
};

Tuple.delete_at = function (tuple, index) {
  var new_list = [];

  for (var i = 0; i < tuple.length(); i++) {
    if (i !== index) {
      new_list.push(tuple.get(i));
    }
  }

  return Tuple.apply(null, new_list);
};

Tuple.duplicate = function (data, size) {
  var array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return Tuple.apply(null, array);
};

Tuple.insert_at = function (tuple, index, term) {
  var new_tuple = [];

  for (var i = 0; i <= tuple.length(); i++) {
    if (i === index) {
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.get(i));
    } else {
      new_tuple.push(tuple.get(i));
    }
  }

  return Tuple.apply(null, new_tuple);
};

Tuple.from_list = function (list) {
  return Tuple.apply(null, list.value());
};

Tuple.to_list = function (tuple) {
  var new_list = [];

  for (var i = 0; i < tuple.length(); i++) {
    new_list.push(tuple.get(i));
  }

  return List.apply(undefined, new_list);
};