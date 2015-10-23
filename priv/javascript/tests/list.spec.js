var List = require('../lib/list');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;

describe('List', function(){

  describe('duplicate', function(){
    it('must make a tuple with the value duplicated the specified amount of times', function(){
      let t = List.duplicate("value", 3);

      expect(t.length).to.equal(3);
      expect(t[0]).to.equal("value");
      expect(t[1]).to.equal("value");
      expect(t[2]).to.equal("value");

      t = List.duplicate("value", 0);
      expect(t.length).to.equal(0);
    })
  })

  describe('delete_at', function(){
    it('must delete first item', function(){
      let t = Kernel.SpecialForms.list(1, 2, 3);
      t = List.delete_at(t, 0);
      expect(t[0]).to.equal(2);
    })
  })

  describe('delete', function(){
    it('delete item in list', function(){
      let t = Kernel.SpecialForms.list(Kernel.SpecialForms.atom("a"), Kernel.SpecialForms.atom("b"), Kernel.SpecialForms.atom("c"));
      t = List.__delete__(t, Kernel.SpecialForms.atom("b"));
      expect(t[1]).to.equal(Kernel.SpecialForms.atom("c"));
    })
  })

  describe('flatten', function(){
    it('must flatten a list into one list', function(){
      let t = Kernel.SpecialForms.list(1, Kernel.SpecialForms.list(2), 3);

      t = List.flatten(t);

      expect(t[0]).to.equal(1);
      expect(t[1]).to.equal(2);
      expect(t[2]).to.equal(3);
    })

    it('must flatten a deeply nested list into one list', function(){
      let t = Kernel.SpecialForms.list(1, Kernel.SpecialForms.list(2, Kernel.SpecialForms.list(4)), 3);

      t = List.flatten(t);

      expect(t[0]).to.equal(1);
      expect(t[1]).to.equal(2);
      expect(t[2]).to.equal(4);
      expect(t[3]).to.equal(3);
    })
  })

  describe('toString', function(){
    it('must display correctly', function(){
      let t = Kernel.SpecialForms.list(1, 2, 3);
      expect(t.toString()).to.equal('1,2,3');
    })
  })

  describe('destructuring', function(){
    it('destructure into an array', function(){
      let t = Kernel.SpecialForms.list(1, 2, 3);
      let [a, b, c] = t;
      expect(a).to.equal(1);
      expect(b).to.equal(2);
      expect(c).to.equal(3);
    })
  })
})

