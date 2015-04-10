var Tuple = require('../lib/tuple');
var List = require('../lib/tuple');
var expect = require('chai').expect;

describe('Tuple', function(){

  describe('duplicate', function(){
    it('must make a tuple with the value duplicated the specified amount of times', function(){
      let t = Tuple.duplicate("value", 3);
      expect(t.length).to.equal(3);
      expect(t[0]).to.equal("value");
      expect(t[1]).to.equal("value");
      expect(t[2]).to.equal("value");

      t = Tuple.duplicate("value", 0);
      expect(t.length).to.equal(0);
    })
  })

  describe('delete_at', function(){
    it('must delete first item', function(){
      let t = Tuple(1, 2, 3);

      t = Tuple.delete_at(t, 0);

      expect(t[0]).to.equal(2);
    })
  })


})

