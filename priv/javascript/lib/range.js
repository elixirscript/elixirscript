import Erlang from './erlang';

let Range = function(_first, _last){
  if (!(this instanceof Range)){
    return new Range(_first, _last);
  }

  this.first = function(){
    return _first;
  };

  this.last = function(){
    return _last;
  };

  let _range = [];

  for(let i = _first; i <= _last; i++){
    _range.push(i);
  }

  _range = Object.freeze(_range);

  this.value = function(){
    return _range;
  };

  this.length = function(){
    return _range.length;
  };

  return this;
};

Range.__MODULE__ = Erlang.atom('Range');

Range.prototype[Symbol.iterator] = function(){
  return this.value()[Symbol.iterator]();
};

Range.new = function (first, last) {
  return Range(first, last);
};

Range.range__qmark__ = function (range) {
  return range instanceof Range;
};

export default Range;
