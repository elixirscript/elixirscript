/* @flow */
"use strict";

import Mailbox from "./mailbox";
import Process from "./process";
import States from "./states";
import TaskQueue from "./task_queue";

class Scheduler {

  constructor(){
    this.process_counter = 0;
    this.pids = new Map();
    this.mailboxes = new Map();
    this.names = new Map();
    this.links = new Map();

    const throttle = 10; //ms between queued tasks
    this.current_process = null;
    this.task_queue = new TaskQueue(throttle);
    this.suspended = new Map();
  }

  set_current(process){
    this.current_process = process;
    this.current_process.status = States.RUNNING;
  }

  spawn(fun, ...args){
    return this.add_proc(fun, args, false).pid;
  }

  spawn_link(fun, ...args){
    return this.add_proc(fun, args, true).pid; 
  }

  link(pid){
    this.links.get(this.current_process.pid).add(pid);
    this.links.get(pid).add(this.current_process.pid);  
  }

  unlink(pid){
    this.links.get(this.current_process.pid).delete(pid);
    this.links.get(pid).delete(this.current_process.pid);   
  }

  add_proc(fun, args, linked){
    this.process_counter = this.process_counter + 1;
    let newpid = this.process_counter;
    let mailbox = new Mailbox();
    let newproc = new Process(newpid, fun, args, mailbox, this);

    this.pids.set(newpid, newproc);
    this.mailboxes.set(newpid, mailbox);
    this.links.set(newpid, new Set());

    if(linked){
      link(newpid);
    }

    newproc.start();
    return newproc;
  }

  remove_proc(pid, exitreason){
    this.pids.delete(pid);
    this.unregister(pid);
    this.task_queue.removePid(pid);

    for (let linkpid in this.links.get(pid).entries()) {
       linkpid = Number(linkpid);

       if (exitreason != Normal) {
          this.pids.get(linkpid).deliver({ Signal: States.EXIT, From: pid, Reason: exitreason });
       }

       this.links.get(linkpid).delete(pid);
    }

    this.links.delete(pid);
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
    if (typeof(id) === "number") {
       return this.pids.has(id) ? id : null;
    } else if (id instanceof Process) {
       return id.pid;
    } else {
       let pid = this.registered(id);
       if (pid === null)
          throw("Er: Process name not registered: " + 
                id + " (" + typeof(id) + ")");
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
        this.queue(fun);
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
    this.task_queue.queueFuture(this.current_process.pid, time, fun);
  }

  queue(fun){
    this.task_queue.queue(this.current_process.pid, fun);  
  }

  exit(...args){
    switch(args.length) {
    case 2:
       if (args[1] != States.NORMAL) {
          this.mailboxes.get(args[0]).deliver({ Signal: States.EXIT, From: this.pid(), Reason: args[1] });
       }else{
          this.remove_proc(args[0], args[1]);       
       }
       break;
    case 1:
       this.current_process.exit(args[0]);
       break;
    case 0:
       this.current_process.exit(States.Normal);
       break;
    }
  }
}

export default Scheduler;