var Patterns = require("../lib/core/patterns");
var Enum = require('../lib/enum');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;


describe('case', () => {

  it('case', () => {
    let clauses = [
      Patterns.make_case(
        [Kernel.SpecialForms.tuple(Symbol.for("selector"), Patterns.variable(), Patterns.variable())],
        function(i, value){ return value; },
        function(i){ return Kernel.is_integer(i); }
      ),
      Patterns.make_case(
        [Patterns.variable()],
        function(value){ return value; }
      )
    ];

    let result = Kernel.SpecialForms._case("thing", clauses);

    expect(result).to.equal("thing");
  });

});
