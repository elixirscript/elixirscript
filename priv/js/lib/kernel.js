function tl(list){
  return list.slice(1);
}

function hd(list){
  return list.slice(0,1)[0];
}

function is_nil(x){
  return x == null;
}

function is_atom(x){
  return x instanceof Symbol;
}

function is_binary(x){
  return typeof(x) === 'string' || x instanceof String;
}

function is_boolean(x){
  return typeof(x) === 'boolean' || x instanceof Boolean; 
}

function is_function(x, arity = -1){
  return x instanceof Function;
}

// from: http://stackoverflow.com/a/3885844
function is_float(x){
  return n === +n && n !== (n|0);
}

function is_integer(x){
  return n === +n && n === (n|0);
}

function is_list(x){
  return x instanceof Array;
}

function is_map(x){
  return x instanceof Object;
}

function is_number(x){
  return is_integer(x) || is_float(x);
}

function is_tuple(x){
  return x instanceof Object && (length(x) == 0 || x['_0'] != null);
}

function length(x){
  x.length;
}

function is_pid(x){

}

function is_port(x){
  
}

function is_reference(x){

}

function is_bitstring(x){

}

function _in(left, right){
  return Enum.member_qm(right, left);
}

function abs(number){
  return Math.abs(number);
}

function round(number){
  return Math.round(number);
}

function elem(tuple, index){
  return tuple['_' + index];
}

function rem(left, right){
  return left % right;
}

function div(left, right){
  return left / right;
}

function and(left, right){
  return left && right;
}

function or(left, right){
  return left || right;
}

function not(arg){
  return !arg;
}

function apply(module, fun, args){
  if(args.length === 3){
    return module[fun].apply(null, args);
  }else{
    return module.apply(null, fun);  
  }
}

function to_string(arg){
  return arg.toString();
}

function __prop_or_function_call(item, property){
  if(item[property] instanceof Function){
    return item[property]();
  }else{
    return item[property];
  }
}

