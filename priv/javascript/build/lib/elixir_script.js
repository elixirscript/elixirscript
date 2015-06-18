'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('./atom');

var _atom2 = _interopRequireDefault(_atom);

var ElixirScript = {
  __MODULE__: _atom2['default']('ElixirScript'),

  get_property_or_call_function: function get_property_or_call_function(item, property) {
    if (item[property] instanceof Function) {
      return item[property]();
    } else {
      return item[property];
    }
  }
};

exports['default'] = ElixirScript;
module.exports = exports['default'];