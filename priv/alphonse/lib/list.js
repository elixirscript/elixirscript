import Tuple from './tuple';
import Atom from './atom';
import Kernel from './kernel';
import ElixirScript from './elixir_script';

let List = function(...args){
  if (!(this instanceof List)) return new List(...args);

  this.value = args;
  this.length = args.length;

  for (var i = 0; i < args.length; i++) {
    this[i] = args[i];
  }
}

List.__MODULE_ = [Atom('List')];

List.prototype[Symbol.iterator] = function() {
  return this.value[Symbol.iterator]();
};

List.prototype.toString = function(){
  var i, s = "";
  for (i = 0; i < this.length; i++) {
    if (s !== "") {
      s += ", ";
    }
    s += this[i].toString();
  }

  return "[" + s + "]";
};

List.delete = function(list, item){
  let new_value = [];
  let value_found = false;

  for(let x of list){
    if(x !== item && !value_found){
      new_value.push(ElixirScript.clone(x));
    }else{
      value_found = true;
    }
  }

  return List(...new_value);
};

List.delete_at = function(list, index){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i !== index){
      new_value.push(ElixirScript.clone(list.value[i]));
    }    
  }

  return List(...new_value);
};

List.duplicate = function(elem, n){
  let new_value = [];

  for (var i = 0; i < n; i++) {
    new_value.push(ElixirScript.clone(elem));
  };

  return List(...new_value);
};

List.first = function(list){
  if(list.length == 0){
    return null;
  }

  return ElixirScript.clone(list[0]);
};

List.flatten = function(list, tail = []){
  let new_value = [];

  for(let x of list){
    if(Kernel.is_list(x)){
      new_value = new_value.concat(List.flatten(x).value)
    }else{
      new_value.push(ElixirScript.clone(x));    
    }
  }

  new_value = new_value.concat(ElixirScript.clone(tail));

  return List(...new_value);  
};

List.foldl = function(list, acc, func){
  let new_acc = ElixirScript.clone(acc);

  for(let x of list){
    new_acc = func(x, new_acc);
  }

  return new_acc;
};

List.foldr = function(list, acc, func){
  let new_acc = ElixirScript.clone(acc);

  for (var i = list.length - 1; i >= 0; i--) {
    new_acc = func(list[i], new_acc);
  };

  return new_acc;
};

List.insert_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(ElixirScript.clone(value));
      new_value.push(ElixirScript.clone(list[i]));   
    }else{
      new_value.push(ElixirScript.clone(list[i]));      
    }    
  }

  return List(...new_value);
};

List.last = function(list){
  if(list.length == 0){
    return null;
  }

  return ElixirScript.clone(list[list.length-1]);
};

List.replace_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(ElixirScript.clone(value)); 
    }else{
      new_value.push(ElixirScript.clone(list[i]));      
    }    
  }

  return List(...new_value);
};

List.update_at = function(list, index, fun){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(ElixirScript.clone(fun(list[i]))); 
    }else{
      new_value.push(ElixirScript.clone(list[i]));      
    }    
  }

  return List(...new_value);
};

List.wrap = function(list){
  if(list instanceof List){
    return list;
  }else if(list == null){
    return List();
  }else{
    return List(list);
  }
};

List.zip = function(list_of_lists){
  if(list_of_lists.length == 0){
    return List();
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
    for(let j = 0; j < list_of_lists; j ++){
      current_value.push(list_of_lists[j][i]);
    }

    new_value.push(Tuple(...current_value));
  }

  return List(...new_value);
};

List.to_tuple = function(list){
  return Tuple.apply(null, ElixirScript.clone(list.value));
};

export default List;