import Kernel from './kernel';

class Tuple {
  
  constructor(...args){
    this.values = Object.freeze(args);
  }

  get(index) {
    return this.values[index];
  }

  count() {
    return this.values.length;
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator]();
  }

  toString() {
    var i, s = "";
    for (i = 0; i < this.values.length; i++) {
      if (s !== "") {
        s += ", ";
      }
      s += this.values[i].toString();
    }

    return "{" + s + "}";    
  }

  static to_string(tuple){
    return tuple.toString();
  };

  static delete_at(tuple, index){
    let new_list = [];

    for (var i = 0; i < tuple.count(); i++) {
      if(i !== index){
        new_list.push(tuple.get(i));
      }
    }

    return Kernel.SpecialForms.tuple.apply(null, new_list);
  };

  static duplicate(data, size){
    let array = [];

    for (var i = size - 1; i >= 0; i--) {
      array.push(data);
    }

    return Kernel.SpecialForms.tuple.apply(null, array);
  };

  static insert_at(tuple, index, term){
    let new_tuple = [];

    for (var i = 0; i <= tuple.count(); i++) {
      if(i === index){
        new_tuple.push(term);
        i++;
        new_tuple.push(tuple.get(i));
      }else{
        new_tuple.push(tuple.get(i));
      }
    }

    return Kernel.SpecialForms.tuple.apply(null, new_tuple);
  };

  static from_list(list){
    return Kernel.SpecialForms.tuple.apply(null, list);
  };

  static to_list(tuple){
    let new_list = [];

    for (var i = 0; i < tuple.count(); i++) {
      new_list.push(tuple.get(i));
    }

    return Kernel.SpecialForms.list(...new_list);
  };
}

export default Tuple;