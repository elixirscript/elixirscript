import ErlangTypes from 'erlang-types';
import Mailbox from './mailbox';
import Process from './process';
import States from './states';
import Scheduler from './scheduler';

class ProcessSystem {
  constructor() {
    this.pids = new Map();
    this.mailboxes = new Map();
    this.names = new Map();
    this.links = new Map();
    this.monitors = new Map();

    const throttle = 5; // ms between scheduled tasks
    this.current_process = null;
    this.scheduler = new Scheduler(throttle);
    this.suspended = new Map();

    this.main_process_pid = new ErlangTypes.PID();
    this.set_current(this.main_process_pid);
  }

  spawn(...args) {
    if (args.length === 1) {
      const fun = args[0];
      return this.add_proc(fun, [], false).pid;
    }
    const mod = args[0];
    const fun = args[1];
    const the_args = args[2];

    return this.add_proc(mod[fun], the_args, false, false).pid;
  }

  spawn_link(...args) {
    if (args.length === 1) {
      const fun = args[0];
      return this.add_proc(fun, [], true, false).pid;
    }

    const mod = args[0];
    const fun = args[1];
    const the_args = args[2];

    return this.add_proc(mod[fun], the_args, true, false).pid;
  }

  link(pid) {
    this.links.get(this.pid()).add(pid);
    this.links.get(pid).add(this.pid());
  }

  unlink(pid) {
    this.links.get(this.pid()).delete(pid);
    this.links.get(pid).delete(this.pid());
  }

  spawn_monitor(...args) {
    if (args.length === 1) {
      const fun = args[0];
      const process = this.add_proc(fun, [], false, true);
      return [process.pid, process.monitors[0]];
    }

    const mod = args[0];
    const fun = args[1];
    const the_args = args[2];
    const process = this.add_proc(mod[fun], the_args, false, true);

    return [process.pid, process.monitors[0]];
  }

  monitor(pid) {
    const real_pid = this.pidof(pid);
    const ref = this.make_ref();

    if (real_pid) {
      this.monitors.set(ref, {
        monitor: this.current_process.pid,
        monitee: real_pid
      });
      this.pids.get(real_pid).monitors.push(ref);
      return ref;
    }

    this.send(
      this.current_process.pid,
      new ErlangTypes.Tuple('DOWN', ref, pid, real_pid, Symbol.for('noproc'))
    );
    return ref;
  }

  demonitor(ref) {
    if (this.monitor.has(ref)) {
      this.monitor.delete(ref);
      return true;
    }

    return false;
  }

  set_current(id) {
    const pid = this.pidof(id);
    if (pid !== null) {
      this.current_process = this.pids.get(pid);
      this.current_process.status = States.RUNNING;
    }
  }

  add_proc(fun, args, linked, monitored) {
    const newpid = new ErlangTypes.PID();
    const mailbox = new Mailbox();
    const newproc = new Process(newpid, fun, args, mailbox, this);

    this.pids.set(newpid, newproc);
    this.mailboxes.set(newpid, mailbox);
    this.links.set(newpid, new Set());

    if (linked) {
      this.link(newpid);
    }

    if (monitored) {
      this.monitor(newpid);
    }

    newproc.start();
    return newproc;
  }

  remove_proc(pid, exitreason) {
    this.pids.delete(pid);
    this.unregister(pid);
    this.scheduler.removePid(pid);

    if (this.links.has(pid)) {
      for (const linkpid of this.links.get(pid)) {
        this.exit(linkpid, exitreason);
        this.links.get(linkpid).delete(pid);
      }

      this.links.delete(pid);
    }
  }

  register(name, pid) {
    if (!this.names.has(name)) {
      this.names.set(name, pid);
    } else {
      throw new Error('Name is already registered to another process');
    }
  }

  whereis(name) {
    return this.names.has(name) ? this.names.get(name) : null;
  }

  registered() {
    return this.names.keys();
  }

