let List = {
  __MODULE_: Symbol('List'),

  to_tuple: function(list){
    let tuple = {};

    for(let i = 0, i < list.length, i++){
      tuple['_'+i] = list[i];
    }

    return tuple;
  }
}