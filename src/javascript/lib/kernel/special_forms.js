import * as Core from '../core';
import Enum from '../enum';

let SpecialForms = {

  __DIR__: function(){
    if(__dirname){
      return __dirname;
    }

    if(document.currentScript){
      return document.currentScript.src;
    }

    return null;
  },

  atom: function(_value) {
    return Symbol.for(_value);
  },

  list: function(...args){
    return Object.freeze(args);
  },

  bitstring: function(...args){
    return new Core.BitString(...args);
  },

  bound: function(_var){
    return Core.Patterns.bound(_var);
  },

  _case: function(condition, clauses){
    return Core.Patterns.defmatch(...clauses)(condition);
  },

  cond: function(clauses){
    for(let clause of clauses){
      if(clause[0]){
        return clause[1]();
      }
    }

    throw new Error();
  },

  fn: function(clauses){
    return Core.Patterns.defmatch(clauses);
  },

  map: function(obj){
    return Object.freeze(obj);
  },

  map_update: function(map, values){
    return Object.freeze(
      Object.assign(
        Object.create(map.constructor.prototype), map, values
      )
    );
  },

  _for: function(collections, fun, filter = () => true, into = [], previousValues = []){
    let pattern = collections[0][0];
    let collection = collections[0][1];

    if(collections.length === 1){

      for(let elem of collection){
        let r = Core.Patterns.match_no_throw(pattern, elem);
        let args = previousValues.concat(r);

        if(r && filter.apply(this, args)){
          into = Enum.into([fun.apply(this, args)], into);
        }
      }

      return into;
    }else{
      let _into = []

      for(let elem of collection){
        let r = Core.Patterns.match_no_throw(pattern, elem);
        if(r){
          _into = Enum.into(this._for(collections.slice(1), fun, filter, _into, previousValues.concat(r)), into);
        }
      }

      return _into;
    }
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
  },

  tuple: function(...args){
    return new Core.Tuple(...args);
  },


  _try: function(do_fun, rescue_function, catch_fun, else_function, after_function){
    let result = null;

    try{
      result = do_fun();
    }catch(e){
      let ex_result = null;

      if(rescue_function){
        try{
          ex_result = rescue_function(e);
          return ex_result;
        }catch(ex){
          if(ex instanceof Core.Patterns.MatchError){
            throw ex;
          }
        }
      }

      if(catch_fun){
        try{
          ex_result = catch_fun(e);
          return ex_result;
        }catch(ex){
          if(ex instanceof Core.Patterns.MatchError){
            throw ex;
          }
        }
      }

      throw e;

    }finally{
      if(after_function){
        after_function();
      }
    }

    if(else_function){
      try{
        return else_function(result);
      }catch(ex){
          if(ex instanceof Core.Patterns.MatchError){
            throw new Error("No Match Found in Else");
          }

        throw ex;
      }
    }else{
      return result;
    }
  }

};

export default SpecialForms;