  unregister(pid) {
    for (const name of this.names.keys()) {
      if (this.names.has(name) && this.names.get(name) === pid) {
        this.names.delete(name);
      }
    }
  }

  pid() {
    return this.current_process
      ? this.current_process.pid
      : this.main_process_pid;
  }

  pidof(id) {
    if (id instanceof ErlangTypes.PID) {
      return this.pids.has(id) ? id : null;
    } else if (id instanceof Process) {
      return id.pid;
    }

    const pid = this.whereis(id);
    if (pid === null) {
      throw `Process name not registered: ${id} (${typeof id})`;
    }

    return pid;
  }

  send(id, msg) {
    const pid = this.pidof(id);

    if (pid) {
      this.mailboxes.get(pid).deliver(msg);

      if (this.suspended.has(pid)) {
        const fun = this.suspended.get(pid);
        this.suspended.delete(pid);
        this.schedule(fun);
      }
    }

    return msg;
  }

  receive(fun, timeout = 0, timeoutFn = () => true) {
    let DateTimeout = null;

    if (timeout === 0 || timeout === Infinity) {
      DateTimeout = null;
    } else {
      DateTimeout = Date.now() + timeout;
    }

    return [States.RECEIVE, fun, DateTimeout, timeoutFn];
  }

  sleep(duration) {
    return [States.SLEEP, duration];
  }

  suspend(fun) {
    this.current_process.status = States.SUSPENDED;
    this.suspended.set(this.current_process.pid, fun);
  }

  delay(fun, time) {
    this.current_process.status = States.SLEEPING;

    if (Number.isInteger(time)) {
      this.scheduler.scheduleFuture(this.current_process.pid, time, fun);
    }
  }

  schedule(fun, pid) {
    const the_pid = pid != null ? pid : this.current_process.pid;
    this.scheduler.schedule(the_pid, fun);
  }

  exit(one, two) {
    let pid = null;
    let reason = null;
    let process = null;

    if (two) {
      pid = one;
      reason = two;
      process = this.pids.get(this.pidof(pid));

      if (
        (process && process.is_trapping_exits()) ||
        reason === States.KILL ||
        reason === States.NORMAL
      ) {
        this.mailboxes
          .get(process.pid)
          .deliver(new ErlangTypes.Tuple(States.EXIT, this.pid(), reason));
      } else {
        process.signal(reason);
      }
    } else {
      pid = this.current_process.pid;
      reason = one;
      process = this.current_process;

      process.signal(reason);
    }

    for (const ref in process.monitors) {
      const mons = this.monitors.get(ref);
      this.send(
        mons.monitor,
        new ErlangTypes.Tuple('DOWN', ref, mons.monitee, mons.monitee, reason)
      );
    }
  }

  error(reason) {
    this.current_process.signal(reason);
  }

  process_flag(...args) {
    if (args.length === 2) {
      const flag = args[0];
      const value = args[1];
      return this.current_process.process_flag(flag, value);
    }

    const pid = this.pidof(args[0]);
    const flag = args[1];
    const value = args[2];
    return this.pids.get(pid).process_flag(flag, value);
  }

  put(key, value) {
    this.current_process.dict[key] = value;
  }

  get_process_dict() {
    return this.current_process.dict;
  }

  get(key, default_value = null) {
    if (key in this.current_process.dict) {
      return this.current_process.dict[key];
    }

    return default_value;
  }

  get_keys(value) {
    if (value) {
      const keys = [];

      for (const key of Object.keys(this.current_process.dict)) {
        if (this.current_process.dict[key] === value) {
          keys.push(key);
        }
      }

      return keys;
    }

    return Object.keys(this.current_process.dict);
  }

  erase(key) {
    if (key != null) {
      delete this.current_process.dict[key];
    } else {
      this.current_process.dict = {};
    }
  }

  is_alive(pid) {
    const real_pid = this.pidof(pid);
    return real_pid != null;
  }

  list() {
    return Array.from(this.pids.keys());
  }

  make_ref() {
    return new ErlangTypes.Reference();
  }
}

export default ProcessSystem;
