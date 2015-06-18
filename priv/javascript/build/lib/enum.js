'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _tuple = require('./tuple');

var _tuple2 = _interopRequireDefault(_tuple);

var _list = require('./list');

var _list2 = _interopRequireDefault(_list);

var _atom = require('./atom');

var _atom2 = _interopRequireDefault(_atom);

var _kernel = require('./kernel');

var _kernel2 = _interopRequireDefault(_kernel);

var Enum = {
  __MODULE__: _atom2['default']('Enum'),

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
      return _kernel2['default'].length(collection);
    } else {
      return _kernel2['default'].length(collection.value().filter(fun));
    }
  },

  each: function each(collection, fun) {
    [].forEach.call(collection.value(), fun);
  },

  empty__qmark__: function empty__qmark__(collection) {
    return _kernel2['default'].length(collection) === 0;
  },

  fetch: function fetch(collection, n) {
    if (_kernel2['default'].is_list(collection)) {
      if (n < collection.length() && n >= 0) {
        return _tuple2['default'](_atom2['default']('ok'), collection.get(n));
      } else {
        return _atom2['default']('error');
      }
    }

    throw new Error('collection is not an Enumerable');
  },

  fetch__emark__: function fetch__emark__(collection, n) {
    if (_kernel2['default'].is_list(collection)) {
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
    var mapped = [];
    var the_acc = acc;

    for (var i = 0; i < collection.length(); i++) {
      var tuple = fun(collection.get(i), the_acc);
      the_acc = tuple[1];
      mapped.push(tuple[0]);
    }

    return _tuple2['default'](_list2['default'].apply(undefined, mapped), the_acc);
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

exports['default'] = Enum;
module.exports = exports['default'];