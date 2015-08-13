let object = {
  extend: function(obj) {
    let i = 1, key,
      len = arguments.length;
    for (; i < len; i += 1) {
      for (key in arguments[i]) {
        // make sure we do not override built-in methods but toString and valueOf
        if (arguments[i].hasOwnProperty(key) &&
          (!obj[key] || obj.propertyIsEnumerable(key) || key === 'toString' || key === 'valueOf')) {
          obj[key] = arguments[i][key];
        }
      }
    }
    return obj;
  },

  filter: function(obj, fun, thisObj) {
    let key,
      r = {}, val;
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        val = obj[key];
        if (fun.call(thisObj, val, key, obj)) {
          r[key] = val;
        }
      }
    }
    return r;
  },

  map: function(obj, fun, thisObj) {
    let key,
      r = {};
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        r[key] = fun.call(thisObj, obj[key], key, obj);
      }
    }
    return r;
  },

  forEach: function(obj, fun, thisObj) {
    let key;
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        fun.call(thisObj, obj[key], key, obj);
      }
    }
  },

  every: function(obj, fun, thisObj) {
    let key;
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key) && !fun.call(thisObj, obj[key], key, obj)) {
        return false;
      }
    }
    return true;
  },

  some: function(obj, fun, thisObj) {
    let key;
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key) && fun.call(thisObj, obj[key], key, obj)) {
        return true;
      }
    }
    return false;
  },

  isEmpty: function(obj) {
    return object.every(obj, function(value, key) {
      return !obj.hasOwnProperty(key);
    });
  },

  values: function(obj) {
    let r = [];
    object.forEach(obj, function(value) {
      r.push(value);
    });
    return r;
  },

  keys: function(obj) {
    let r = [];
    object.forEach(obj, function(value, key) {
      r.push(key);
    });
    return r;
  },

  reduce: function(obj, fun, initial) {
    let key, initialKey;

    if (object.isEmpty(obj) && initial === undefined) {
      throw new TypeError();
    }
    if (initial === undefined) {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          initial = obj[key];
          initialKey = key;
          break;
        }
      }
    }
    for (key in obj) {
      if (obj.hasOwnProperty(key) && key !== initialKey) {
        initial = fun.call(null, initial, obj[key], key, obj);
      }
    }
    return initial;
  }
};

export default object;
