let ElixirScript = {
  __MODULE__: Symbol('ElixirScript'),

  __prop_or_function_call: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  }
}