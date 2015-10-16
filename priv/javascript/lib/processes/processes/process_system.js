/* @flow */
"use strict";

import Mailbox from "./mailbox";
import Process from "./process";
import States from "./states";
import Scheduler from "./scheduler";
import PID from "./pid";

class ProcessSystem {

  constructor(){
    this.pids = new Map();
    this.mailboxes = new Map();
    this.names = new Map();
    this.links = new Map();

    const throttle = 5; //ms between scheduled tasks
    this.current_process = null;
    this.scheduler = new Scheduler(throttle);
    this.suspended = new Map();

    let process_system_scope = this;
    this.main_process_pid = this.spawn(function*(){
        while(true){
          yield process_system_scope.sleep(10000);
        }
    });
    this.set_current(this.main_process_pid);
  }

  static * run(fun, args, context = null){
    if(fun.constructor.name === "GeneratorFunction"){
      return yield* fun.apply(context, args);
    }else{
      return fun.apply(context, args);
    }
  }

  spawn(...args){
    if(args.length === 1){
      let fun = args[0];
      return this.add_proc(fun, [], false).pid;

    }else if(args.length === 3){
      let mod = args[0];
      let fun = args[1];
      let the_args = args[2];

      return this.add_proc(mod[fun], the_args, false).pid;
    }
  }

  spawn_link(...args){
    if(args.length === 1){
      let fun = args[0];
      return this.add_proc(fun, [], true).pid;

    }else if(args.length === 3){
      let mod = args[0];
      let fun = args[1];
      let the_args = args[2];

      return this.add_proc(mod[fun], the_args, true).pid;
    }
  }

  link(pid){
    this.links.get(this.pid()).add(pid);
    this.links.get(pid).add(this.pid());  
  }

  unlink(pid){
    this.links.get(this.pid()).delete(pid);
    this.links.get(pid).delete(this.pid());   
  }

  set_current(id){
    let pid = this.pidof(id);
    if(pid !== null){
      this.current_process = this.pids.get(pid);
      this.current_process.status = States.RUNNING;
    }
  }

  add_proc(fun, args, linked){
    let newpid = new PID();
    let mailbox = new Mailbox();
    let newproc = new Process(newpid, fun, args, mailbox, this);

    this.pids.set(newpid, newproc);
    this.mailboxes.set(newpid, mailbox);
    this.links.set(newpid, new Set());

    if(linked){
      this.link(newpid);
    }

    newproc.start();
    return newproc;
  }

  remove_proc(pid, exitreason){
    this.pids.delete(pid);
    this.unregister(pid);
    this.scheduler.removePid(pid);

    if(this.links.has(pid)){
      for (let linkpid of this.links.get(pid)) {
        this.exit(linkpid, exitreason);
        this.links.get(linkpid).delete(pid);
      }

      this.links.delete(pid);
    }
  }

  register(name, pid){
    if(!this.names.has(name)){
      this.names.set(name, pid)
    }else{
      throw new Error("Name is already registered to another process");
    }
  }

  registered(name){
    return this.names.has(name) ? this.names.get(name) : null;
  }

  unregister(pid){
    for(let name of this.names.keys()){
      if(this.names.has(name) && this.names.get(name) === pid){
        this.names.delete(name);
      }
    }
  }

  pid(){
    return this.current_process.pid;
  }

  pidof(id){
    if (id instanceof PID) {
       return this.pids.has(id) ? id : null;
    } else if (id instanceof Process) {
       return id.pid;
    } else {
       let pid = this.registered(id);
       if (pid === null)
          throw("Process name not registered: " + id + " (" + typeof(id) + ")");
       return pid;
    }
  }

  send(id, msg) {
    const pid = this.pidof(id);

    if(pid){
      this.mailboxes.get(pid).deliver(msg);

      if(this.suspended.has(pid)){
        let fun = this.suspended.get(pid);
        this.suspended.delete(pid);
        this.schedule(fun);
      }
    }

    return msg;
  }

  receive(fun, timeout = 0, timeoutFn = () => true ) {
    let DateTimeout = null;

    if(timeout === 0 || timeout === Infinity){
      DateTimeout = null;
    }else{
      DateTimeout = Date.now() + timeout;
    }

    return [
      States.RECEIVE,
      fun,
      DateTimeout,
      timeoutFn
    ];
  }

  sleep(duration){
    return [States.SLEEP, duration];
  }

  suspend(fun){
    this.current_process.status = States.SUSPENDED;
    this.suspended.set(this.current_process.pid, fun);
  }

  delay(fun, time){
    this.current_process.status = States.SLEEPING;
    this.scheduler.scheduleFuture(this.current_process.pid, time, fun);
  }

  schedule(fun, pid){
    const the_pid = pid != null ? pid : this.current_process.pid;
    this.scheduler.schedule(the_pid, fun); 
  }

  exit(one, two){
    if(two){
      let pid = one;
      let reason = two;

      let process = this.pids.get(this.pidof(pid));
      if((process && process.is_trapping_exits()) || reason === States.KILL || reason === States.NORMAL){
        this.mailboxes.get(process.pid).deliver([States.EXIT, this.pid(), reason ]);
      }else{
        process.signal(reason); 
      }          
    }else{
      let reason = one;
      this.current_process.signal(reason);       
    }
  }

  error(reason){
    this.current_process.signal(reason);
  }

  process_flag(flag, value){
    this.current_process.process_flag(flag, value);
  }

  put(key, value){
    this.current_process.dict[key] = value;
  }

  get(key){
    if(key != null){
      return this.current_process.dict[key];
    }else{
      return this.current_process.dict;
    }
  }

  get_keys(){
    return Object.keys(this.current_process.dict);
  }

  erase(key){
    if(key != null){
      delete this.current_process.dict[key];
    }else{
      this.current_process.dict = {};
    }
  }
}

export default ProcessSystem;