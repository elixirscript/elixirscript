import Tuple from './tuple';
import Atom from './atom';

let Enum = {
  __MODULE__: [Atom('Enum')],

  all: function(collection, fun = (x) => {x}){
    for (var i = 0; i < collection.length; i++) {
      if(!fun(collection[i])){
        return false;
      }
    };

    return true;    
  },

  any: function(collection, fun = (x) => {x}){
    for (var i = 0; i < collection.length; i++) {
      if(fun(collection[i])){
        return true;
      }
    };

    return false;    
  },

  at: function(collection, n, the_default = null){
    for (var i = 0; i < collection.length; i++) {
      if(i == n){
        return collection[i];
      }
    };

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
    return collection.forEach(fun);
  },

  empty: function(collection){
    return Kernel.length(collection) == 0;
  },

  filter: function(collection, fun){
    return collection.filter(fun);
  },

  map: function(collection, fun){
    return collection.map(fun);
  },

  map_reduce: function(collection, acc, fun){
    let mapped = [];
    let the_acc = acc;

    for (var i = 0; i < collection.length; i++) {
      let tuple = fun(collection[i], the_acc);
      the_acc = tuple[1];
      mapped.push(tuple[0]);
    };

    return Tuple(mapped, the_acc);
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
    };

    return the_acc;
  }
}

export default Enum;