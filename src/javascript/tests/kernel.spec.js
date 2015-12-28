var Kernel = require('../lib/kernel');
var expect = require('chai').expect;

describe('Kernel', function(){

  describe('match?', function(){
    it('match numbers', function(){
      expect(Kernel.match__qmark__(1, 1)).to.equal(true);
      expect(Kernel.match__qmark__(1.0, 1)).to.equal(true);
      expect(Kernel.match__qmark__(2, 1)).to.equal(false);
      expect(Kernel.match__qmark__(2, 1 + 1)).to.equal(true);
      expect(Kernel.match__qmark__(undefined, 1 + 1)).to.equal(true);
      expect(Kernel.match__qmark__(undefined, 1 + 1)).to.equal(true);
    });

    it('match strings', function(){
      expect(Kernel.match__qmark__("", "")).to.equal(true);
      expect(Kernel.match__qmark__('', "")).to.equal(true);
      expect(Kernel.match__qmark__("Hello", "Hell")).to.equal(false);
      expect(Kernel.match__qmark__("Hello", "Hell" + "o")).to.equal(true);
    });

    it('match atoms', function(){
      expect(Kernel.match__qmark__(Symbol.for("test"), Symbol.for("test"))).to.equal(true);
      expect(Kernel.match__qmark__(Symbol.for("test"), Symbol.for("notest"))).to.equal(false);
    });

    it('match tuples', function(){
      expect(Kernel.match__qmark__(Kernel.SpecialForms.tuple(1, 2, 3), Kernel.SpecialForms.tuple(1, 2, 3))).to.equal(true);
      expect(Kernel.match__qmark__(Kernel.SpecialForms.tuple(1, undefined, 3), Kernel.SpecialForms.tuple(1, 2, 3))).to.equal(true);
      expect(Kernel.match__qmark__(Kernel.SpecialForms.tuple(1, 2, 3), Kernel.SpecialForms.tuple(1, 2))).to.equal(false);
    });

    it('match list', function(){
      expect(Kernel.match__qmark__([1, 2, 3], [1, 2, 3])).to.equal(true);
      expect(Kernel.match__qmark__([1, undefined, 3], [1, 2, 3])).to.equal(true);
      expect(Kernel.match__qmark__([1, 2, 3], [1, 2])).to.equal(false);
    });

    it('match map', function(){
      expect(Kernel.match__qmark__({a: 1, b: 2}, {a: 1, b: 2})).to.equal(true);
      expect(Kernel.match__qmark__({a: 1}, {a: 1, b: 2})).to.equal(true);
      expect(Kernel.match__qmark__({a: undefined}, {a: 1, b: 2})).to.equal(true);
      expect(Kernel.match__qmark__({c: 1}, {a: 1, b: 2})).to.equal(false);
      expect(Kernel.match__qmark__({c: undefined}, {a: 1, b: 2})).to.equal(false);
    });

    it('match numbers with guards', function(){
      expect(Kernel.match__qmark__(1, 1, () => Kernel.is_number(1))).to.equal(true);
    });
  });
});

