import Erlang from './erlang';
import Kernel from './kernel';

let Enum = {
  __MODULE__: Erlang.atom('Enum'),

  all__qmark__: function(collection, fun = (x) => x){
    return collection.every(fun);
  },

  any__qmark__: function(collection, fun = (x) => x){
    return collection.some(fun);
  },

  at: function(collection, n, the_default = null){
    return collection.get(n, the_default);
  },

  concat: function(...enumables){
    return enumables.first().concat(enumables.last());
  },

  count: function(collection, fun = null){
    if(fun == null){
      return collection.count();
    }else{
      return collection.count(fun);
    }
  },

  drop: function(collection, count){
    return collection.skip(count);
  },

  drop_while: function(collection, fun){
    return collection.skipWhile(fun);
  },

  each: function(collection, fun){
    collection.forEach(fun);
  },

  empty__qmark__: function(collection){
    return collection.count() === 0;
  },

  fetch: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < collection.count() && n >= 0){
        return Erlang.tuple(Erlang.atom("ok"), collection.get(n));
      }else{
        return Erlang.atom("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < collection.count() && n >= 0){
        return collection.get(n);
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

  flat_map: function(collection, fun){
    return collection.flatMap(fun);
  },

  map: function(collection, fun){
    return collection.map(fun);
  },

  map_reduce: function(collection, acc, fun){
    let mapped = Erlang.list();
    let the_acc = acc;

    for (var i = 0; i < collection.count(); i++) {
      let tuple = fun(collection.get(i), the_acc);

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
    return collection.take(count);
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
    return collection.takeWhile(fun);
  },

  to_list: function(collection){
    return collection.toList();
  }
};

export default Enum;
