import Atom from './atom';
import Tuple from './tuple';
import List from './list';
import Enum from './enum';
import BitString from './bit_string';
import SpecialForms from './kernel/special_forms';
import JS from './kernel/js';

let Kernel = {
  __MODULE__: Atom('Kernel'),

  SpecialForms: SpecialForms,
  JS: JS,

  defmodule: function(alias, list2){
    let parent = null;

    if(typeof window !== "undefined"){
      parent = window;
    }else{
      parent = global;
    }

    let moduleAtom = List.last(alias);

    for(let atom of alias){
      let partname = Atom.to_string(atom);

      if (typeof parent[partname] === "undefined") {
        parent[partname] = {};
      }

      parent = parent[partname];
    }

    return Object.assign(parent, list2(moduleAtom));
  },

  tl: function(list){
    return List.delete_at(list, 0);
  },

  hd: function(list){
    return List.first(list);
  },

  is_nil: function(x){
    return x == null;
  },

  is_atom: function(x){
    return typeof x === 'symbol';
  },

  is_binary: function (x){
    return typeof x === 'string' || x instanceof String;
  },

  is_boolean: function (x){
    return typeof x === 'boolean' || x instanceof Boolean;
  },

  is_function: function(x, arity = -1){
    return typeof x === 'function' || x instanceof Function;
  },

  // from: http://stackoverflow.com/a/3885844
  is_float: function(x){
    return x === +x && x !== (x|0);
  },

  is_integer: function(x){
    return x === +x && x === (x|0);
  },

  is_list: function(x){
    return x instanceof List;
  },

  is_map: function(x){
    return typeof x === 'object' || x instanceof Object;
  },

  is_number: function(x){
    return Kernel.is_integer(x) || Kernel.is_float(x);
  },

  is_tuple: function(x){
    return x instanceof Tuple;
  },

  length: function(x){
    if(Kernel.is_list(x) || Kernel.is_tuple(x)){
      return x.length();
    }

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

  __in__: function(left, right){
    return Enum.member(right, left);
  },

  abs: function(number){
    return Math.abs(number);
  },

  round: function(number){
    return Math.round(number);
  },

  elem: function(tuple, index){
    return tuple.get(index);
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

  match__qmark__: function(pattern, expr, guard = () => true){
    if(!guard()){
      return false;
    }

    if(pattern === undefined){
      return true;
    }

    if(Kernel.is_atom(expr)){
      return Kernel.is_atom(pattern) && pattern === expr;
    }else if(Kernel.is_nil(expr) || Kernel.is_number(expr) || Kernel.is_binary(expr) || Kernel.is_boolean(expr)){
      return pattern === expr;
    }else if(Kernel.is_tuple(expr)){
      return Kernel.is_tuple(pattern) && Kernel.match__qmark__(pattern.value(), expr.value());
    }else if(Kernel.is_list(expr)){
      if(Kernel.length(pattern) !== Kernel.length(expr)){
        return false;
      }

      for (let i = 0; i <= pattern.length; i++) {
        if(Kernel.match__qmark__(pattern[i], expr[i]) === false){
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

        if(Kernel.match__qmark__(pattern[key], expr[key]) === false){
          return false;
        }
      }

      return true;
    }
  }
};

export default Kernel;


