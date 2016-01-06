var Patterns = require("../lib/core/patterns");
var Enum = require('../lib/enum');
var Tuple = require('../lib/core').Tuple;
var SpecialForms = require('../lib/core').SpecialForms;
var expect = require('chai').expect;


describe('case', () => {

  it('case', () => {
    let clauses = [
      Patterns.make_case(
        [new Tuple(Symbol.for("selector"), Patterns.variable(), Patterns.variable())],
        function(i, value){ return value; },
        function(i){ return Kernel.is_integer(i); }
      ),
      Patterns.make_case(
        [Patterns.variable()],
        function(value){ return value; }
      )
    ];

    let result = SpecialForms._case("thing", clauses);

    expect(result).to.equal("thing");
  });

});
