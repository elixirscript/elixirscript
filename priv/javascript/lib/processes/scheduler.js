"use strict";

//Scheduler. Borrowed and modified from RxJS's Default Scheduler.
//While it is probably more robust, this should fit the needs for
//this project.

if (typeof setImmediate === 'function') {
    var invokeLater = function (callback) { setImmediate(callback); }
} else if (typeof setTimeout === 'function') {
    var invokeLater = function (callback) { setTimeout(callback, 0); }
}

const NOSTATE = Symbol();

class Scheduler {
  constructor(){
    this.nextHandle = 1;
    this.tasks = {}
    this.currentlyRunning = false;    
  }

  clearMethod(handle){
    delete this.tasks[handle];
  }

  removePid(pid){
    //prevent further execution while removing tasks
    //with matching pids
    this.currentlyRunning = true;

    for(let handle in Object.keys(this.tasks)){
      if(this.tasks[handle] && this.tasks[handle][0] === pid){
        clearMethod(handle);
      }
    }

    this.currentlyRunning = false;
  }

  runTask(handle){
    if (this.currentlyRunning) {
      invokeLater(() => { this.runTask(handle); });
    } else {
      if(this.tasks[handle]){

        let [pid, task] = this.tasks[handle];

        if (task) {
          this.currentlyRunning = true;

          let result;

          try{
            result = task();
          }catch(e){
            result = e;
          }

          this.clearMethod(handle);
          this.currentlyRunning = false;

          if (result instanceof Error) {
            throw result;
          }
        }

      }
    }
  }

  scheduleMethod(pid, action) {
    let id = this.nextHandle++;
    this.tasks[id] = [ pid, action ];
    invokeLater(() => { this.runTask(id); });

    return id;
  };

  schedule(pid, action, state = NOSTATE){
    this.scheduleMethod(pid, () => {
      if(state === NOSTATE){
        action();
      }else{
        action(state);
      }
    });
  }

  scheduleFuture(pid, dueTime, action, state = NOSTATE){
    if (dueTime === 0) { return this.schedule(pid, state, action); }

    setTimeout(pid, () => {
      if(state === NOSTATE){
        action();
      }else{
        action(state);
      }
    }, dueTime);
  }

}

export default Scheduler;