let Tuple = {
  __MODULE_: Symbol('Tuple'),

  delete_at: function(tuple, index){
    let new_tuple = {};

    for (var i = tuple.length - 1; i >= 0; i--) {
      if(i == index){
        continue;    
      }else{
        new_tuple['_' + i] = tuple['_' + i];         
      }
    };

    return new_tuple;
  },

  duplicate: function(data, size){
    let array = [];

    for (var i = size - 1; i >= 0; i--) {
      array.push(data)
    };

    List.to_tuple(array);
  },

  insert_at: function(tuple, index, term){
    let new_tuple = {};

    for (var i = 0; i <= tuple.length; i++) {
      if(i == index){
        new_tuple['_' + i] = term;
        i++;
        new_tuple['_' + i] = tuple['_' + i];        
      }else{
        new_tuple['_' + i] = tuple['_' + i];         
      }
    };

    return new_tuple;
  },

  to_list: function(tuple){
    let list = [];

    for(let x in tuple){
      list.push(x);
    }

    return list;
  }
}