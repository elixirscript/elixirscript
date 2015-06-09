import Tuple from './tuple';
import Atom from './atom';

let Integer = {
  __MODULE__: Atom('Integer'),

  is_even: function(n){
    return n % 2 === 0;
  },

  is_odd: function(n){
    return n % 2 !== 0;
  },

  parse: function(bin){
    let result = parseInt(bin);

    if(isNaN(result)){
      return Atom('error');
    }

    let indexOfDot = bin.indexOf(".");

    if(indexOfDot >= 0){
      return Tuple(result, bin.substring(indexOfDot));
    }

    return Tuple(result, "");

  }
};

export default Integer;
