var Immutable = require("../lib/immutable/immutable");
var Patterns = require("../lib/patterns/patterns");
var Enum = require('../lib/enum');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;


describe('case', () => {

  it('case', () => {
    let clauses = Immutable.fromJS([
      {
        pattern: [Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("selector"), Patterns.variable(), Patterns.variable())],
        guard: function(i){ return Kernel.is_integer(i); },
        fn: function(i, value){ return value; }
      },
      {
          pattern: [Patterns.variable()],
          fn: function(value){ return value; }
      }    
    ]);

    let result = Kernel.SpecialForms._case("thing", clauses);

    expect(result).to.equal("thing");
  });

});