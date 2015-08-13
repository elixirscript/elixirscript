import Erlang from '../erlang';
import fun from '../funcy/fun';

let SpecialForms = {
  __MODULE__: Erlang.atom('SpecialForms'),

  case: function(condition, clauses){
    return fun(clauses).call(condition);
  },

  fn: function(clauses){
    return fun(clauses);
  },

  cond: function(clauses){
    for(let clause in clauses){
      if(clause[0]){
        return clause[1]();
      }
    }
  },

  import: function(module, opts){
    let imported_module = SpecialForms.alias(module);

    if(opts.length === 0){
      return imported_module;
    }else if(opts[Erlang.atom("only")]){
      let exported = {};
      for(let item of opts[Erlang.atom("only")]){
        let key = Symbol.keyFor(item.get(0));
        exported[key] = imported_module[key];
      }

      return exported;
    }else if(opts[Erlang.atom("except")]){
      let exported = {};
      let except_list = opts[Erlang.atom("except")];

      for(let [key, value] of imported_module){
        for(let i = 0; i < except_list.length; i++){
          if(except_list[i] === Erlang.atom(key)){
            exported[key] = imported_module[key];
          }
        }
      }

      return exported;
    }
  },

  alias: function(module, opts){
    return System.import(module).resolve();
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
