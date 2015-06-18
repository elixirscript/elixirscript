'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var _bind = Function.prototype.bind;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _tuple = require('./tuple');

var _tuple2 = _interopRequireDefault(_tuple);

var _atom = require('./atom');

var _atom2 = _interopRequireDefault(_atom);

var _kernel = require('./kernel');

var _kernel2 = _interopRequireDefault(_kernel);

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

List.__MODULE__ = _atom2['default']('List');

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

      if (_kernel2['default'].is_list(x)) {
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
    if (!_kernel2['default'].match__qmark__(list.get(i).get(position), key)) {
      new_list.push(list.get(i));
    }
  }

  return List.apply(undefined, new_list);
};

List.keyfind = function (list, key, position) {
  var _default = arguments[3] === undefined ? null : arguments[3];

  for (var i = 0; i < list.length(); i++) {
    if (_kernel2['default'].match__qmark__(list.get(i).get(position), key)) {
      return list.get(i);
    }
  }

  return _default;
};

List.keymember__qmark__ = function (list, key, position) {

  for (var i = 0; i < list.length(); i++) {
    if (_kernel2['default'].match__qmark__(list.get(i).get(position), key)) {
      return true;
    }
  }

  return false;
};

List.keyreplace = function (list, key, position, new_tuple) {
  var new_list = [];

  for (var i = 0; i < list.length(); i++) {
    if (!_kernel2['default'].match__qmark__(list.get(i).get(position), key)) {
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
    if (!_kernel2['default'].match__qmark__(list.get(i).get(position), key)) {
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
  if (_kernel2['default'].is_list(list)) {
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

    new_value.push(_tuple2['default'].apply(undefined, current_value));
  }

  return List.apply(undefined, new_value);
};

List.to_tuple = function (list) {
  return _tuple2['default'].apply(null, list.value());
};

List.append = function (list, value) {
  return List.apply(undefined, _toConsumableArray(list.value().slice().push(value)));
};

List.concat = function (left, right) {
  return List.apply(undefined, _toConsumableArray(left.value().concat(right.value())));
};

exports['default'] = List;
module.exports = exports['default'];