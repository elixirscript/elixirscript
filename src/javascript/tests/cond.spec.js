var Patterns = require("../lib/core/patterns");
var Enum = require('../lib/enum');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;


describe('cond', () => {

  it('cond', () => {
    let clauses = [
      [ 1 + 1 == 1,  () => "This will never match"],
      [ 2 * 2 != 4,  () => "Nor this"],
      [ true,  () => "This will"],
    ];

    let result = Kernel.SpecialForms.cond(clauses);

    expect(result).to.equal("This will");
  });

});
