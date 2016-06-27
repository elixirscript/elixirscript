import Core from "../lib/core";
const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;
const Tuple = Core.Tuple;

import Enum from "../lib/enum";

import chai from 'chai';
var expect = chai.expect;


describe('case', () => {

  it('case', () => {
    let clauses = [
      Patterns.clause(
        [new Tuple(Symbol.for("selector"), Patterns.variable(), Patterns.variable())],
        function(i, value){ return value; },
        function(i){ return Kernel.is_integer(i); }
      ),
      Patterns.clause(
        [Patterns.variable()],
        function(value){ return value; }
      )
    ];

    let result = SpecialForms._case("thing", clauses);

    expect(result).to.equal("thing");
  });

});
