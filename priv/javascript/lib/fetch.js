import Erlang from './erlang';

let Fetch = {};

Fetch.__MODULE__ = Erlang.atom("Fetch");

function make_request(url, method, options){
  options.method = method;
  return fetch(url, options);
}

Fetch.delete = function(url, options = {}){
  return make_request(url, "DELETE", options);
}

Fetch.get = function(url, options = {}){
  return make_request(url, "GET", options);
}

Fetch.head = function(url, options = {}){
  return make_request(url, "HEAD", options);
}

Fetch.options = function(url, options = {}){
  return make_request(url, "OPTIONS", options);
}

Fetch.post = function(url, options = {}){
  return make_request(url, "POST", options);
}

Fetch.put = function(url, options = {}){
  return make_request(url, "PUT", options);
}

export default Fetch;