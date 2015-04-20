let Atom = function(value){
  if (!(this instanceof Atom)) return new Atom(value);
  this.value = value;
}

Atom.prototype.toString = function () {
  return this.value;
};

Atom.__MODULE_ = [Atom('Atom')];

Atom.to_string = function (atom) {
  return atom.toString();
};

Atom.to_char_list = function (atom) {
  let char_list = [];

  for(let i = 0; i < atom.value.length; i++){
    char_list.push(atom.value.charAt(i));
  }

  return char_list;
};

export default Atom;