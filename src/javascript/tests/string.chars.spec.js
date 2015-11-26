var String = require('../lib/string');
var Tuple = require('../lib/tuple');
var expect = require('chai').expect;

describe('String.Chars', function(){

    it('to_string', function(){
      expect(String.Chars.to_string(1)).to.equal("1");
      expect(String.Chars.to_string("a string")).to.equal("a string");
      expect(String.Chars.to_string(new Tuple(1, 2, 3))).to.equal("{1, 2, 3}");
      expect(String.Chars.to_string([1, 2, 3])).to.equal("1,2,3");
    });

});