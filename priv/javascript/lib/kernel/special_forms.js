import Erlang from '../erlang';

let SpecialForms = {
  __MODULE__: Erlang.atom('SpecialForms'),

  __DIR__: function(){
    if(__dirname){
      return __dirname;
    }

    if(document.currentScript){
      return document.currentScript.src;
    }

    return null;
  },

  receive: function(receive_fun, timeout_in_ms = null, timeout_fn = (time) => true){
    if (timeout_in_ms == null || timeout_in_ms === System.for('infinity')) {
      while(true){
        if(self.mailbox.length !== 0){
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }
    }else if(timeout_in_ms === 0){
      if(self.mailbox.length !== 0){
        let message = self.mailbox[0];
        self.mailbox = self.mailbox.slice(1);
        return receive_fun(message);
      }else{
        return null;
      }
    }else{
      let now = Date.now();
      while(Date.now() < (now + timeout_in_ms)){
        if(self.mailbox.length !== 0){
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }

      return timeout_fn(timeout_in_ms);
    }
  }
};

export default SpecialForms;
