import Erlang from '../erlang';

let SpecialForms = {
  __MODULE__: Erlang.atom('SpecialForms'),

  import: function(module, opts, context = this){
    if(opts.length === 0){
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
        for(let i = 0; i < except_list.length; i++){
          if(except_list[i] === Erlang.atom(key)){
            context[key] = value;
          }
        }
      }
    }
  },

  alias: function(module, opts){
    return System.import(module.__MODULE__).resolve();
  },

  require: function(module, opts){
    if(module === undefined){
      throw new Error("module is not loaded and could not be found");
    }

    SpecialForms.alias(module, opts);
  },

  receive: function(receive_fun, timeout_in_ms = null, timeout_fn = (time) => true){
    if (timeout_in_ms == null || timeout_in_ms === System.for('infinity')) {
      while(true){
        if(self.mailbox.length !== 0){
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }
    }else if(timeout_in_ms === 0){
      if(self.mailbox.length !== 0){
        let message = self.mailbox[0];
        self.mailbox = self.mailbox.slice(1);
        return receive_fun(message);
      }else{
        return null;
      }
    }else{
      let now = Date.now();
      while(Date.now() < (now + timeout_in_ms)){
        if(self.mailbox.length !== 0){
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }

      return timeout_fn(timeout_in_ms);
    }
  }
};

export default SpecialForms;
