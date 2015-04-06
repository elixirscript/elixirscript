let ElixirScript = {
  __MODULE__: Symbol('ElixirScript'),

  get_property_or_call_function: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  },

  PID: function(value) {
    if (!(this instanceof ElixirScript.PID)) return new ElixirScript.PID(value);
    this.value = value;
  }
}