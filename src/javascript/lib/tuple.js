import Kernel from './kernel';

function to_string(tuple){
  return tuple.toString();
};

function delete_at(tuple, index){
  let new_list = [];

  for (var i = 0; i < tuple.count(); i++) {
    if(i !== index){
      new_list.push(tuple.get(i));
    }
  }

  return Kernel.SpecialForms.tuple.apply(null, new_list);
};

function duplicate(data, size){
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return Kernel.SpecialForms.tuple.apply(null, array);
};

function insert_at(tuple, index, term){
  let new_tuple = [];

  for (var i = 0; i <= tuple.count(); i++) {
    if(i === index){
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.get(i));
    }else{
      new_tuple.push(tuple.get(i));
    }
  }

  return Kernel.SpecialForms.tuple.apply(null, new_tuple);
};

function from_list(list){
  return Kernel.SpecialForms.tuple.apply(null, list);
};

function to_list(tuple){
  let new_list = [];

  for (var i = 0; i < tuple.count(); i++) {
    new_list.push(tuple.get(i));
  }

  return Kernel.SpecialForms.list(...new_list);
};

export default {
  to_string,
  delete_at,
  duplicate,
  insert_at,
  from_list,
  to_list
};
