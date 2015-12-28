import SpecialForms from './kernel/special_forms';
import * as Core from './core';

function __new__(){
  return SpecialForms.map({});
}

function keys(map){
  return Core.Functions.get_object_keys(map);
}

function size(map){
  return keys(map).length;
}

function to_list(map){
  let map_keys = keys(map);
  let list = [];

  for(let key of map_keys){
    list.push(new Core.Tuple(key, map[key]));
  }

  return Core.List(...list);
}

function values(map){
  let map_keys = keys(map);
  let list = [];

  for(let key of map_keys){
    list.push(map[key]);
  }

  return Core.List(...list);
}

function from_struct(struct){
  let map = Object.assign({}, struct);
  delete map[Symbol.for("__struct__")];

  return SpecialForms.map(map);
}

function __delete__(map, key){
  let new_map = Object.assign({}, map);

  delete new_map[key];

  return SpecialForms.map(new_map);
}

function drop(map, keys){
  let new_map = Object.assign({}, map);

  for(let key of keys){
    delete new_map[key];
  }

  return SpecialForms.map(new_map);
}


function equal__qmark__(map1, map2){
  return map1 === map2;
}

function fetch__emark__(map, key){
  if(key in map){
    return map[key]
  }

  throw new Error("Key not found.");
}

function fetch(map, key){
  if(key in map){
    return new Core.Tuple(Symbol.for("ok"), map[key]);
  }

  return Symbol.for("error");
}

function has_key__qmark__(map, key){
  return key in map;
}

function merge(map1, map2){
  return SpecialForms.map_update(map1, map2);
}

function split(map, keys){
  let split1 = {};
  let split2 = {};

  for(let key of Core.Functions.get_object_keys(map) ){
    if(keys.indexOf(key) > -1){
      split1[key] = map[key];
    }else{
      split2[key] = map[key];
    }
  }

  return new Core.Tuple(
    SpecialForms.map(split1),
    SpecialForms.map(split2)
  );
}

function take(map, keys){
  let split1 = {};

  for(let key of Core.Functions.get_object_keys(map) ){
    if(keys.indexOf(key) > -1){
      split1[key] = map[key];
    }
  }

  return SpecialForms.map(split1);
}

function drop(map, keys){
  let split1 = {};

  for(let key of Core.Functions.get_object_keys(map) ){
    if(keys.indexOf(key) === -1){
      split1[key] = map[key];
    }
  }

  return SpecialForms.map(split1);
}

function put_new(map, key, value){
  if(key in map){
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = value;

  return SpecialForms.map(new_map);
}

function put_new_lazy(map, key, fun){
  if(key in map){
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = fun();

  return SpecialForms.map(new_map);
}

function get_and_update(map, key, fun){
  if(key in map){
    return map;
  }

  let new_map = Object.assign({}, map);
  new_map[key] = fun(map[key]);

  return SpecialForms.map(new_map);
}

function pop_lazy(map, key, fun){
  if(!key in map){
    return new Core.Tuple(fun(), map);
  }

  let new_map = Object.assign({}, map);
  let value = fun(new_map[key]);
  delete new_map[key];

  return new Core.Tuple(value, new_map);
}


function pop(map, key, _default = null){
  if(!key in map){
    return new Core.Tuple(_default, map);
  }

  let new_map = Object.assign({}, map);
  let value = new_map[key];
  delete new_map[key];

  return new Core.Tuple(value, new_map);
}

function get_lazy(map, key, fun){
  if(!key in map){
    return fun();
  }

  return fun(map[key]);
}


function get(map, key, _default = null){
  if(!key in map){
    return _default;
  }

  return map[key];
}

function put(map, key, val){
  let new_map = Object({}, map);
  new_map[key] = val;

  return SpecialForms.map(new_map);
}

function update__emark__(map, key, fun){
  if(!key in map){
    throw new Error("Key not found");
  }

  let new_map = Object({}, map);
  new_map[key] = fun(map[key]);

  return SpecialForms.map(new_map);
}

function update(map, key, initial, fun){
  let new_map = Object({}, map);

  if(!key in map){
    new_map[key] = initial;
  }else{
    new_map[key] = fun(map[key]);
  }

  return SpecialForms.map(new_map);
}


export default {
  new: __new__,
  keys,
  size,
  to_list,
  values,
  from_struct,
  delete: __delete__,
  drop,
  equal__qmark__,
  fetch__emark__,
  fetch,
  has_key__qmark__,
  split,
  take,
  put_new,
  put_new_lazy,
  get_and_update,
  pop_lazy,
  pop,
  get_lazy,
  get,
  put,
  update__emark__,
  update
}
