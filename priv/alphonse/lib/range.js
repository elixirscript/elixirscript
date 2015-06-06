import Atom from './atom';

let Range = function(first, last){
  if (!(this instanceof Range)){
    return new Range(first, last);
  }

  this.first = first;
  this.last = last;
  this.range = [];

  for(let i = first; i <= last; i++){
    this.range.push(i);
  }

  this.length = this.range.length;
};

Range.__MODULE__ = Atom('Range');

Range.new = function (first, last) {
  return Range(first, last);
};

Range["range?"] = function (range) {
  return range instanceof Range;
};

export default Range;
