import SpecialForms from './kernel/special_forms';
import List from './list';

function __new__(){
  return SpecialForms.map({ [Symbol.for("__struct__")]: Symbol.for("MapSet"), set: SpecialForms.list() });
}

function size(map){
  return keys(map.set).length;
}

function to_list(map){
  return map.set;
}

function __delete__(set, term){
  let new_list = List.__delete__(set.set, term);

  let new_map = Object.assign({}, set);
  new_map.set = new_list;
  return SpecialForms.map(new_map); 
}

function put(set, term){
  if(set.set.indexOf(term) === -1){
    let new_list = List.append(set.set, term);

    let new_map = Object.assign({}, set);
    new_map.set = new_list;
    return SpecialForms.map(new_map); 
  }

  return set;
}

function difference(set1, set2){
  let new_map = Object.assign({}, set1);

  for(let val of set1.set){
    if(member__qmark__(set2, val)){
      new_map.set = List.__delete__(new_map.set, val);
    }
  }

  return SpecialForms.map(new_map); 
}


function intersection(set1, set2){
  let new_map = Object.assign({}, set1);

  for(let val of set1.set){
    if(!member__qmark__(set2, val)){
      new_map.set = List.__delete__(new_map.set, val);
    }
  }

  return SpecialForms.map(new_map); 
}


function union(set1, set2){
  let new_map = set1;

  for(let val of set2.set){
      new_map = put(set, val);
  }

  return SpecialForms.map(new_map); 
}


function disjoin__qmark__(set1, set2){
  for(let val of set1.set){
    if(member__qmark__(set2, val)){
      return false;
    }
  }

  return true;
}

function member__qmark__(set, value){
  return set.set.indexof(value) >= 0;
}

function equal__qmark__(set1, set2){
  return set1.set === set2.set;
}

function subset__qmark__(set1, set2){
  for(let val of set1.set){
    if(!member__qmark__(set2, val)){
      return false;
    }
  }

  return true;
}


export default {
  __new__,
  size,
  to_list,
  disjoin__qmark__,
  __delete__,
  subset__qmark__,
  equal__qmark__,
  member__qmark__,
  put,
  union,
  intersection,
  difference
}