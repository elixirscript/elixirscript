function start(options = []){
  return [Symbol.for("ok"), self.system.spawn(start_process())];
}

function start_link(options = []){
  return [Symbol.for("ok"), self.system.spawn_link(start_process())];
}

function start_process(){
  return function*(){
    while(true){
      yield self.system.receive(function(args){
        switch(args[0]){
          case "add_handler":
            break;
          case "notify":
            break;         
          case "call":
            break;
        }       
      });
    }
  }
}

function* add_handler(manager, handler, args){

}

function* call(manager, handler, request, timeout = 5000){

}

function* notify(manager, event){
  
}

export default { start, start_link, call, add_handler, notify };