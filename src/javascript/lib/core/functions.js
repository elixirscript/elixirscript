import Protocol from './protocol';
import Core from '../core';

function call_property(item, property){
  let prop = null;

  if(typeof item === "number" || typeof item === "symbol" || typeof item === "boolean" || typeof item === "string"){
    if(item[property] !== undefined){
      prop = property;
    }else if(item[Symbol.for(property)] !== undefined){
      prop = Symbol.for(property);
    }
  } else {
    if(property in item){
      prop = property;
    }else if(Symbol.for(property) in item){
      prop = Symbol.for(property);
    }
  }

  if(prop === null){
    throw new Error(`Property ${ property } not found in ${ item }`);
  }

  if(item[prop] instanceof Function){
    return item[prop]();
  }else{
    return item[prop];
  }
}

function apply(...args){
  if(args.length === 2){
    args[0].apply(null, args.slice(1));
  }else{
    args[0][args[1]].apply(null, args.slice(2));
  }
}

function contains(left, right){
  for(let x of right){
    if(Core.Patterns.match_or_default(left, x) != null){
      return true;
    }
  }

  return false;
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
  };
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
      this[Symbol.for("__exception__")] = true;
      Error.captureStackTrace(this, this.constructor.name);
    }

    static create(updates = {}){
      let x = new this(updates);
      return Object.freeze(x);
    }
  };
}

function defprotocol(spec){
  return new Protocol(spec);
}

function defimpl(protocol, type, impl){
  protocol.implementation(type, impl);
}

function get_object_keys(obj){
    return Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));
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

function delete_property_from_map(map, property){
    let new_map = Object.assign(Object.create(map.constructor.prototype), map);
    delete new_map[property];

  return Object.freeze(new_map);
}

function class_to_obj(map){
    let new_map = Object.assign({}, map);
  return Object.freeze(new_map);
}

function add_property_to_map(map, property, value){
  let new_map = Object.assign({}, map);
  new_map[property] = value;
  return Object.freeze(new_map);
}


function update_map(map, property, value){
    if(property in get_object_keys(map)){
        return add_property_to_map(map, property, value);
    }

    throw "map does not have key";
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

function zip(list_of_lists){
  if(list_of_lists.length === 0){
    return Object.freeze([]);
  }

  let new_value = [];
  let smallest_length = list_of_lists[0];

  for(let x of list_of_lists){
    if(x.length < smallest_length){
      smallest_length = x.length;
    }
  }

  for(let i = 0; i < smallest_length; i++){
    let current_value = [];
    for(let j = 0; j < list_of_lists.length; j++){
      current_value.push(list_of_lists[j][i]);
    }

    new_value.push(new Core.Tuple(...current_value));
  }

  return Object.freeze(new_value);
}

function can_decode64(data) {
  try{
    atob(data);
    return true;
  }catch(e){
    return false;
  }
}

function remove_from_list(list, element){
    let found = false;

    return list.filter((elem) => {
        if(!found && elem === element){
            found = true;
            return false;
        }

        return true;
    });
}

function foldl(fun, acc, list){
    let acc1 = acc;

    for(const el of list){
        acc1 = fun(el, acc1);
    }

    return acc1;
}


function foldr(fun, acc, list){
    let acc1 = acc;

    for(let i = list.length - 1; i >= 0; i--){
        acc1 = fun(list[i], acc1);
    }

    return acc1;
}

function keyfind(key, n, tuplelist){

  for(let i = tuplelist.length - 1; i >= 0; i--){
    if(tuplelist[i].get(n) === key){
      return tuplelist[i];
    }
  }

  return false;
}

function keydelete(key, n, tuplelist){

    for(let i = tuplelist.length - 1; i >= 0; i--){
        if(tuplelist[i].get(n) === key){
            return tuplelist.concat([]).splice(i, 1);
        }
    }

    return tuplelist;
}

function keystore(key, n, list, newtuple){
    for(let i = list.length - 1; i >= 0; i--){
        if(list[i].get(n) === key){
            return list.concat([]).splice(i, 1, newtuple);
        }
    }

  return list.concat([]).push(newtuple);
}

function keymember(key, n, list){
  for(let i = list.length - 1; i >= 0; i--){
    if(list[i].get(n) === key){
      return true;
    }
  }

  return false;
}

function keytake(key, n, list){
  if(!keymember(key, n, list)){
    return false;
  }

  let tuple = keyfind(key, n, list);

  return new Tuple(tuple.get(n), tuple, keydelete(key, n, list));
}

function keyreplace(key, n, list, newtuple){

  for(let i = tuplelist.length - 1; i >= 0; i--){
    if(tuplelist[i].get(n) === key){
      return tuplelist.concat([]).splice(i, 1, newtuple);
    }
  }

  return tuplelist;
}


function reverse(list){
    return list.concat([]).reverse();
}

function maps_find(key, map){
    if(key in get_object_keys(map)){
        return new Core.Tuple(Symbol.for("ok"), map[key]);
    }else{
        return Symbol.for("error");
    }
}

function flatten(list, tail = []) {
  let new_list = [];

  for(let e of list){
    if(Array.isArray(e)){
      new_list = new_list.concat(flatten(e));
    }else{
      new_list.push(e);
    }
  }

  return Object.freeze(new_list.concat(tail));
}

function duplicate(n, elem){
  let list = [];

  for(let i = 0; i < n; i++){
    list.push(elem);
  }

  return Object.freeze(list);
}

function mapfoldl(fun, acc, list){
  let newlist = [];

  for(let x of list){
    let tup = fun(x, acc);
    newlist.push(tup.get(0));
    acc = tup.get(1);
  }


  return new Core.Tuple(Object.freeze(newlist), acc);
}

function filtermap(fun, list){
  let newlist = [];

  for(x of list){
    let result = fun(x);

    if(result === true){
      newlist.push(x);
    }else if(result instanceof Core.Tuple){
      newlist.push(result.get(1));
    }
  }

  return Object.freeze(newlist);
}

function maps_fold(fun, acc, map){
  let acc1 = acc;

  for(let k of get_object_keys(map)){
    acc1 = fun(k, map[k], acc1);
  }

  return acc1;
}

function maps_from_list(list){
  let m = {};

  for(x of list){
    m[x.get(0)] = x.get(1);
  }

  return Object.freeze(m);
}

function* sleep_forever(){
  yield* Core.processes.sleep(Symbol("infinity"));
}

export default {
  call_property,
  apply,
  contains,
  get_global,
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
  can_decode64,
  bnot,
  band,
  bor,
  bsl,
  bsr,
  bxor,
  zip,
  foldl,
  foldr,
  remove_from_list,
  keydelete,
  keystore,
  keyfind,
  keytake,
  keyreplace,
  reverse,
  update_map,
  maps_find,
  flatten,
  duplicate,
  mapfoldl,
  filtermap,
  maps_fold,
  sleep_forever
};
