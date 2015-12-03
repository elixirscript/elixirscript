import Kernel from './kernel';
import Keyword from './keyword';

let Agent = {};

Agent.start = function(fun, options = []){
  let pid = self.processes.spawn();

  if(Keyword.has_key__qm__(options, Kernel.SpecialForms.atom("name"))){
    pid = self.processes.register(Keyword.get(options, Kernel.SpecialForms.atom("name")), pid)
  }

  self.processes.put(pid, "state", fun());
  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), pid);
}

Agent.stop = function(agent, timeout = 5000){
  self.processes.exit(agent);
  return Kernel.SpecialForms.atom("ok");
}

Agent.update = function(agent, fun, timeout = 5000){

  const current_state = self.processes.get(agent, "state");
  self.processes.put(agent, "state", fun(current_state));

  return Kernel.SpecialForms.atom("ok");
}

Agent.get = function(agent, fun, timeout = 5000){
  return fun(self.processes.get(agent, "state"));
}

Agent.get_and_update = function(agent, fun, timeout = 5000){

  const get_and_update_tuple = fun(self.processes.get(agent, "state"));
  self.processes.put(agent, "state", Kernel.elem(get_and_update_tuple, 1));

  return Kernel.elem(get_and_update_tuple, 0);
}

export default Agent;
