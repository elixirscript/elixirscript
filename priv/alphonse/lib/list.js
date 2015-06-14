import Tuple from './tuple';
import Atom from './atom';
import Kernel from './kernel';

let List;

List = function(...args){
  if (!(this instanceof List)){
    return new List(...args);
  }

  let _value = Object.freeze(args);

  this.length = function(){
    return _value.length;
  };

  this.get = function(i){
    return _value[i];
  };

  this.value = function(){
    return _value;
  };

  this.toString = function(){
    return _value.toString();
  };

};

List.__MODULE__ = Atom('List');

List.prototype[Symbol.iterator] = function(){
  return this.value()[Symbol.iterator]();
};

List.delete = function(list, item){
  let new_value = [];
  let value_found = false;

  for(let x of list){
    if(x === item && value_found !== false){
      new_value.push(x);
      value_found = true;
    }else if(x !== item){
      new_value.push(x);
    }
  }

  return List(...new_value);
};

List.delete_at = function(list, index){
  let new_value = [];

  for(let i = 0; i < list.length(); i++){
    if(i !== index){
      new_value.push(list.get(i));
    }
  }

  return List(...new_value);
};

List.duplicate = function(elem, n){
  let new_value = [];

  for (var i = 0; i < n; i++) {
    new_value.push(elem);
  }

  return List(...new_value);
};

List.first = function(list){
  if(list.length() === 0){
    return null;
  }

  return list.get(0);
};

List.flatten = function(list, tail = List()){
  let new_value = [];

  for(let x of list){
    if(Kernel.is_list(x)){
      new_value = new_value.concat(List.flatten(x).value());
    }else{
      new_value.push(x);
    }
  }

  new_value = new_value.concat(tail.value());

  return List(...new_value);
};

List.foldl = function(list, acc, func){
  let new_acc = acc;

  for(let x of list){
    new_acc = func(x, new_acc);
  }

  return new_acc;
};

List.foldr = function(list, acc, func){
  let new_acc = acc;

  for (var i = list.length() - 1; i >= 0; i--) {
    new_acc = func(list.get(i), new_acc);
  }

  return new_acc;
};

List.insert_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length(); i++){
    if(i === index){
      new_value.push(value);
      new_value.push(list.get(i));
    }else{
      new_value.push(list.get(i));
    }
  }

  return List(...new_value);
};

List.keydelete = function(list, key, position){
  let new_list = [];

  for(let i = 0; i < list.length(); i++){
    if(!Kernel.match__qmark__(list.get(i).get(position), key)){
      new_list.push(list.get(i));
    }
  }

  return List(...new_list);
};

List.keyfind = function(list, key, position, _default = null){

  for(let i = 0; i < list.length(); i++){
    if(Kernel.match__qmark__(list.get(i).get(position), key)){
      return list.get(i);
    }
  }

  return _default;
};

List.keymember__qmark__ = function(list, key, position){

  for(let i = 0; i < list.length(); i++){
    if(Kernel.match__qmark__(list.get(i).get(position), key)){
      return true;
    }
  }

  return false;
};

List.keyreplace = function(list, key, position, new_tuple){
  let new_list = [];

  for(let i = 0; i < list.length(); i++){
    if(!Kernel.match__qmark__(list.get(i).get(position), key)){
      new_list.push(list.get(i));
    }else{
      new_list.push(new_tuple);
    }
  }

  return List(...new_list);
};


List.keysort = function(list, position){
  let new_list = list;

  new_list.sort(function(a, b){
    if(position === 0){
      if(a.get(position).value < b.get(position).value){
        return -1;
      }

      if(a.get(position).value > b.get(position).value){
        return 1;
      }

      return 0;
    }else{
      if(a.get(position) < b.get(position)){
        return -1;
      }

      if(a.get(position) > b.get(position)){
        return 1;
      }

      return 0;
    }

  });

  return List(...new_list);
};

List.keystore = function(list, key, position, new_tuple){
  let new_list = [];
  let replaced = false;

  for(let i = 0; i < list.length(); i++){
    if(!Kernel.match__qmark__(list.get(i).get(position), key)){
      new_list.push(list.get(i));
    }else{
      new_list.push(new_tuple);
      replaced = true;
    }
  }

  if(!replaced){
    new_list.push(new_tuple);
  }

  return List(...new_list);
};

List.last = function(list){
  if(list.length() === 0){
    return null;
  }

  return list.get(list.length() - 1);
};

List.replace_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length(); i++){
    if(i === index){
      new_value.push(value);
    }else{
      new_value.push(list.get(i));
    }
  }

  return List(...new_value);
};

List.update_at = function(list, index, fun){
  let new_value = [];

  for(let i = 0; i < list.length(); i++){
    if(i === index){
      new_value.push(fun(list.get(i)));
    }else{
      new_value.push(list.get(i));
    }
  }

  return new_value;
};

List.wrap = function(list){
  if(Kernel.is_list(list)){
    return list;
  }else if(list == null){
    return List();
  }else{
    return List(list);
  }
};

List.zip = function(list_of_lists){
  if(list_of_lists.length() === 0){
    return List();
  }

  let new_value = [];
  let smallest_length = list_of_lists.get(0);

  for(let x of list_of_lists){
    if(x.length() < smallest_length){
      smallest_length = x.length();
    }
  }

  for(let i = 0; i < smallest_length; i++){
    let current_value = [];
    for(let j = 0; j < list_of_lists.length; j++){
      current_value.push(list_of_lists.get(j).get(i));
    }

    new_value.push(Tuple(...current_value));
  }

  return List(...new_value);
};

List.to_tuple = function(list){
  return Tuple.apply(null, list.value());
};

List.append = function(list, value){
  return List(...list.value.slice().push(value));
};

export default List;
