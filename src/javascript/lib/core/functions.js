import { PID, Tuple, Integer, Float } from './primitives';
import BitString from './bit_string';

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

function new_tuple(args){
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

function and(first, second){
  return first && second;
}

function or(first, second){
  return first || second;
}

function raise(value){
  throw value;
}

export {
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
  and,
  or,
  raise
};
