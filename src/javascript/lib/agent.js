import Kernel from './kernel';
import Keyword from './keyword';

let Agent = {};

Agent.start = function(fun, options = []){
  const name = Keyword.has_key__qm__(options, Kernel.SpecialForms.atom("name")) ? Keyword.get(options, Kernel.SpecialForms.atom("name")) : Symbol();
  
  self.post_office.add_mailbox(name);
  self.post_office.send(name, fun());

  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), name);
}

Agent.stop = function(agent, timeout = 5000){
  self.post_office.remove_mailbox(agent);
  return Kernel.SpecialForms.atom("ok");
}

Agent.update = function(agent, fun, timeout = 5000){

  const current_state = self.post_office.receive(agent);
  self.post_office.send(agent, fun(current_state));

  return Kernel.SpecialForms.atom("ok");
}

Agent.get = function(agent, fun, timeout = 5000){
  return fun(self.post_office.peek(agent));
}

Agent.get_and_update = function(agent, fun, timeout = 5000){

  const get_and_update_tuple = fun(self.post_office.receive(agent));
  self.post_office.send(agent, Kernel.elem(get_and_update_tuple, 1));

  return Kernel.elem(get_and_update_tuple, 0);
}

export default Agent;