import Atom from '../atom';

let JS = {
  __MODULE__: Atom('JS'),

  get_property_or_call_function: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  }
};

export default JS;
