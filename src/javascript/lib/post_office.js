/* @flow */
import Signal from './signals';

function update(map: Map, key: Symbol, value: any): Map {
  let m = new Map(map);
  m.set(key, value);
  return m;
}

function remove(map: Map, key: Symbol): Map {
  let m = new Map(map);
  m.delete(key);
  return m;
}

class MailBox {
  signal: Signal;
  messages: Array<any>;

  constructor(context: any = this){
    this.signal = new Signal();
    this.signal.add((...params) => this.messages = this.messages.concat(params), context);
    this.messages = [];
  }

  receive(...messages){
    this.signal.dispatch(...messages);
  }

  peek(){
    if(this.messages.length === 0){
      return null;
    }

    return this.messages[0];
  }

  read(){
    let result = this.messages[0];
    this.messages = this.messages.slice(1);

    return result;
  }

  add_subscriber(fn: Function, context: any = this){
    this.signal.add(fn, context);
  }

  remove_subscriber(fn: Function){
    this.signal.remove(fn);
  }

  dispose(){
    this.signal.dispose();
    this.messages = null;
  }
}


class PostOffice {
  mailboxes: Map;

  constructor(){
    this.mailboxes = new Map();
  }

  send(address: Symbol, message: any): void {
    this.mailboxes.get(address).receive(message);
  }

  receive(address: Symbol): any {
    return this.mailboxes.get(address).read();
  }

  peek(address: Symbol): any {
    return this.mailboxes.get(address).peek();
  }

  add_mailbox(address: Symbol = Symbol(), context: any = this): Symbol {
    this.mailboxes = update(this.mailboxes, address, new MailBox());
    return address;
  }

  remove_mailbox(address: Symbol): void {
    this.mailboxes.get(address).dispose();
    this.mailboxes = remove(this.mailboxes, address);
  }

  subscribe(address: Symbol, subscribtion_fn: Function, context: any = this ): void {
    this.mailboxes.get(address).add_subscriber(subscribtion_fn, context);    
  }

  unsubscribe(address: Symbol, subscribtion_fn: Function): void {
    this.mailboxes.get(address).remove_subscriber(subscribtion_fn);   
  }
}

export default PostOffice