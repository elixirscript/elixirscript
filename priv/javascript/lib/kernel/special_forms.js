import BitString from '../bit_string';
import Enum from '../enum';
import * as Patterns from '../patterns/patterns';
import Immutable from '../immutable/immutable';

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
    return Immutable.fromJS(args);
  },

  bitstring: function(...args){
    return new BitString(...args);
  },

  bound: function(_var){
    return Patterns.bound(_var);
  },

  case: function(condition, clauses){
    return Patterns.defmatch(clauses).apply(this, [condition]);
  },

  cond: function(clauses){
    for(let clause of clauses){
      if(clause.first()){
        return clause.last();
      }
    }

    throw new Error();
  },

  fn: function(clauses){
    return Patterns.defmatch(clauses);
  },

  map: function(obj){
    return Immutable.fromJS(obj);
  },

  map_update: function(map, values){
    return map.merge(this.map(values));
  },

  _for: function(collections, fun, filter = () => true, into = Immutable.List.of(), previousValues = []){
    let pattern = collections.first().get(0);
    let collection = collections.first().get(1);

    if(collections.size === 1){

      for(let elem of collection){
        let r = Patterns.match_no_throw(pattern, elem);
        let args = previousValues.concat(r);

        if(r && filter.apply(this, args)){
          into = Enum.into([fun.apply(this, args)], into);
        }
      }

      return into;
    }else{
      for(let elem of collection){
        let r = Patterns.match_no_throw(pattern, elem);
        if(r){
          into = Enum.into(this._for(collections.rest(), fun, filter, into, previousValues.concat(r)), into);
        }
      }

      return into;
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
    return Immutable.fromJS({__tuple__: args });
  },


};

export default SpecialForms;
