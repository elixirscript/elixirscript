const MODULE = Symbol.for('elixir_config');
const ets = new Map();

function _new(opts) {
  ets.set(MODULE, new Map());
  ets.get(MODULE).set(MODULE, opts);
  return MODULE;
}

function _delete(module) {
  ets.delete(module);
  return true;
}

function put(key, value) {
  ets.get(MODULE).set(key, value);
  return Symbol.for('ok');
}

function get(key) {
  return ets.get(MODULE).get(key);
}

function update(key, fun) {
  const value = fun(ets.get(MODULE).get(key));
  put(key, value);
  return value;
}

function get_and_put(key, value) {
  const oldValue = get(key);
  put(key, value);
  return oldValue;
}

export default {
  new: _new,
  delete: _delete,
  put,
  get,
  update,
  get_and_put
};
