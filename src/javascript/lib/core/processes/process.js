import States from './states';
import Core from '../../core';

class Process {
  constructor(pid, func, args, mailbox, system) {
    this.pid = pid;
    this.func = func;
    this.args = args;
    this.mailbox = mailbox;
    this.system = system;
    this.status = States.STOPPED;
    this.dict = {};
    this.flags = {};
    this.monitors = [];
  }

  async start() {
    let retval = States.NORMAL;

    try {
      await this.system.pause(this.pid);
      await this.func.apply(null, this.args);
    } catch (e) {
      console.error(e);
      retval = e;
    }

    this.system.exit(retval);
  }

  process_flag(flag, value) {
    const old_value = this.flags[flag];
    this.flags[flag] = value;
    return old_value;
  }

  is_trapping_exits() {
    return this.flags[Symbol.for('trap_exit')] && this.flags[Symbol.for('trap_exit')] === true;
  }

  signal(reason) {
    if (reason !== States.NORMAL) {
      console.error(reason);
    }

    this.system.remove_proc(this.pid, reason);
  }

  // TODO figure out what to do with receive
  async receive(clauses) {
    const messages = this.mailbox.get();

    for (let i = 0; i < messages.length; i++) {
      for (const clause of clauses) {
        const value = await Core.Patterns.match_or_default_async(
          clause[0].pattern,
          messages[i],
          clause[0].guard,
          States.NOMATCH,
        );

        if (value !== States.NOMATCH) {
          this.mailbox.removeAt(i);
          return clause[1].apply(null, value);
        }
      }
    }

    return States.NOMATCH;
  }
}

export default Process;
