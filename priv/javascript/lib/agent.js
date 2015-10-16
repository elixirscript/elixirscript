import Kernel from './kernel';
import Keyword from './keyword';

function start(fun, options = []){
  let pid = self.system.spawn(start_process(module, args));

  if(Keyword.has_key__qm__(options, Kernel.SpecialForms.atom("name"))){
    let name = Keyword.get(options, Kernel.SpecialForms.atom("name"));

    self.system.register(name, pid);
    return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), name);
  }

  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), pid);
}

function start_link(fun, options = []){
  let pid = self.system.spawn_link(start_process(module, args));

  if(Keyword.has_key__qm__(options, Kernel.SpecialForms.atom("name"))){
    let name = Keyword.get(options, Kernel.SpecialForms.atom("name"));

    self.system.register(name, pid);
    return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), name);
  }

  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), pid);
}

function start_process(fun){
  return function*(){
    yield self.system.put("state", fun.apply(null, []));

    try{
      while(true){
        yield self.system.receive(function(args){
          let command = args[0];

          switch(command){
            case "update":
              let updateFn = args[1];
              let sender = args[2];

              let current_state = self.system.get("state");
              let new_state = updateFn(current_state);

              self.system.put("state", new_state);
              self.system.send(sender, Symbol.for("ok"));

              break;
            case "get":
              let getFn = args[1];
              let sender = args[2];

              let current_state = self.system.get("state");
              let return_value = getFn(current_state);

              self.system.send(sender, return_value);

              break;
            case "get_and_update":
              let updateFn = args[1];
              let sender = args[2];

              let current_state = self.system.get("state");
              let get_and_update_tuple = updateFn(current_state);

              self.system.put("state", Kernel.elem(get_and_update_tuple, 1));
              self.system.send(sender, Kernel.elem(get_and_update_tuple, 0));

              break;
            case "stop":
              throw "stop";
          }        
        });
      }
    }catch(e){
      if(e !== "stop"){
        throw e;
      }
    }
  }
}

function* stop(agent, timeout = 5000){
  self.system.send(agent, ["stop", self.system.pid()]);
}

function* update(agent, fun, timeout = 5000){
  self.system.send(agent, ["update", fun, self.system.pid()]);

  return yield self.system.receive(function(args){
    return args;
  }); 
}

function* get(agent, fun, timeout = 5000){
  self.system.send(agent, ["update", fun, self.system.pid()]);

  return yield self.system.receive(function(args){
    return args;
  }); 
}

function* get_and_update(agent, fun, timeout = 5000){
  self.system.send(agent, ["get_and_update", fun, self.system.pid()]);

  return yield self.system.receive(function(args){
    return args;
  }); 
}

export default {
  start,
  stop,
  update,
  get,
  get_and_update
};
