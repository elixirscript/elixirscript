/* @flow */
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

class PostOffice {
  mailboxes: Map;
  subscribers: Map;

  constructor(){
    this.mailboxes = new Map();
    this.subscribers = new Map();
  }

  send(address: Symbol, message: any): void {
    this.mailboxes = update(this.mailboxes, address, this.mailboxes.get(address).concat([message]));

    if(this.subscribers.get(address)){
      this.subscribers.get(address)();
    }
  }

  receive(address: Symbol): any {
    let result = this.mailboxes.get(address)[0];

    this.mailboxes = update(this.mailboxes, address, this.mailboxes.get(address).slice(1));
    return result;
  }

  peek(address: Symbol): any {
    return this.mailboxes.get(address)[0];
  }

  add_mailbox(address: Symbol = Symbol()): Symbol {
    this.mailboxes = update(this.mailboxes, address, []);
    return address;
  }

  remove_mailbox(address: Symbol): void {
    this.mailboxes = remove(this.mailboxes, address);
  }

  subscribe(address: Symbol, subscribtion_fn: Function): void {
    this.subscribers = update(this.subscribers, address, subscribtion_fn);
  }

  unsubscribe(address: Symbol): void {
    this.subscribers = remove(this.subscribers, address);
  }
}

export default PostOffice