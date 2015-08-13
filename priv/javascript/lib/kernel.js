import Erlang from './erlang';
import SpecialForms from './kernel/special_forms';
import JS from './kernel/js';
import fun from './funcy/fun';
import Tuple from './tuple';

let Kernel = {
  __MODULE__: Erlang.atom('Kernel'),

  SpecialForms: SpecialForms,
  JS: JS,

  tl: function(list){
    return Erlang.list(...list.slice(1));
  },

  hd: function(list){
    return list[0];
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
    return x instanceof Array;
  },

  is_map: function(x){
    return typeof x === 'object' || x instanceof Object && x.__tuple__ === null;
  },

  is_number: function(x){
    return Kernel.is_integer(x) || Kernel.is_float(x);
  },

  is_tuple: function(x){
    return (typeof x === 'object' || x instanceof Object) && x.__tuple__ !== null;
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
    return Kernel.is_binary(x) || x instanceof Erlang.bitstring;
  },

  __in__: function(left, right){
    for(let x of right){
      if(Kernel.match__qmark__(left, x)){
        return true;
      }
    }

    return false;
  },

  abs: function(number){
    return Math.abs(number);
  },

  round: function(number){
    return Math.round(number);
  },

  elem: function(tuple, index){
    if(Kernel.is_list(tuple)){
      return tuple[index];
    }

    return tuple.__tuple__[index];
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

  apply: function(module, func, args){
    if(arguments.length === 3){
      return module[func].apply(null, args);
    }else{
      return module.apply(null, func);
    }
  },

  to_string: function(arg){
    if(Kernel.is_tuple(arg)){
      return Tuple.to_string(arg);
    }

    return arg.toString();
  },

  throw: function(e){
    throw e;
  },

  match__qmark__: function(pattern, expr, guard = () => true){
    try{
      let match = fun([
        [pattern],
        function(){
          return true;
        },
        guard
      ]);

      return match(expr);
    }catch(e){
      return false;
    }
  }
};

export default Kernel;


