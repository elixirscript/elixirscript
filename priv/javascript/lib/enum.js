import Erlang from './erlang';
import Kernel from './kernel';

let Enum = {
  __MODULE__: Erlang.atom('Enum'),

  all__qmark__: function(collection, fun = (x) => x){
    let result = Enum.filter(collection, function(x){
      return !fun(x);
    });

    return result === [];
  },

  any__qmark__: function(collection, fun = (x) => x){
    let result = Enum.filter(collection, function(x){
      return fun(x);
    });

    return result !== [];
  },

  at: function(collection, n, the_default = null){
    for (var i = 0; i < collection.length(); i++) {
      if(i === n){
        return collection.get(i);
      }
    }

    return the_default;
  },

  count: function(collection, fun = null){
    if(fun == null){
      return Kernel.length(collection);
    }else{
      return Kernel.length(collection.value().filter(fun));
    }
  },

  each: function(collection, fun){
    [].forEach.call(collection.value(), fun);
  },

  empty__qmark__: function(collection){
    return Kernel.length(collection) === 0;
  },

  fetch: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < collection.length() && n >= 0){
        return Erlang.tuple(Erlang.atom("ok"), collection.get(n));
      }else{
        return Erlang.atom("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < collection.length() && n >= 0){
        return collection.get(n);
      }else{
        throw new Error("out of bounds error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  filter: function(collection, fun){
    return [].filter.call(collection.value(), fun);
  },

  map: function(collection, fun){
    return [].map.call(collection.value(), fun);
  },

  map_reduce: function(collection, acc, fun){
    let mapped = Erlang.list();
    let the_acc = acc;

    for (var i = 0; i < collection.length(); i++) {
      let tuple = fun(collection.get(i), the_acc);

      the_acc = tuple.get(1);
      mapped = Erlang.list(...mapped.value().concat([tuple.get(0)]))
    }

    return Erlang.tuple(mapped, the_acc);
  },

  member: function(collection, value){
    for(let x of collection){
      if(x === value){
        return true;
      }
    }

    return false;
  },

  reduce: function(collection, acc, fun){
    let the_acc = acc;

    for (var i = 0; i < collection.length(); i++) {
      the_acc = fun(collection.get(i), the_acc);
    }

    return the_acc;
  }
};

export default Enum;
