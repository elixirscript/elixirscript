var Patterns = require("../lib/core/patterns");
var Enum = require('../lib/enum');
var Kernel = require('../lib/kernel');
var SpecialForms = require('../lib/core').SpecialForms;
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

    let value = SpecialForms._try(function() {
        return 1 / x;
    }, null, null, Patterns.defmatch(Patterns.make_case([Patterns.variable()], function(y) {
        return Symbol.for('small');
    }, function(y) {
        return (y < 1) && (y > -1);
    }), Patterns.make_case([Patterns.wildcard()], function() {
        return Symbol.for('large');
    })), null)

    expect(value).to.equal(Symbol.for('large'));
  });

});
