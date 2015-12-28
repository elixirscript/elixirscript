/* @flow */
"use strict";

import Mailbox from "./mailbox";
import Process from "./process";
import States from "./states";
import * as Primitives from "../primitives";

class ProcessSystem {

  constructor(){
    this.pids = new Map();
    this.mailboxes = new Map();
    this.names = new Map();
    this.links = new Map();

    this.current_process = null;
    this.suspended = new Map();

    this.main_process_pid = this.spawn();
    this.set_current(this.main_process_pid);
  }

  spawn(){
    return this.add_proc(false).pid;
  }

  spawn_link(){
    return this.add_proc(true).pid;
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

  add_proc(linked){
    let newpid = new Primitives.PID();
    let mailbox = new Mailbox();
    let newproc = new Process(newpid, mailbox);

    this.pids.set(newpid, newproc);
    this.mailboxes.set(newpid, mailbox);
    this.links.set(newpid, new Set());

    if(linked){
      this.link(newpid);
    }

    return newproc;
  }

  remove_proc(pid){
    this.pids.delete(pid);
    this.unregister(pid);

    if(this.links.has(pid)){
      for (let linkpid of this.links.get(pid)) {
        this.links.get(linkpid).delete(pid);
      }

      this.links.delete(pid);
    }
  }

  exit(id){
    let pid = this.pidof(id);
    this.remove_proc(id);
  }

  register(name, pid){
    if(!this.names.has(name)){
      this.names.set(name, pid)
      return name;
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
    if (id instanceof Primitives.PID) {
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

  put(id, key, value){
    let pid = this.pidof(id);
    let process = this.pids.get(pid);
    process.dict[key] = value;
  }

  get(id, key){
    let pid = this.pidof(id);
    let process = this.pids.get(pid);

    if(key != null){
      return process.dict[key];
    }else{
      return process.dict;
    }
  }

  get_keys(id){
    let pid = this.pidof(id);
    let process = this.pids.get(pid);

    return Object.keys(process.dict);
  }

  erase(id, key){
    let pid = this.pidof(id);
    let process = this.pids.get(pid);

    if(key != null){
      delete process.dict[key];
    }else{
      process.dict = {};
    }
  }
}

export default ProcessSystem;
