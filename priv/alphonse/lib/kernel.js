import Atom from './atom';
import Tuple from './tuple';

let Kernel = {
  __MODULE_: [Atom('Kernel')],

  tl: function(list){
    return list.slice(1);
  },

  hd: function(list){
    return list.slice(0,1)[0];
  },

  is_nil: function(x){
    return x == null;
  },

  is_atom: function(x){
    return x instanceof Atom;
  },

  is_binary: function (x){
    return typeof(x) === 'string' || x instanceof String;
  },

  is_boolean: function (x){
    return typeof(x) === 'boolean' || x instanceof Boolean; 
  },

  is_function: function(x, arity = -1){
    return x instanceof Function;
  },

  // from: http://stackoverflow.com/a/3885844
  is_float: function(x){
    return x === +x && x !== (x|0);
  },

  is_integer: function(x){
    return x === +x && x === (x|0);
  },

  is_list: function(x){
    return x instanceof Array;
  },

  is_map: function(x){
    return x instanceof Object;
  },

  is_number: function(x){
    return Kernel.is_integer(x) || Kernel.is_float(x);
  },

  is_tuple: function(x){
    return x instanceof Tuple;
  },

  length: function(x){
    return x.length;
  },

  is_pid: function(x){
    return false;
  },

  is_port: function(x){
    
  },

  is_reference: function(x){

  },

  is_bitstring: function(x){
    return Kernel.is_binary(x) || x instanceof BitString;
  },

  _in: function(left, right){
    return Enum.member(right, left);
  },

  abs: function(number){
    return Math.abs(number);
  },

  round: function(number){
    return Math.round(number);
  },

  elem: function(tuple, index){
    return tuple['_' + index];
  },

  rem: function(left, right){
    return left % right;
  },

  div: function(left, right){
    return left / right;
  },

  and: function(left, right){
    return left && right;
  },

  or: function(left, right){
    return left || right;
  },

  not: function(arg){
    return !arg;
  },

  apply: function(module, fun, args){
    if(arguments.length === 3){
      return module[fun].apply(null, args);
    }else{
      return module.apply(null, fun);  
    }
  },

  to_string: function(arg){
    return arg.toString();
  },

  match: function(pattern, expr){
    if(pattern === undefined){
      return true;
    }

    if(Kernel.is_nil(expr) || Kernel.is_number(expr) || Kernel.is_binary(expr) || Kernel.is_boolean(expr)){
      return pattern === expr;
    }else if(Kernel.is_atom(expr)){
      return Kernel.is_atom(pattern) && pattern.value === expr.value;
    }else if(Kernel.is_tuple(expr)){
      return Kernel.is_tuple(pattern) && Kernel.match(pattern.value, expr.value);
    }else if(Kernel.is_list(expr)){     
      if(Kernel.length(pattern) != Kernel.length(expr)){
        return false;
      }

      for (let i=0; i <= pattern.length; i++) {
        if(Kernel.match(pattern[i], expr[i]) === false){
          return false;
        }
      }

      return true;
    }else if(Kernel.is_map(expr)){
      if(!Kernel.is_map(pattern)){
        return false;
      }

      for(let key in pattern){
        if(!(key in expr)){
          return false;
        }

        if(Kernel.match(pattern[key], expr[key]) == false){
          return false;
        }
      }

      return true;
    }
  }
}

export default Kernel;


