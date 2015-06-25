import Atom from '../atom';
import Kernel from '../kernel';
import List from '../list';

let SpecialForms = {
  __MODULE__: Atom('SpecialForms'),

  import: function(module, opts, context = this){
    if(opts.length() === 0){
      for(let [key, value] of module){
        context[key] = value;
      }
    }else if(opts[Atom("only")]){
      for(let item of opts[Atom("only")]){
        let key = Atom.to_string(Kernel.elem(item, 0));
        context[key] = module[key];
      }
    }else if(opts[Atom("except")]){
      for(let [key, value] of module){
        if(!List.keymember__qmark__(opts[Atom("except")], Atom(key))){
          context[key] = value;
        }
      }
    }
  },

  alias: function(module, opts, context = this){
    let alias = Atom.to_string(module.__MODULE__);

    if(opts[Atom("as")]){
      alias = Atom.to_string(opts[Atom("as")]);
    }

    context[alias] = module;
  }
};

export default SpecialForms;
