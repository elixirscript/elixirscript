import Erlang from './erlang';

let JS = {
  __MODULE__: Erlang.atom('JS'),

  get_property_or_call_function: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  }
};

export default JS;
