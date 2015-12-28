"use strict";

/* @flow */
import Mailbox from "./mailbox";
import States from "./states";

class Process {
  pid: Number;
  mailbox: Mailbox;
  dict: Object;

  constructor(pid: Number, mailbox: Mailbox){
    this.pid = pid;
    this.mailbox = mailbox;
    this.status = States.STOPPED;
    this.dict = {};
  }
}

export default Process;
