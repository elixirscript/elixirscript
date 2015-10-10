"use strict";

//TaskQueue. Borrowed and modified from RxJS's Default Scheduler.
//While it is probably more robust, this should fit the needs for
//this project.

class TaskQueue {
  constructor(throttle = 0){
    this.nextTaskId = 1;
    this.tasks = {}
    this.isRunning = false;
    this.invokeLater = function (callback) { setTimeout(callback, throttle); }
  }

  removeFromTaskQueue(taskId){
    delete this.tasks[taskId];
  }

  removePid(pid){
    //prevent further execution while removing tasks
    //with matching pids
    this.isRunning = true;

    for(let taskId of Object.keys(this.tasks)){
      if(this.tasks[taskId] && this.tasks[taskId][0] === pid){
        this.removeFromTaskQueue(taskId);
      }
    }

    this.isRunning = false;
  }

  runTask(taskId){
    if (this.isRunning) {
      this.invokeLater(() => { this.runTask(taskId); });
    } else {
      if(this.tasks[taskId]){

        let [pid, task] = this.tasks[taskId];

        if (task) {
          this.isRunning = true;

          let result;

          try{
            result = task();
          }catch(e){
            result = e;
          }

          this.removeFromTaskQueue(taskId);
          this.isRunning = false;

          if (result instanceof Error) {
            throw result;
          }
        }

      }
    }
  }

  addToTaskQueue(pid, task, dueTime = 0) {
    let id = this.nextTaskId ++;
    this.tasks[id] = [ pid, task ];

    if(dueTime === 0){
      this.invokeLater(() => { this.runTask(id); });
    }else{
      setTimeout(() => { this.runTask(id); }, dueTime);      
    }

    return id;
  };

  queue(pid, task){
    this.addToTaskQueue(pid, () => { task(); });
  }

  queueFuture(pid, dueTime, task){
    this.addToTaskQueue(pid, () => { task(); }, dueTime);
  }
}

export default TaskQueue;