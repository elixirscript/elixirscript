import fun from './fun';

const Type = {
  isSymbol: function(value) {
    return typeof x === 'symbol';
  },

  isAtom: function(value) {
    return !Type.isSymbol(value) && ((typeof value !== 'object' || value === null) &&
      typeof value !== 'function') ||
      Type.isBoolean(value) || Type.isNumber(value) || Type.isString(value);
  },

  isRegExp: function(value) {
    return (value.constructor.name === "RegExp" || value instanceof RegExp);
  },

  isNumber: function(value) {
    return (typeof value === 'number' || value instanceof Number) && !isNaN(value);
  },

  isString: function(value) {
    return typeof value === 'string' || value instanceof String;
  },

  isBoolean: function(value) {
    return value !== null &&
      (typeof value === 'boolean' || value instanceof Boolean);
  },

  isArray: function(value) {
    return Array.isArray(value);
  },

  isObject: function(value) {
    return Object.prototype.toString.apply(value) === '[object Object]';
  },

  isFunction: function(value) {
    return typeof value === 'function';
  },

  isDefined: function(value) {
    return typeof value !== 'undefined';
  },

  isUndefined: function(value) {
    return typeof value === 'undefined';
  },

  isWildcard: function(value) {
    return value &&
    value.constructor === fun.wildcard.constructor;
  },

  isVariable: function(value) {
    return value &&
        typeof value === 'object' &&
        typeof value.is_variable === 'function' &&
        typeof value.get_name === 'function' &&
        value.is_variable();
  },

  isParameter: function(value){
    return value &&
    (value === fun.parameter || value.constructor.name === fun.parameter().constructor.name);
  },

  isStartsWith: function(value){
    return value &&
    value.constructor.name === fun.startsWith().constructor.name;
  },

  isCapture: function(value) {
    return value &&
    value.constructor.name === fun.capture().constructor.name;
  },

  isHeadTail: function(value) {
    return value.constructor === fun.headTail.constructor;
  },

  isBound: function(value) {
    return value &&
    value.constructor.name === fun.bound().constructor.name;
  }
};

export default Type;
