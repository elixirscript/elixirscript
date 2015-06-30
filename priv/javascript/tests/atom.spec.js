var Erlang = require('../lib/erlang');
var Atom = require('../lib/atom');
var expect = require('chai').expect;

describe('Atom', function(){

  describe('to_string', function(){
    it('must display correctly', function(){
      let atom = Erlang.atom("test");
      expect(Atom.to_string(atom)).to.equal("test");
    })
  })

  describe('to_char_list', function(){
    it('must return a list of characters', function(){
      let atom = Erlang.atom("test");
      let char_list = Atom.to_char_list(atom);
      expect(char_list.length).to.equal(4);
      expect(char_list[0]).to.equal('t');
      expect(char_list[1]).to.equal('e');
      expect(char_list[2]).to.equal('s');
      expect(char_list[3]).to.equal('t');
    })
  })
})

