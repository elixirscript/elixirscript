import Core from "../lib/core";
const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;

import Enum from "../lib/enum";

import chai from 'chai';
var expect = chai.expect;


describe('cond', () => {

  it('cond', () => {
    let clauses = [
      [ 1 + 1 == 1,  () => "This will never match"],
      [ 2 * 2 != 4,  () => "Nor this"],
      [ true,  () => "This will"],
    ];

    let result = SpecialForms.cond(clauses);

    expect(result).to.equal("This will");
  });

});
