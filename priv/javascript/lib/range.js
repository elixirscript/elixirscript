import Immutable from './immutable/immutable';

let Range = {};

Range.new = function (first, last) {
  return Immutable.Range(first, last);
};

Range.range__qmark__ = function (range) {
  return range instanceof Immutable.Range;
};

export default Range;
