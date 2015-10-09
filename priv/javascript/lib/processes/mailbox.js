"use strict";

/* @flow */

class Mailbox{
  messages: Array<any>

  constructor(){
    this.messages = [];
  }

  deliver(message: any){
    this.messages.push(message);
    return message;
  }

  get(){
    return this.messages;
  }

  isEmpty(){
    return this.messages.length === 0;
  }

  removeAt(index){
    this.messages.splice(index, 1);
  }
}

export default Mailbox;