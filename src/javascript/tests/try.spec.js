var Patterns = require("../lib/core/patterns");
var Enum = require('../lib/enum');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;


describe('try', () => {

  it('try', () => {
    /*
      try do
        1 / x
      else
        y when y < 1 and y > -1 ->
          :small
        _ ->
          :large
      end

    */

    let x = 1;

    let value = Kernel.SpecialForms._try(function() {
        return 1 / x;
    }, null, null, Patterns.defmatch(Patterns.make_case([Patterns.variable()], function(y) {
        return Kernel.SpecialForms.atom('small');
    }, function(y) {
        return (y < 1) && (y > -1);
    }), Patterns.make_case([Patterns.wildcard()], function() {
        return Kernel.SpecialForms.atom('large');
    })), null)

    expect(value).to.equal(Kernel.SpecialForms.atom('large'));
  });

});
