import Erlang from '../erlang';

let SpecialForms = {
  __MODULE__: Erlang.atom('SpecialForms'),

  import: function(module, opts, context = this){
    if(opts.length() === 0){
      for(let [key, value] of module){
        context[key] = value;
      }
    }else if(opts[Erlang.atom("only")]){
      for(let item of opts[Erlang.atom("only")]){
        let key = Symbol.keyFor(item.get(0));
        context[key] = module[key];
      }
    }else if(opts[Erlang.atom("except")]){
      let except_list = opts[Erlang.atom("except")];

      for(let [key, value] of module){
        for(let i = 0; i < except_list.length(); i++){
          if(except_list.get(i) === Erlang.atom(key)){
            context[key] = value;
          }
        }
      }
    }
  },

  alias: function(module, opts, context = this){
    let alias = Symbol.keyFor(module.__MODULE__);

    if(opts[Erlang.atom("as")]){
      alias = Symbol.keyFor(opts[Erlang.atom("as")]);
    }

    context[alias] = module;
  },

  require: function(module, opts, context = this){
    if(module === undefined){
      throw new Error("module is not loaded and could not be found");
    }

    SpecialForms.alias(module, opts, context);
  }
};

export default SpecialForms;
