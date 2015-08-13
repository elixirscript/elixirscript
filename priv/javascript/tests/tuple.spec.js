"use strict";

var Kernel = require('../lib/kernel');
var Erlang = require('../lib/erlang');
var Tuple = require('../lib/tuple');
var expect = require('chai').expect;

describe('Tuple', function(){

  describe('duplicate', function(){
    it('must make a tuple with the value duplicated the specified amount of times', function(){
      let t = Tuple.duplicate("value", 3);
      expect(t.__tuple__.length).to.equal(3);
      expect(Kernel.elem(t, 0)).to.equal("value");
      expect(Kernel.elem(t, 1)).to.equal("value");
      expect(Kernel.elem(t, 2)).to.equal("value");

      t = Tuple.duplicate("value", 0);
      expect(t.__tuple__.length).to.equal(0);
    });
  });

  describe('delete_at', function(){
    it('must delete first item', function(){
      let t = Erlang.tuple(1, 2, 3);

      t = Tuple.delete_at(t, 0);

      expect(t.__tuple__[0]).to.equal(2);
    });
  });

  describe('toString', function(){
    it('must display correctly', function(){
      let t = Erlang.tuple(1, 2, 3);
      expect(Kernel.to_string(t)).to.equal("{1, 2, 3}");
    });
  });

  describe('from_list', function(){
    it('must create a tuple from a list', function(){
      let list = Erlang.list(1, 2, 3);
      let tuple = Tuple.from_list(list);
      expect(Kernel.to_string(tuple)).to.equal("{1, 2, 3}");
    });
  });

  describe('to_list', function(){
    it('must create a list from a tuple', function(){
      let t = Erlang.tuple(1, 2, 3);
      expect(Tuple.to_list(t).length).to.equal(3);
    });
  });
});

