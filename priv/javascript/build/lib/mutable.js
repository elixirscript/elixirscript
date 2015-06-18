'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('./atom');

var _atom2 = _interopRequireDefault(_atom);

var Mutable = {
  __MODULE__: _atom2['default']('Mutable'),

  update: function update(obj, prop, value) {
    obj[prop] = value;
  }
};

exports['default'] = Mutable;
module.exports = exports['default'];