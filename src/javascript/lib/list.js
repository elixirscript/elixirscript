import Kernel from './kernel';
import * as Core from './core';

let List = {};

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

  return Core.SpecialForms.list(...new_value);
};

List.delete_at = function(list, index){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i !== index){
      new_value.push(list[i]);
    }
  }

  return Core.SpecialForms.list(...new_value);
};

List.duplicate = function(elem, n){
  let new_value = [];

  for (var i = 0; i < n; i++) {
    new_value.push(elem);
  }

  return Core.SpecialForms.list(...new_value);
};

List.first = function(list){
  return list[0];
};

List.flatten = function(list, tail = Core.SpecialForms.list()){
  let new_value = [];

  for(let x of list){
    if(Kernel.is_list(x)){
      new_value = new_value.concat(List.flatten(x));
    }else{
      new_value.push(x);
    }
  }

  new_value = new_value.concat(tail);

  return Core.SpecialForms.list(...new_value);
};

List.foldl = function(list, acc, func){
  return list.reduce(func, acc);
};

List.foldr = function(list, acc, func){
  let new_acc = acc;

  for (var i = list.length - 1; i >= 0; i--) {
    new_acc = func(list[i], new_acc);
  }

  return new_acc;
};

List.insert_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(value);
      new_value.push(list[i]);
    }else{
      new_value.push(list[i]);
    }
  }

  return Core.SpecialForms.list(...new_value);
};

List.keydelete = function(list, key, position){
  let new_list = [];

  for(let i = 0; i < list.length; i++){
    if(!Kernel.match__qmark__(list[i][position], key)){
      new_list.push(list[i]);
    }
  }

  return Core.SpecialForms.list(...new_list);
};

List.keyfind = function(list, key, position, _default = null){

  for(let i = 0; i < list.length; i++){
    if(Kernel.match__qmark__(list[i][position], key)){
      return list[i];
    }
  }

  return _default;
};

List.keymember__qmark__ = function(list, key, position){

  for(let i = 0; i < list.length; i++){
    if(Kernel.match__qmark__(list[i][position], key)){
      return true;
    }
  }

  return false;
};

List.keyreplace = function(list, key, position, new_tuple){
  let new_list = [];

  for(let i = 0; i < list.length; i++){
    if(!Kernel.match__qmark__(list[i][position], key)){
      new_list.push(list[i]);
    }else{
      new_list.push(new_tuple);
    }
  }

  return Core.SpecialForms.list(...new_list);
};


List.keysort = function(list, position){
  let new_list = list;

  new_list.sort(function(a, b){
    if(position === 0){
      if(a[position].value < b[position].value){
        return -1;
      }

      if(a[position].value > b[position].value){
        return 1;
      }

      return 0;
    }else{
      if(a[position] < b[position]){
        return -1;
      }

      if(a[position] > b[position]){
        return 1;
      }

      return 0;
    }

  });

  return Core.SpecialForms.list(...new_list);
};

List.keystore = function(list, key, position, new_tuple){
  let new_list = [];
  let replaced = false;

  for(let i = 0; i < list.length; i++){
    if(!Kernel.match__qmark__(list[i][position], key)){
      new_list.push(list[i]);
    }else{
      new_list.push(new_tuple);
      replaced = true;
    }
  }

  if(!replaced){
    new_list.push(new_tuple);
  }

  return Core.SpecialForms.list(...new_list);
};

List.last = function(list){
  return list[list.length - 1];
};

List.replace_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(value);
    }else{
      new_value.push(list[i]);
    }
  }

  return Core.SpecialForms.list(...new_value);
};

List.update_at = function(list, index, fun){
  let new_value = [];

  for(let i = 0; i < list.count(); i++){
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
    return Core.SpecialForms.list();
  }else{
    return Core.SpecialForms.list(list);
  }
};

List.zip = function(list_of_lists){
  if(list_of_lists.length === 0){
    return Core.SpecialForms.list();
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

  return Core.SpecialForms.list(...new_value);
};

List.to_tuple = function(list){
  return new Core.Tuple(...list);
};

List.append = function(list, value){
  return Core.SpecialForms.list(...list.concat([value]));
};

List.prepend = function(list, value){
  return Core.SpecialForms.list(...[value].concat(list));
};

List.concat = function(left, right){
  return left.concat(right);
};

export default List;
