import Erlang from './erlang';
import Kernel from './kernel';
import Keyword from './keyword';

let Agent = {};

Agent.__MODULE__ = Erlang.atom("Agent");

Agent.start = function(fun, options = []){
  const name = Keyword.get(options, Erlang.atom("name"));
  self.mailbox[name] = fun();
  return Erlang.tuple(Erlang.atom("ok"), name);
}

Agent.update = function(agent, fun, timeout = 5000){
  const current_state = self.mailbox[agent];
  const new_state = fun(current_state);
  self.mailbox[agent] = new_state;
  return Erlang.atom("ok");
}

Agent.get = function(agent, fun, timeout = 5000){
  const current_state = self.mailbox[agent];
  return fun(current_state);
}

Agent.get_and_update = function(agent, fun, timeout = 5000){
  const current_state = self.mailbox[agent];
  const get_and_update_tuple = fun(current_state);
  
  self.mailbox[agent] = Kernel.elem(get_and_update_tuple, 1);
  return Kernel.elem(get_and_update_tuple, 0);
}


export default Agent;
