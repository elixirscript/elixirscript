if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
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
  (function() {
    var codePointAt = function(position) {
      if (this == null) {
        throw TypeError();
      }
      var string = String(this);
      var size = string.length;
      // `ToInteger`
      var index = position ? Number(position) : 0;
      if (index !== index) { // better `isNaN`
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
        first >= 0xD800 && first <= 0xDBFF && // high surrogate
        size > index + 1 // there is a next code unit
      ) {
        second = string.charCodeAt(index + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
          // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
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
  }());
}

let BitString = {};

BitString.__MODULE__ = Symbol.for("BitString");

BitString.integer = function(value){
  return BitString.wrap(value, { 'type': 'integer', 'unit': 1, 'size': 8 });
};

BitString.float = function(value){
  return BitString.wrap(value, { 'type': 'float', 'unit': 1, 'size': 64 });
};

BitString.bitstring = function(value){
  return BitString.wrap(value, { 'type': 'bitstring', 'unit': 1, 'size': value.length });
};

BitString.bits = function(value){
  return BitString.bitstring(value);
};

BitString.binary = function(value){
  return BitString.wrap(value, { 'type': 'binary', 'unit': 8, 'size': value.length});
};

BitString.bytes = function(value){
  return BitString.binary(value);
};

BitString.utf8 = function(value){
  return BitString.wrap(value, { 'type': 'utf8' });
};

BitString.utf16 = function(value){
  return BitString.wrap(value, { 'type': 'utf16' });
};

BitString.utf32 = function(value){
  return BitString.wrap(value, { 'type': 'utf32' });
};

BitString.signed = function(value){
  return BitString.wrap(value, {}, 'signed');
};

BitString.unsigned = function(value){
  return BitString.wrap(value, {}, 'unsigned');
};

BitString.native = function(value){
  return BitString.wrap(value, {}, 'native');
};

BitString.big = function(value){
  return BitString.wrap(value, {}, 'big');
};

BitString.little = function(value){
  return BitString.wrap(value, {}, 'little');
};

BitString.size = function(value, count){
  return BitString.wrap(value, {'size': count});
};

BitString.unit = function(value, count){
  return BitString.wrap(value, {'unit': count});
};

BitString.wrap = function(value, opt, new_attribute = null){
  let the_value = value;

  if(!(value instanceof Object)){
    the_value = {'value': value, 'attributes': []};
  }

  the_value = Object.assign(the_value, opt);

  if(new_attribute){
    the_value.attributes.push(new_attribute);
  }


  return the_value;
};

BitString.toUTF8Array = function(str) {
  var utf8 = [];
  for (var i = 0; i < str.length; i++) {
    var charcode = str.charCodeAt(i);
    if (charcode < 0x80){
      utf8.push(charcode);
    }
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
    }
    else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                | (str.charCodeAt(i) & 0x3ff));
      utf8.push(0xf0 | (charcode >> 18),
                0x80 | ((charcode >> 12) & 0x3f),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
    }
  }
  return utf8;
};

BitString.toUTF16Array = function(str) {
  var utf16 = [];
  for (var i = 0; i < str.length; i++) {
    var codePoint = str.codePointAt(i);

    if(codePoint <= 255){
      utf16.push(0);
      utf16.push(codePoint);
    }else{
      utf16.push(((codePoint >> 8) & 0xFF));
      utf16.push((codePoint & 0xFF));
    }
  }
  return utf16;
};


BitString.toUTF32Array = function(str) {
  var utf32 = [];
  for (var i = 0; i < str.length; i++) {
    var codePoint = str.codePointAt(i);

    if(codePoint <= 255){
      utf32.push(0);
      utf32.push(0);
      utf32.push(0);
      utf32.push(codePoint);
    }else{
      utf32.push(0);
      utf32.push(0);
      utf32.push(((codePoint >> 8) & 0xFF));
      utf32.push((codePoint & 0xFF));
    }
  }
  return utf32;
};

//http://stackoverflow.com/questions/2003493/javascript-float-from-to-bits
BitString.float32ToBytes = function(f) {
  var bytes = [];

  var buf = new ArrayBuffer(4);
  (new Float32Array(buf))[0] = f;

  let intVersion = (new Uint32Array(buf))[0];

  bytes.push(((intVersion >> 24) & 0xFF));
  bytes.push(((intVersion >> 16) & 0xFF));
  bytes.push(((intVersion >> 8) & 0xFF));
  bytes.push((intVersion & 0xFF));

  return bytes;
};

BitString.float64ToBytes = function(f) {
  var bytes = [];

  var buf = new ArrayBuffer(8);
  (new Float64Array(buf))[0] = f;

  var intVersion1 = (new Uint32Array(buf))[0];
  var intVersion2 = (new Uint32Array(buf))[1];

  bytes.push(((intVersion2 >> 24) & 0xFF));
  bytes.push(((intVersion2 >> 16) & 0xFF));
  bytes.push(((intVersion2 >> 8) & 0xFF));
  bytes.push((intVersion2 & 0xFF));

  bytes.push(((intVersion1 >> 24) & 0xFF));
  bytes.push(((intVersion1 >> 16) & 0xFF));
  bytes.push(((intVersion1 >> 8) & 0xFF));
  bytes.push((intVersion1 & 0xFF));

  return bytes;
};

export default BitString;
