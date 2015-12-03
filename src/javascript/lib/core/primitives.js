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

export default { PID, Tuple };
