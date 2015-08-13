import Erlang from './erlang';

let Tuple = {};

Tuple.__MODULE__ = Erlang.atom('Tuple');

Tuple.to_string = function(tuple){
  var i, s = "";
  for (i = 0; i < tuple.__tuple__.length; i++) {
    if (s !== "") {
      s += ", ";
    }
    s += tuple.__tuple__[i].toString();
  }

  return "{" + s + "}";
};

Tuple.delete_at = function(tuple, index){
  let new_list = [];

  for (var i = 0; i < tuple.__tuple__.length; i++) {
    if(i !== index){
      new_list.push(tuple.__tuple__[i]);
    }
  }

  return Erlang.tuple.apply(null, new_list);
};

Tuple.duplicate = function(data, size){
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return Erlang.tuple.apply(null, array);
};

Tuple.insert_at = function(tuple, index, term){
  let new_tuple = [];

  for (var i = 0; i <= tuple.__tuple__.length; i++) {
    if(i === index){
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.__tuple__[i]);
    }else{
      new_tuple.push(tuple.__tuple__[i]);
    }
  }

  return Erlang.tuple.apply(null, new_tuple);
};

Tuple.from_list = function(list){
  return Erlang.tuple.apply(null, list);
};

Tuple.to_list = function(tuple){
  let new_list = [];

  for (var i = 0; i < tuple.__tuple__.length; i++) {
    new_list.push(tuple.__tuple__[i]);
  }

  return Erlang.list(...new_list);
};

Tuple.iterator = function(tuple){
  return tuple.__tuple__[Symbol.iterator]();
};

export default Tuple;
