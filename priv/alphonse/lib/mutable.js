import Atom from './atom';

let Mutable = {
  __MODULE__: Atom('Mutable'),

  update: function(obj, prop, value){
    obj[prop] = value;
  }
};

export default Mutable;
