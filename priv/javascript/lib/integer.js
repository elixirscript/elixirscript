import Erlang from './erlang';

let Integer = {
  __MODULE__: Erlang.atom('Integer'),

  is_even: function(n){
    return n % 2 === 0;
  },

  is_odd: function(n){
    return n % 2 !== 0;
  },

  parse: function(bin){
    let result = parseInt(bin);

    if(isNaN(result)){
      return Erlang.atom("error");
    }

    let indexOfDot = bin.indexOf(".");

    if(indexOfDot >= 0){
      return Erlang.tuple(result, bin.substring(indexOfDot));
    }

    return Erlang.tuple(result, "");
  },

  to_char_list: function(number, base = 10){
    return number.toString(base).split('');
  },

  to_string: function(number, base = 10){
    return number.toString(base);
  }
};

export default Integer;
