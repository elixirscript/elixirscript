import Erlang from './erlang';

let Tuple = {};

Tuple.__MODULE__ = Erlang.atom('Tuple');

Tuple.to_string = function(tuple){
  var i, s = "";
  for(let elem of tuple.get("__tuple__")){
    if (s !== "") {
      s += ", ";
    }
    
    s += elem.toString(); 
  }

  return "{" + s + "}";
};

Tuple.delete_at = function(tuple, index){
  return tuple.set("__tuple__", tuple.get("__tuple__").delete(index));
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

  for (var i = 0; i <= tuple.get("__tuple__").count(); i++) {
    if(i === index){
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.get("__tuple__").get(i));
    }else{
      new_tuple.push(tuple.get("__tuple__").get(i));
    }
  }

  return Erlang.tuple.apply(null, new_tuple);
};

Tuple.from_list = function(list){
  return Erlang.tuple.apply(null, list.toJS());
};

Tuple.to_list = function(tuple){
  return tuple.get("__tuple__");
};

Tuple.iterator = function(tuple){
  return tuple.get("__tuple__")[Symbol.iterator]();
};

export default Tuple;
