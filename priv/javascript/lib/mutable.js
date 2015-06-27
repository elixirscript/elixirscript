import Erlang from './erlang';

let Mutable = {
  __MODULE__: Erlang.atom('Mutable'),

  update: function(obj, prop, value){
    obj[prop] = value;
  }
};

export default Mutable;
