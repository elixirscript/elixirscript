var List = require('../lib/list');
var Erlang = require('../lib/erlang');
var expect = require('chai').expect;

describe('List', function(){

  describe('duplicate', function(){
    it('must make a tuple with the value duplicated the specified amount of times', function(){
      let t = List.duplicate("value", 3);

      expect(t.count()).to.equal(3);
      expect(t.get(0)).to.equal("value");
      expect(t.get(1)).to.equal("value");
      expect(t.get(2)).to.equal("value");

      t = List.duplicate("value", 0);
      expect(t.count()).to.equal(0);
    })
  })

  describe('delete_at', function(){
    it('must delete first item', function(){
      let t = Erlang.list(1, 2, 3);
      t = List.delete_at(t, 0);
      expect(t.get(0)).to.equal(2);
    })
  })

  describe('delete', function(){
    it('delete item in list', function(){
      let t = Erlang.list(Erlang.atom("a"), Erlang.atom("b"), Erlang.atom("c"));
      t = List.delete(t, Erlang.atom("b"));
      expect(t.get(1)).to.equal(Erlang.atom("c"));
    })
  })

  describe('flatten', function(){
    it('must flatten a list into one list', function(){
      let t = Erlang.list(1, Erlang.list(2), 3);

      t = List.flatten(t);

      expect(t.get(0)).to.equal(1);
      expect(t.get(1)).to.equal(2);
      expect(t.get(2)).to.equal(3);
    })

    it('must flatten a deeply nested list into one list', function(){
      let t = Erlang.list(1, Erlang.list(2, Erlang.list(4)), 3);

      t = List.flatten(t);

      expect(t.get(0)).to.equal(1);
      expect(t.get(1)).to.equal(2);
      expect(t.get(2)).to.equal(4);
      expect(t.get(3)).to.equal(3);
    })
  })

  describe('toString', function(){
    it('must display correctly', function(){
      let t = Erlang.list(1, 2, 3);
      expect(t.toString()).to.equal('List [ 1, 2, 3 ]');
    })
  })

  describe('destructuring', function(){
    it('destructure into an array', function(){
      let t = Erlang.list(1, 2, 3);
      let [a, b, c] = t;
      expect(a).to.equal(1);
      expect(b).to.equal(2);
      expect(c).to.equal(3);
    })
  })
})

