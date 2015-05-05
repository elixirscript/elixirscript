import List from './list';
import Atom from './atom';

let Tuple = function(...args){
  if (!(this instanceof Tuple)) return new Tuple(...args);

  this.value = args;
  this.length = args.length;

  for (var i = 0; i < args.length; i++) {
    this[i] = args[i];
  }
}

Tuple.prototype.__MODULE_ = [Atom('Tuple')];

Tuple.prototype.toString = function(){
  var i, s = "";
  for (i = 0; i < this.length; i++) {
    if (s !== "") {
      s += ", ";
    }
    s += this[i].toString();
  }

  return "{" + s + "}";
}

Tuple.to_string = function(tuple){
  return tuple.toString();
}

Tuple.delete_at = function(tuple, index){
  let new_list = [];

  for (var i = 0; i < tuple.value.length; i++) {
    if(i != index){
      new_list.push(tuple.value[i]);
    }
  };

  return Tuple.apply(null, new_list);
};

Tuple.duplicate = function(data, size){
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data)
  };

  return Tuple.apply(null, array);
};

Tuple.insert_at = function(tuple, index, term){
  let new_tuple = [];

  for (var i = 0; i <= tuple.value.length; i++) {
    if(i == index){
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.value[i]);       
    }else{
      new_tuple.push(tuple.value[i]);       
    }
  };

  return Tuple.apply(null, new_tuple);
};

Tuple.from_list = function(list){
  return Tuple.apply(null, list);
};

Tuple.to_list = function(tuple){
  return tuple.value;
};

export default Tuple;