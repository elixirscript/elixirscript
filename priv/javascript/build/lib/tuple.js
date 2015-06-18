'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var _bind = Function.prototype.bind;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('./atom');

var _atom2 = _interopRequireDefault(_atom);

var _list = require('./list');

var _list2 = _interopRequireDefault(_list);

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

Tuple.__MODULE__ = _atom2['default']('Tuple');

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

  return _list2['default'].apply(undefined, new_list);
};

exports['default'] = Tuple;
module.exports = exports['default'];