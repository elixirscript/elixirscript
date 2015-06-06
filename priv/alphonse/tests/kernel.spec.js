var Kernel = require('../lib/kernel');
var Atom = require('../lib/atom');
var Tuple = require('../lib/tuple');
var expect = require('chai').expect;

describe('Kernel', function(){

  describe('match?', function(){
    it('match numbers', function(){
      expect(Kernel["match?"](1, 1)).to.equal(true);
      expect(Kernel["match?"](1.0, 1)).to.equal(true);
      expect(Kernel["match?"](2, 1)).to.equal(false);
      expect(Kernel["match?"](2, 1 + 1)).to.equal(true);

      let a;
      expect(Kernel["match?"](a, 1 + 1)).to.equal(true);
      expect(Kernel["match?"](undefined, 1 + 1)).to.equal(true);
    })

    it('match strings', function(){
      expect(Kernel["match?"]("", "")).to.equal(true);
      expect(Kernel["match?"]('', "")).to.equal(true);
      expect(Kernel["match?"]("Hello", "Hell")).to.equal(false);
      expect(Kernel["match?"]("Hello", "Hell" + "o")).to.equal(true);
    })

    it('match atoms', function(){
      expect(Kernel["match?"](Atom("test"), Atom("test"))).to.equal(true);
      expect(Kernel["match?"](Atom("test"), Atom("notest"))).to.equal(false);
    })

    it('match tuples', function(){
      expect(Kernel["match?"](Tuple(1, 2, 3), Tuple(1, 2, 3))).to.equal(true);
      expect(Kernel["match?"](Tuple(1, undefined, 3), Tuple(1, 2, 3))).to.equal(true);
      expect(Kernel["match?"](Tuple(1, 2, 3), Tuple(1, 2))).to.equal(false);
    })

    it('match list', function(){
      expect(Kernel["match?"]([1, 2, 3], [1, 2, 3])).to.equal(true);
      expect(Kernel["match?"]([1, undefined, 3], [1, 2, 3])).to.equal(true);
      expect(Kernel["match?"]([1, 2, 3], [1, 2])).to.equal(false);
    })

    it('match map', function(){
      expect(Kernel["match?"]({a: 1, b: 2}, {a: 1, b: 2})).to.equal(true);
      expect(Kernel["match?"]({a: 1}, {a: 1, b: 2})).to.equal(true);
      expect(Kernel["match?"]({a: undefined}, {a: 1, b: 2})).to.equal(true);
      expect(Kernel["match?"]({c: 1}, {a: 1, b: 2})).to.equal(false);
      expect(Kernel["match?"]({c: undefined}, {a: 1, b: 2})).to.equal(false);
    })

    it('match numbers with guards', function(){
      expect(Kernel["match?"](1, 1, () => Kernel.is_number(1))).to.equal(true);
    })
  })
})

