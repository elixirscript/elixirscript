import Erlang from './erlang';
import Kernel from './kernel';
import Immutable from './immutable/immutable';

let List = {};

List.__MODULE__ = Kernel.SpecialForms.atom('List');

List.delete = function(list, item){
  return list.filter(x => x !== item);
};

List.delete_at = function(list, index){
  return list.delete(index);
};

List.duplicate = function(elem, n){
  return Immutable.Repeat(elem, n);
};

List.first = function(list){
  return list.first;
};

List.flatten = function(list, tail = Kernel.SpecialForms.list()){
  return list.flatten().concat(tail);
};

List.foldl = function(list, acc, func){
  return list.reduce(func, acc);
};

List.foldr = function(list, acc, func){
  return list.reduceRight(func, acc);
};

List.insert_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(value);
      new_value.push(list.get(i));
    }else{
      new_value.push(list.get(i));
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.keydelete = function(list, key, position){
  return list.filter(x => !Kernel.match__qmark__(x.get(position), key));
};

List.keyfind = function(list, key, position, _default = null){
  return list.first(x => Kernel.match__qmark__(x.get(position), key), _default);
};

List.keymember__qmark__ = function(list, key, position){
  return list.some(x => Kernel.match__qmark__(x.get(position), key));
};

List.keyreplace = function(list, key, position, new_tuple){
  let new_list = [];

  for(let i = 0; i < list.count(); i++){
    if(!Kernel.match__qmark__(list.get(i).get(position), key)){
      new_list.push(list.get(i));
    }else{
      new_list.push(new_tuple);
    }
  }

  return Kernel.SpecialForms.list(...new_list);
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

  return Kernel.SpecialForms.list(...new_list);
};

List.keystore = function(list, key, position, new_tuple){
  let new_list = [];
  let replaced = false;

  for(let i = 0; i < list.length; i++){
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

  return Kernel.SpecialForms.list(...new_list);
};

List.last = function(list){
  return list.last();
};

List.replace_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.count(); i++){
    if(i === index){
      new_value.push(value);
    }else{
      new_value.push(list.get(i));
    }
  }

  return Kernel.SpecialForms.list(...new_value);
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
    return Kernel.SpecialForms.list();
  }else{
    return Kernel.SpecialForms.list(list);
  }
};

List.zip = function(list_of_lists){
  if(list_of_lists.count() === 0){
    return Kernel.SpecialForms.list();
  }

  return list_of_lists.first().zip(list_of_lists.rest());
};

List.to_tuple = function(list){
  return Kernel.SpecialForms.tuple.apply(null, list);
};

List.append = function(list, value){
  return list.push(value);
};

List.concat = function(left, right){
  return left.concat(right);
};

export default List;
