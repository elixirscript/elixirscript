var Range = require('../lib/range');
var expect = require('chai').expect;

describe('Range', function(){

  describe('new', function(){
    it('must create a new Range', function(){
      let range = Range.new(0,2);
      console.log(range);
      expect(range.first()).to.equal(0);
      expect(range.last()).to.equal(2);
      expect(range.length()).to.equal(3);
    })
  })
})

