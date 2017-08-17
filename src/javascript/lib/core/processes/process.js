import States from './states';
import Core from '../../core';

function is_sleep(value) {
  return Array.isArray(value) && value[0] === States.SLEEP;
}

function is_receive(value) {
  return Array.isArray(value) && value[0] === States.RECEIVE;
}

function receive_timed_out(value) {
  return value[2] != null && value[2] < Date.now();
}

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

  start() {
    const function_scope = this;
    console.log('HERE!!!!');
    const machine = new Core.Functions.Recurse(this.main.bind(null, []));

    this.system.schedule(() => {
      function_scope.system.set_current(function_scope.pid);
      function_scope.run(machine);
    }, this.pid);
  }

  main() {
    let retval = States.NORMAL;

    try {
      this.func.apply(null, this.args);
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
    return (
      this.flags[Symbol.for('trap_exit')] &&
      this.flags[Symbol.for('trap_exit')] === true
    );
  }

  signal(reason) {
    if (reason !== States.NORMAL) {
      console.error(reason);
    }

    this.system.remove_proc(this.pid, reason);
  }

  receive(fun) {
    let value = States.NOMATCH;
    const messages = this.mailbox.get();

    for (let i = 0; i < messages.length; i++) {
      try {
        value = fun(messages[i]);
        if (value !== States.NOMATCH) {
          this.mailbox.removeAt(i);
          break;
        }
      } catch (e) {
        if (e.constructor.name !== 'MatchError') {
          this.exit(e);
        }
      }
    }

    return value;
  }

  run(f) {
    const currentValue = f;

    if (currentValue && currentValue instanceof Recurse) {
      const function_scope = this;

      if (is_sleep(currentValue)) {
        this.system.delay(() => {
          function_scope.system.set_current(function_scope.pid);
          function_scope.run(currentValue);
        }, value[1]);
      } else if (is_receive(currentValue) && receive_timed_out(currentValue)) {
        const result = currentValue[3]();

        this.system.schedule(() => {
          function_scope.system.set_current(function_scope.pid);
          function_scope.run(currentValue.receivedTimedOut(result));
        });
      } else if (is_receive(currentValue)) {
        const result = function_scope.receive(currentValue[1]);

        if (result === States.NOMATCH) {
          this.system.suspend(() => {
            function_scope.system.set_current(function_scope.pid);
            function_scope.run(currentValue);
          });
        } else {
          this.system.schedule(() => {
            function_scope.system.set_current(function_scope.pid);
            function_scope.run(currentValue.received(result));
          });
        }
      } else {
        this.system.schedule(() => {
          function_scope.system.set_current(function_scope.pid);
          function_scope.run(currentValue.received(value));
        });
      }
    }
  }
}

export default Process;
