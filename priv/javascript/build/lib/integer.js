'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _tuple = require('./tuple');

var _tuple2 = _interopRequireDefault(_tuple);

var _atom = require('./atom');

var _atom2 = _interopRequireDefault(_atom);

var Integer = {
  __MODULE__: _atom2['default']('Integer'),

  is_even: function is_even(n) {
    return n % 2 === 0;
  },

  is_odd: function is_odd(n) {
    return n % 2 !== 0;
  },

  parse: function parse(bin) {
    var result = parseInt(bin);

    if (isNaN(result)) {
      return _atom2['default']('error');
    }

    var indexOfDot = bin.indexOf('.');

    if (indexOfDot >= 0) {
      return _tuple2['default'](result, bin.substring(indexOfDot));
    }

    return _tuple2['default'](result, '');
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

exports['default'] = Integer;
module.exports = exports['default'];