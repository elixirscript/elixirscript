import Kernel from './kernel';

let Integer = {

  is_even: function(n){
    return n % 2 === 0;
  },

  is_odd: function(n){
    return n % 2 !== 0;
  },

  parse: function(bin){
    let result = parseInt(bin);

    if(isNaN(result)){
      return Kernel.SpecialForms.atom("error");
    }

    let indexOfDot = bin.indexOf(".");

    if(indexOfDot >= 0){
      return Kernel.SpecialForms.tuple(result, bin.substring(indexOfDot));
    }

    return Kernel.SpecialForms.tuple(result, "");
  },

  to_char_list: function(number, base = 10){
    return number.toString(base).split('');
  },

  to_string: function(number, base = 10){
    return number.toString(base);
  }
};

export default Integer;
