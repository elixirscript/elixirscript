let store = new Map();
let names = new Map();

function get_key(key){
  let real_key = key;

  if(names.has(key)){
    real_key = names.get(key);
  }

  if(store.has(real_key)){
    return real_key
  }

  return new Error('Key Not Found');
}

function create(key, value, name = null){

  if(name != null){
    names.set(name, key);
  }

  store.set(key, value);
}

function update(key, value){
  let real_key = get_key(key);
  store.set(real_key, value);
}

function read(key){
  let real_key = get_key(key);
  return store.get(real_key);
}

function remove(key){
  let real_key = get_key(key);
  return store.delete(real_key);
}

export default {
  create,
  read,
  update,
  remove
};
