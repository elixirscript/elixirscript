import Atom from './atom';
import List from './list';

let Tuple = function(...args){
  if (!(this instanceof Tuple)){
    return new Tuple(...args);
  }

  let _value = Object.freeze(args);

  this.value = function(){
    return _value;
  };

  this.length = function(){
    return _value.length;
  };

  this.get = function(i){
    return _value[i];
  };
};

Tuple.prototype.__MODULE__ = Atom('Tuple');

Tuple.prototype.toString = function(){
  var i, s = "";
  for (i = 0; i < this.length(); i++) {
    if (s !== "") {
      s += ", ";
    }
    s += this.get(i).toString();
  }

  return "{" + s + "}";
};

Tuple.to_string = function(tuple){
  return tuple.toString();
};

Tuple.delete_at = function(tuple, index){
  let new_list = [];

  for (var i = 0; i < tuple.length(); i++) {
    if(i !== index){
      new_list.push(tuple.get(i));
    }
  }

  return Tuple.apply(null, new_list);
};

Tuple.duplicate = function(data, size){
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return Tuple.apply(null, array);
};

Tuple.insert_at = function(tuple, index, term){
  let new_tuple = [];

  for (var i = 0; i <= tuple.length(); i++) {
    if(i === index){
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.get(i));
    }else{
      new_tuple.push(tuple.get(i));
    }
  }

  return Tuple.apply(null, new_tuple);
};

Tuple.from_list = function(list){
  return Tuple.apply(null, list.value());
};

Tuple.to_list = function(tuple){
  let new_list = [];

  for (var i = 0; i < tuple.length(); i++) {
    new_list.push(tuple.get(i));
  }

  return List(...new_list);
};

export default Tuple;
