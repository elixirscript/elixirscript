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
    for (var i = 0; i < collection.length; i++) {
      if(i === n){
        return collection[i];
      }
    }

    return the_default;
  },

  count: function(collection, fun = null){
    if(fun == null){
      return Kernel.length(collection);
    }else{
      return Kernel.length(collection.filter(fun));
    }
  },

  each: function(collection, fun){
    [].forEach.call(collection, fun);
  },

  empty__qmark__: function(collection){
    return Kernel.length(collection) === 0;
  },

  fetch: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < collection.length && n >= 0){
        return Erlang.tuple(Erlang.atom("ok"), collection[n]);
      }else{
        return Erlang.atom("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < collection.length && n >= 0){
        return collection[n];
      }else{
        throw new Error("out of bounds error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  filter: function(collection, fun){
    return [].filter.call(collection, fun);
  },

  map: function(collection, fun){
    return [].map.call(collection, fun);
  },

  map_reduce: function(collection, acc, fun){
    let mapped = Erlang.list();
    let the_acc = acc;

    for (var i = 0; i < collection.length; i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = Kernel.elem(tuple, 1);
      mapped = Erlang.list(...mapped.concat([Kernel.elem(tuple, 0)]));
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

    for (var i = 0; i < collection.length; i++) {
      the_acc = fun(collection[i], the_acc);
    }

    return the_acc;
  }
};

export default Enum;
