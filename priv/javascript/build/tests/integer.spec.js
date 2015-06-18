'use strict';

var Integer = require('../lib/integer');
var Atom = require('../lib/atom');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;

describe('Integer', function () {
  it('parses integer string to integer', function () {
    var result = Integer.parse('34');
    expect(result.get(0)).to.equal(34);
    expect(result.get(1)).to.equal('');
  });

  it('parses float string to integer', function () {
    var result = Integer.parse('34.5');
    expect(result.get(0)).to.equal(34);
    expect(result.get(1)).to.equal('.5');
  });

  it('returns error when invalid', function () {
    var result = Integer.parse('three');
    expect(Kernel.match__qmark__(result, Atom('error'))).to.equal(true);
  });

  it('converts base 10 integer to char_list', function () {
    var result = Integer.to_char_list(7);
    expect(Kernel.match__qmark__(result, ['7'])).to.equal(true);
  });

  it('converts base 16 integer to char_list', function () {
    var result = Integer.to_char_list(1023, 16);
    expect(Kernel.match__qmark__(result, ['3', 'f', 'f'])).to.equal(true);
  });
});