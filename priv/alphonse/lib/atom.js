let Atom = function(value){
  if (!(this instanceof Atom)) return new Atom(value);
  this.value = value;
}

Atom.prototype.toString = function () {
  return this.value;
};

Atom.__MODULE_ = Atom('Atom');

export default Atom;