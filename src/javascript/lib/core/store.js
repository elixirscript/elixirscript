import Core from '../core';

function get_key(key) {
  let real_key = key;

  if (Core.global.__elixirscript_names__.has(key)) {
    real_key = Core.global.__elixirscript_names__.get(key);
  }

  if (Core.global.__elixirscript_store__.has(real_key)) {
    return real_key;
  }

  throw new Error(`Key ${real_key} not found`);
}

function create(value, name = null) {
  const key = new Core.PID();

  if (name !== null) {
    Core.global.__elixirscript_names__.set(name, key);
  }

  return Core.global.__elixirscript_store__.set(key, value);
}

function update(key, value) {
  const real_key = get_key(key);
  return Core.global.__elixirscript_store__.set(real_key, value);
}

function read(key) {
  const real_key = get_key(key);
  return Core.global.__elixirscript_store__.get(real_key);
}

function remove(key) {
  const real_key = get_key(key);
  return Core.global.__elixirscript_store__.delete(real_key);
}

export default {
  create,
  update,
  read,
  remove,
};
