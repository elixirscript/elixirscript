'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('./atom');

var _atom2 = _interopRequireDefault(_atom);

var Logger = {
  __MODULE__: _atom2['default']('Logger'),

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

exports['default'] = Logger;
module.exports = exports['default'];