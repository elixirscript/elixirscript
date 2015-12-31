import { PID, Tuple, Integer, Float } from './primitives';
import BitString from './bit_string';
import Patterns from './patterns';

function call_property(item, property){
  if(property in item){
    item[property];
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }

  }else if(Symbol.for(property) in item){
    let prop = Symbol.for(property)
    if(item[prop] instanceof Function){
      return item[prop]();
    }else{
      return item[prop];
    }
  }

  throw new Error(`Property ${property} not found in ${item}`);
}

function is_instance_of(value, type){
  return value instanceof type;
}

function size(term){
  return term.length;
}

function is_nil(x){
  return x === null;
}

function is_atom(x){
  return typeof x === 'symbol';
}

function is_binary(x){
  return typeof x === 'string' || x instanceof String;
}

function is_boolean(x){
  return typeof x === 'boolean' || x instanceof Boolean;
}

function is_function(x, arity = -1){
  return typeof x === 'function' || x instanceof Function;
}

function is_float(x){
  return is_number(x) && !Number.isInteger(x);
}

function is_integer(x){
  return Number.isInteger(x);
}

function is_list(x){
  return x instanceof Array;
}

function is_map(x){
  return typeof x === 'object' || x instanceof Object;
}

function is_number(x){
  return typeof x === "number";
}

function is_tuple(x){
  return x instanceof Tuple;
}

function is_pid(x){
  return x instanceof PID;
}

function is_port(x){
  return false;
}

function is_reference(x){
  return false;
}

function is_bitstring(x){
  return is_binary(x) || x instanceof BitString;
}

function add(one, two){
  return one + two;
}

function subtract(one, two){
  return one + two;
}

function multiply(one, two){
  return one + two;
}

function divide(one, two){
  return one + two;
}

function remainder(one, two){
  return one + two;
}

function apply(...args){
  if(args.length === 2){
    args[0].apply(null, args.slice(1));
  }else{
    args[0][args[1]].apply(null, args.slice(2));
  }
}

function new_tuple(...args){
  return new Tuple(...args);
}

function make_tuple(data, size){
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return new Tuple(...array);
}

function insert_at(tuple, index, term){
  let new_tuple = [];

  for (var i = 0; i <= tuple.count(); i++) {
    if(i === index){
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.get(i));
    }else{
      new_tuple.push(tuple.get(i));
    }
  }

  return new Tuple(...new_tuple);
}

function duplicate(data, size){
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return array;
}

function delete_at(tuple, index){
  let new_list = [];

  for (var i = 0; i < tuple.count(); i++) {
    if(i !== index){
      new_list.push(tuple.get(i));
    }
  }

  return new Tuple(...new_list);
};

function contains(left, right){
  for(let x of right){
    if(Patterns.match_no_throw(left, x) != null){
      return true;
    }
  }

  return false;
}

function reverse(list){
  return list.concat([]).reverse();
}

function get_global(){
  if(typeof(self) !== "undefined"){
    return self;
  }else if(typeof(window) !== "undefined"){
    return window;
  }else if(typeof(global) !== "undefined"){
    return global;
  }

  throw new Error("No global state found");
}

function concat_lists(left, right){
  return left.concat(right);
}

function prepend_to_list(list, item){
  return [item].concat(list);
}

function defstruct(defaults){
  return class {
    constructor(update = {}){
      let the_values = Object.assign(defaults, update);
      Object.assign(this, the_values);
    }

    static create(updates = {}){
      let x = new this(updates);
      return Object.freeze(x);
    }
  }
}


function defexception(defaults){
  return class extends Error {
    constructor(update = {}){
      let message = update.message || "";
      super(message);

      let the_values = Object.assign(defaults, update);
      Object.assign(this, the_values);

      this.name = this.constructor.name;
      this.message = message;
      this[SpecialForms.atom("__exception__")] = true;
      Error.captureStackTrace(this, this.constructor.name);
    }

    static create(updates = {}){
      let x = new this(updates);
      return Object.freeze(x);
    }
  }
}

function defprotocol(spec){
  return new Protocol(spec);
}

function defimpl(protocol, type, impl){
  protocol.implementation(type, impl);
}

function get_object_keys(obj){
  return Object.keys(obj).concat(Object.getOwnPropertySymbols(obj))
}

function is_valid_character(codepoint){
  try{
    return String.fromCodePoint(codepoint) != null;
  }catch(e){
    return false;
  }
}

//https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_rewrite_the_DOMs_atob()_and_btoa()_using_JavaScript's_TypedArrays_and_UTF-8
function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function can_decode64(data) {
  try{
    atob(data);
    return true;
  }catch(e){
    return false;
  }
}

function delete_property_from_map(map, property){
  let new_map = Object.assign(Object.create(map.constructor.prototype), map)
  delete new_map[property]

  return Object.freeze(new_map);
}

function class_to_obj(map){
  let new_map = Object.assign({}, map)
  return Object.freeze(new_map);
}

function add_property_to_map(map, property, value){
  let new_map = Object.assign({}, map);
  new_map[property] = value;
  return Object.freeze(new_map);
}

function bnot(expr){
  return ~expr;
}

function band(left, right){
  return left & right;
}

function bor(left, right){
  return left | right;
}

function bsl(left, right){
  return left << right;
}

function bsr(left, right){
  return left >> right;
}

function bxor(left, right){
  return left ^ right;
}

export default {
  call_property,
  is_instance_of,
  size,
  is_nil,
  is_atom,
  is_binary,
  is_boolean,
  is_function,
  is_float,
  is_integer,
  is_list,
  is_map,
  is_number,
  is_tuple,
  is_pid,
  is_port,
  is_reference,
  is_bitstring,
  add,
  subtract,
  multiply,
  divide,
  remainder,
  apply,
  new_tuple,
  duplicate,
  contains,
  reverse,
  get_global,
  concat_lists,
  prepend_to_list,
  defstruct,
  defexception,
  defprotocol,
  defimpl,
  get_object_keys,
  is_valid_character,
  b64EncodeUnicode,
  delete_property_from_map,
  add_property_to_map,
  class_to_obj,
  bnot,
  band,
  bor,
  bsl,
  bsr,
  bxor
};
