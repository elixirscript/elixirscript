'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('./atom');

var _atom2 = _interopRequireDefault(_atom);

var _tuple = require('./tuple');

var _tuple2 = _interopRequireDefault(_tuple);

var _list = require('./list');

var _list2 = _interopRequireDefault(_list);

var _enum = require('./enum');

var _enum2 = _interopRequireDefault(_enum);

var _bit_string = require('./bit_string');

var _bit_string2 = _interopRequireDefault(_bit_string);

var Kernel = {
  __MODULE__: _atom2['default']('Kernel'),

  tl: function tl(list) {
    return _list2['default'].delete_at(list, 0);
  },

  hd: function hd(list) {
    return _list2['default'].first(list);
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
    return x instanceof _list2['default'];
  },

  is_map: function is_map(x) {
    return typeof x === 'object' || x instanceof Object;
  },

  is_number: function is_number(x) {
    return Kernel.is_integer(x) || Kernel.is_float(x);
  },

  is_tuple: function is_tuple(x) {
    return x instanceof _tuple2['default'];
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
    return Kernel.is_binary(x) || x instanceof _bit_string2['default'];
  },

  __in__: function __in__(left, right) {
    return _enum2['default'].member(right, left);
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

exports['default'] = Kernel;
module.exports = exports['default'];