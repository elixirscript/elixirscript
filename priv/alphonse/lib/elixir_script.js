import Atom from './atom';

let ElixirScript = {
  __MODULE__: Atom('ElixirScript'),

  get_property_or_call_function: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  },

  //http://stackoverflow.com/questions/28876300/deep-copying-array-of-nested-objects-in-javascript
  clone: function(obj){
    let toString = Object.prototype.toString;
    let rv;

    switch (typeof obj) {
      case "object":
        if (obj === null) {
          // null => null
          rv = null;
        } else {
          switch (toString.call(obj)) {
            case "[object Array]":
              // It's an array, create a new array with
              // deep copies of the entries
              rv = obj.map(ElixirScript.clone);
              break;
            case "[object Date]":
              // Clone the date
              rv = new Date(obj);
              break;
            case "[object RegExp]":
              // Clone the RegExp
              rv = new RegExp(obj);
              break;
            default:
              // Some other kind of object, deep-copy its
              // properties into a new object
              rv = Object.keys(obj).reduce(function(prev, key) {
                prev[key] = ElixirScript.clone(obj[key]);
                return prev;
              }, {});
              break;
          }
        }
        break;
      default:
        // It's a primitive, copy via assignment
        rv = obj;
        break;
    }
    return rv;
  }
};

export default ElixirScript;
