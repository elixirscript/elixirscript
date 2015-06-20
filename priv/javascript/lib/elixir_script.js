import Atom from './atom';

let ElixirScript = {
  __MODULE__: Atom('ElixirScript'),

  get_property_or_call_function: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  }
};

export default ElixirScript;
