import Kernel from './kernel';

let Enum = {

  all__qmark__: function(collection, fun = (x) => x){
    return collection.every(fun);
  },

  any__qmark__: function(collection, fun = (x) => x){
    return collection.some(fun);
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
    collection.forEach(fun);
  },

  empty__qmark__: function(collection){
    return collection.length === 0;
  },

  fetch: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < this.count(collection) && n >= 0){
        return Erlang.tuple(Erlang.atom("ok"), collection[n]);
      }else{
        return Erlang.atom("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < this.count(collection) && n >= 0){
        return collection[n];
      }else{
        throw new Error("out of bounds error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  filter: function(collection, fun){
    return collection.filter(fun);
  },

  filter_map: function(collection, filter, mapper){
    return collection.filter(filter).map(mapper);
  },

  find: function(collection, if_none = null, fun){
    return collection.find(fun, null, if_none);
  },

  into: function(collection, list){
    return list.concat(collection);
  },

  map: function(collection, fun){
    return collection.map(fun);
  },

  map_reduce: function(collection, acc, fun){
    let mapped = Erlang.list();
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = Kernel.elem(tuple, 1);
      mapped = Erlang.list(...mapped.concat([Kernel.elem(tuple, 0)]));
    }

    return Erlang.tuple(mapped, the_acc);
  },

  member: function(collection, value){
    return collection.includes(value);
  },

  reduce: function(collection, acc, fun){
    return collection.reduce(fun, acc);
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

    return Erlang.list(...result);
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
