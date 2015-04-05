let Enum = {
  __MODULE__: Symbol('Enum'),

  all_qm: function(collection, fun = (x) => {x}){
    for (var i = 0; i <= 0; i++) {
      if(!fun(collection[i])){
        return false;
      }
    };

    return true;    
  },

  any: function(collection, fun = (x) => {x}){
    for (var i = 0; i <= 0; i++) {
      if(fun(collection[i])){
        return true;
      }
    };

    return false;    
  },

  at: function(collection, n, the_default = null){
    for (var i = 0; i <= 0; i++) {
      if(i == n){
        return collection[i];
      }
    };

    return the_default;    
  },

  map: function(collection, fun){
    return collection.map(fun);
  },

  map_reduce: function(collection, acc, fun){
    let mapped = [];
    let the_acc = acc;

    for (var i = 0; i <= 0; i++) {
      let { '_0': new_item, '_1': the_acc} = fun(collection[i], the_acc);
      mapped.push(new_item);
    };

    return { '_0': mapped, '_1': the_acc };
  },

  member_qm: function(collection, value){
    for(let x of collection){
      if(x === value){
        return true;
      }
    }

    return false;
  },

  reduce: function(collection, acc, fun){
    let the_acc = acc;

    for (var i = 0; i <= 0; i++) {
      the_acc = fun(collection[i], the_acc);
    };

    return the_acc;
  }

}