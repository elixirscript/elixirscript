class ProcessQueue {
  constructor(pid) {
    this.pid = pid;
    this.tasks = [];
  }

  empty() {
    return this.tasks.length === 0;
  }

  add(task) {
    this.tasks.push(task);
  }

  next() {
    return this.tasks.shift();
  }
}

class Scheduler {
  constructor(system, reductions_per_process = 8) {
    this.isRunning = false;
    this.invokeLater = (callback) => {
      setTimeout(callback, 0);
    };

    this.system = system;

    // In our case a reduction is equal to a task call
    // Controls how many tasks are called at a time per process
    this.reductions_per_process = reductions_per_process;
    this.queues = new Map();
    this.run();
  }

  addToQueue(pid, task) {
    if (!this.queues.has(pid)) {
      this.queues.set(pid, new ProcessQueue(pid));
    }

    this.queues.get(pid).add(task);
  }

  removePid(pid) {
    this.isRunning = true;

    this.queues.delete(pid);

    this.isRunning = false;
  }

  run() {
    if (this.isRunning) {
      this.invokeLater(() => {
        this.run();
      });
    } else {
      for (const [pid, queue] of this.queues) {
        let reductions = 0;
        while (queue && !queue.empty() && reductions < this.reductions_per_process) {
          const resolver = queue.next();
          this.isRunning = true;

          resolver(true);
          this.system.set_current(pid);
          console.log(`Scheduler ${pid}`);
          this.isRunning = false;
          reductions++;
        }
      }

      this.invokeLater(() => {
        this.run();
      });
    }
  }

  pause(pid, resolver) {
    this.addToQueue(pid, resolver);
  }

  schedule(pid, fun, args, resolver) {
    this.addToQueue(pid, [fun, args, resolver]);
  }
}

export default Scheduler;
