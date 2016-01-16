import Core from './core';

let Enum = {

  all__qmark__: function(collection, fun = (x) => x){
    for(let elem of collection){
      if(!fun(elem)){
        return false;
      }
    }

    return true;
  },

  any__qmark__: function(collection, fun = (x) => x){
    for(let elem of collection){
      if(fun(elem)){
        return true;
      }
    }

    return false;
  },

  at: function(collection, n, the_default = null){
    if(n > this.count(collection) || n < 0){
      return the_default;
    }

    return collection[n];
  },

  concat: function(...enumables){
    return enumables[0].concat(enumables[1]);
  },

  count: function(collection, fun = null){
    if(fun == null){
      return collection.length;
    } else {
      return collection.filter(fun).length;
    }
  },

  drop: function(collection, count){
    return collection.slice(count);
  },

  drop_while: function(collection, fun){
    let count = 0;

    for(let elem of collection){
      if(fun(elem)){
        count = count + 1;
      }else{
        break;
      }
    }

    return collection.slice(count);
  },

  each: function(collection, fun){
    for(let elem of collection){
      fun(elem);
    }
  },

  empty__qmark__: function(collection){
    return collection.length === 0;
  },

  fetch: function(collection, n){
    if(Array.isArray(collection)){
      if(n < this.count(collection) && n >= 0){
        return new Core.Tuple(Symbol.for("ok"), collection[n]);
      }else{
        return Symbol.for("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function(collection, n){
    if(Array.isArray(collection)){
      if(n < this.count(collection) && n >= 0){
        return collection[n];
      }else{
        throw new Error("out of bounds error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  filter: function(collection, fun){
    let result = [];

    for(let elem of collection){
      if(fun(elem)){
        result.push(elem);
      }
    }

    return result;
  },

  filter_map: function(collection, filter, mapper){
    return Enum.map(Enum.filter(collection, filter), mapper);
  },

  find: function(collection, if_none = null, fun){
    for(let elem of collection){
      if(fun(elem)){
        return elem;
      }
    }

    return if_none;
  },

  into: function(collection, list){
    return list.concat(collection);
  },

  map: function(collection, fun){
    let result = [];

    for(let elem of collection){
      result.push(fun(elem));
    }

    return result;
  },

  map_reduce: function(collection, acc, fun){
    let mapped = Object.freeze([]);
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = tuple.get(1);
      mapped = Object.freeze(mapped.concat([tuple.get(0)]));
    }

    return new Core.Tuple(mapped, the_acc);
  },

  member__qmark__: function(collection, value){
    return collection.includes(value);
  },

  reduce: function(collection, acc, fun){
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = tuple.get(1);
    }

    return the_acc;
  },

  take: function(collection, count){
    return collection.slice(0, count);
  },

  take_every: function(collection, nth){
    let result = [];
    let index = 0;

    for(let elem of collection){
      if(index % nth === 0){
        result.push(elem);
      }
    }

    return Object.freeze(result);
  },

  take_while: function(collection, fun){
    let count = 0;

    for(let elem of collection){
      if(fun(elem)){
        count = count + 1;
      }else{
        break;
      }
    }

    return collection.slice(0, count);
  },

  to_list: function(collection){
    return collection;
  }
};

export default Enum;
