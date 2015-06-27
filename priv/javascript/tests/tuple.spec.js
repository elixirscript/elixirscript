"use strict"

var Erlang = require('../lib/erlang');
var Tuple = require('../lib/tuple');
var expect = require('chai').expect;

describe('Tuple', function(){

  describe('duplicate', function(){
    it('must make a tuple with the value duplicated the specified amount of times', function(){
      let t = Tuple.duplicate("value", 3);
      expect(t.length()).to.equal(3);
      expect(t.get(0)).to.equal("value");
      expect(t.get(1)).to.equal("value");
      expect(t.get(2)).to.equal("value");

      t = Tuple.duplicate("value", 0);
      expect(t.length()).to.equal(0);
    })
  })

  describe('delete_at', function(){
    it('must delete first item', function(){
      let t = Erlang.tuple(1, 2, 3);

      t = Tuple.delete_at(t, 0);

      expect(t.get(0)).to.equal(2);
    })
  })

  describe('toString', function(){
    it('must display correctly', function(){
      let t = Erlang.tuple(1, 2, 3);
      expect(t.toString()).to.equal("{1, 2, 3}");
    })
  })

  describe('from_list', function(){
    it('must create a tuple from a list', function(){
      let list = Erlang.list(1, 2, 3);
      expect(Tuple.from_list(list).toString()).to.equal("{1, 2, 3}");
    })
  })

  describe('to_list', function(){
    it('must create a list from a tuple', function(){
      let t = Erlang.tuple(1, 2, 3);
      expect(Tuple.to_list(t).length()).to.equal(3);
    })
  })
})

