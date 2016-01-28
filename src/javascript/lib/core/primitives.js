class Tuple {

  constructor(...args){
    this.values = Object.freeze(args);
    this.length = this.values.length;
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

  put_elem(index, elem){
      let new_values = this.values.concat([]);
      new_values.splice(index, 0, elem);
      return new Tuple(...new_values);
  }

}


let process_counter = -1;

class PID {
  constructor(){
    process_counter = process_counter + 1;
    this.id = process_counter;
  }

  toString(){
    return "PID#<0." + this.id + ".0>";
  }
}

class Integer {}
class Float {}

export { PID, Tuple, Integer, Float };
