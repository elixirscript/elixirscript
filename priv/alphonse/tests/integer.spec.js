var Integer = require('../lib/integer');
var Atom = require('../lib/atom');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;

describe('Integer', function(){
  it('parses integer string to integer', function(){
    let result = Integer.parse("34");
    expect(result[0]).to.equal(34);
    expect(result[1]).to.equal("");
  })

  it('parses float string to integer', function(){
    let result = Integer.parse("34.5");
    expect(result[0]).to.equal(34);
    expect(result[1]).to.equal(".5");
  })

  it('returns error when invalid', function(){
    let result = Integer.parse("three");
    expect(Kernel.match__qmark__(result[0], Atom('error'))).to.equal(true);
  })
})

