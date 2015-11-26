/* @flow */

import SpecialForms from './kernel/special_forms';
import List from './list';
import Enum from './enum';

class Signal {
  bindings: Array<SignalBinding>;

  constructor() {
    this.bindings = SpecialForms.list();
  }

  add(listener: Function, context: any = this): void {
    this.bindings = List.append(this.bindings, new SignalBinding(this, listener, context));
  }

  remove(listener: Function): void {
    this.bindings = Enum.filter(this.bindings, function(binding){
      return binding.listener !== listener;
    });
  }

  dispatch(...params: Array<any>): void {
    for(let binding of this.bindings){
      binding.execute(...params);
    }
  }

  dispose(): void {
    for(let binding of this.bindings){
      binding.dispose();
    }

    this.bindings = null;
  }
}

class SignalBinding {
  listener: Function;
  signal: Signal;
  context: any;

  constructor(signal: Signal, listener: Function, context: any){
    this.listener = listener;
    this.signal = signal;
    this.context = context;
  }

  execute(...params: Array<any>): void {
    this.listener.apply(this.context, params);
  }

  dispose(): void {
    this.listener = null;
    this.signal = null;
    this.context = null;
  }
}

export default Signal;