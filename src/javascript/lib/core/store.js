let store = new Map();

function create(key, value){
  store.set(key, value);
}

function update(key, value){
  store.set(key, value);
}

function read(key){
  return store.get(key);
}

function remove(key){
  return store.delete(key);
}

export default {
  create,
  read,
  update,
  remove
};
