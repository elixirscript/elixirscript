"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Atom = undefined;

Atom = function (_value) {
  return Symbol["for"](_value);
};

Atom.__MODULE__ = Atom("Atom");

Atom.to_string = function (atom) {
  var atomString = atom.toString();
  var indexOfOpenParen = atomString.indexOf("(");
  var indexOfCloseParen = atomString.lastIndexOf(")");
  return atomString.substring(indexOfOpenParen + 1, indexOfCloseParen);
};

Atom.to_char_list = function (atom) {
  var char_list = [];

  var atomString = Atom.to_string(atom);

  for (var i = 0; i < atomString.length; i++) {
    char_list.push(atomString.charAt(i));
  }

  return char_list;
};

exports["default"] = Atom;
module.exports = exports["default"];