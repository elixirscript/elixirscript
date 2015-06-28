import Erlang from '../erlang';

let JS = {
  __MODULE__: Erlang.atom('JS'),

  get_property_or_call_function: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  },

  create_namespace: function(module_name_list, root){
    let parent = root;

    let tail = Erlang.list(...module_name_list.slice(1));

    for(let atom of tail){
      let partname = Symbol.keyFor(atom);

      if (typeof parent[partname] === "undefined") {
        parent[partname] = {};
      }

      parent = parent[partname];
    }

    return parent;
  }
};

export default JS;
