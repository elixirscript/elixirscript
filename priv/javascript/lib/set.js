import MapSet from './map_set';

function size(map){
  return MapSet.size(map);
}

function to_list(map){
  return MapSet.to_list(map);
}

function __delete__(set, term){
  return MapSet.__delete__(set, term);
}

function put(set, term){
  return MapSet.put(set, term);
}

function difference(set1, set2){
  return MapSet.difference(set1, set2); 
}

function intersection(set1, set2){
  return MapSet.intersection(set1, set2); 
}

function union(set1, set2){
  return MapSet.union(set1, set2); 
}

function disjoin__qmark__(set1, set2){
  return MapSet.disjoin__qmark__(set1, set2); 
}

function member__qmark__(set, value){
  return MapSet.member__qmark__(set1, set2);
}

function equal__qmark__(set1, set2){
  return MapSet.equal__qmark__(set1, set2);
}

function subset__qmark__(set1, set2){
  return MapSet.subset__qmark__(set1, set2);
}


export default {
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