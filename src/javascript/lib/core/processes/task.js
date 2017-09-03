class Task {
  constructor(pid, func, args, resolver) {
    this.pid = pid;
    this.func = func;
    this.args = args;
    this.resolver = resolver;
  }
}

export default Task;
