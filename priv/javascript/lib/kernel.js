import SpecialForms from './kernel/special_forms';
import Patterns from './patterns/patterns';
import Tuple from './tuple';
import BitString from './bit_string';
import Protocol from './protocol';
import { PID } from './processes/processes';

let Kernel = {

  SpecialForms: SpecialForms,

  tl: function(list){
    return SpecialForms.list(...list.slice(1));
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

  is_float: function(x){
    return Kernel.is_number(x) && !Number.isInteger(x);
  },

  is_integer: function(x){
    return Number.isInteger(x);
  },

  is_list: function(x){
    return x instanceof Array;
  },

  is_map: function(x){
    return typeof x === 'object' || x instanceof Object;
  },

  is_number: function(x){
    return typeof x === "number";
  },

  is_tuple: function(x){
    return x instanceof Tuple;
  },

  length: function(x){
    return x.length;
  },

  is_pid: function(x){
    return x instanceof PID;
  },

  is_port: function(x){

  },

  is_reference: function(x){

  },

  is_bitstring: function(x){
    return Kernel.is_binary(x) || x instanceof BitString;
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
    return Patterns.match_no_throw(pattern, expr, guard) != null;
  },

  defstruct: function(defaults, values){
    return Kernel.SpecialForms.map_update(defaults, values);
  },

  is_struct_fn: function(__struct__){
    return function(x){
      return Kernel.is_map && x[Kernel.SpecialForms.atom("__struct__")] === __struct__;
    }
  },

  defprotocol: function(spec){
    return new Protocol(spec);
  },

  defimpl: function(protocol, type, impl){
    protocol.implementation(type, impl);
  }
};

export default Kernel;


