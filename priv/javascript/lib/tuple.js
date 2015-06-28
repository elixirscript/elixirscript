import Erlang from './erlang';

let Tuple = {};

Tuple.__MODULE__ = Erlang.atom('Tuple');

Tuple.to_string = function(tuple){
  return tuple.toString();
};

Tuple.delete_at = function(tuple, index){
  let new_list = [];

  for (var i = 0; i < tuple.length; i++) {
    if(i !== index){
      new_list.push(tuple.get(i));
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

  for (var i = 0; i <= tuple.length; i++) {
    if(i === index){
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.get(i));
    }else{
      new_tuple.push(tuple.get(i));
    }
  }

  return Erlang.tuple.apply(null, new_tuple);
};

Tuple.from_list = function(list){
  return Erlang.tuple.apply(null, list);
};

Tuple.to_list = function(tuple){
  let new_list = [];

  for (var i = 0; i < tuple.length; i++) {
    new_list.push(tuple.get(i));
  }

  return Erlang.list(...new_list);
};

export default Tuple;
