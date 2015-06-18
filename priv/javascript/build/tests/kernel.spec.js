'use strict';

var Kernel = require('../lib/kernel');
var Atom = require('../lib/atom');
var Tuple = require('../lib/tuple');
var expect = require('chai').expect;

describe('Kernel', function () {

  describe('match?', function () {
    it('match numbers', function () {
      expect(Kernel.match__qmark__(1, 1)).to.equal(true);
      expect(Kernel.match__qmark__(1, 1)).to.equal(true);
      expect(Kernel.match__qmark__(2, 1)).to.equal(false);
      expect(Kernel.match__qmark__(2, 1 + 1)).to.equal(true);

      var a = undefined;
      expect(Kernel.match__qmark__(a, 1 + 1)).to.equal(true);
      expect(Kernel.match__qmark__(undefined, 1 + 1)).to.equal(true);
    });

    it('match strings', function () {
      expect(Kernel.match__qmark__('', '')).to.equal(true);
      expect(Kernel.match__qmark__('', '')).to.equal(true);
      expect(Kernel.match__qmark__('Hello', 'Hell')).to.equal(false);
      expect(Kernel.match__qmark__('Hello', 'Hell' + 'o')).to.equal(true);
    });

    it('match atoms', function () {
      expect(Kernel.match__qmark__(Atom('test'), Atom('test'))).to.equal(true);
      expect(Kernel.match__qmark__(Atom('test'), Atom('notest'))).to.equal(false);
    });

    it('match tuples', function () {
      expect(Kernel.match__qmark__(Tuple(1, 2, 3), Tuple(1, 2, 3))).to.equal(true);
      expect(Kernel.match__qmark__(Tuple(1, undefined, 3), Tuple(1, 2, 3))).to.equal(true);
      expect(Kernel.match__qmark__(Tuple(1, 2, 3), Tuple(1, 2))).to.equal(false);
    });

    it('match list', function () {
      expect(Kernel.match__qmark__([1, 2, 3], [1, 2, 3])).to.equal(true);
      expect(Kernel.match__qmark__([1, undefined, 3], [1, 2, 3])).to.equal(true);
      expect(Kernel.match__qmark__([1, 2, 3], [1, 2])).to.equal(false);
    });

    it('match map', function () {
      expect(Kernel.match__qmark__({ a: 1, b: 2 }, { a: 1, b: 2 })).to.equal(true);
      expect(Kernel.match__qmark__({ a: 1 }, { a: 1, b: 2 })).to.equal(true);
      expect(Kernel.match__qmark__({ a: undefined }, { a: 1, b: 2 })).to.equal(true);
      expect(Kernel.match__qmark__({ c: 1 }, { a: 1, b: 2 })).to.equal(false);
      expect(Kernel.match__qmark__({ c: undefined }, { a: 1, b: 2 })).to.equal(false);
    });

    it('match numbers with guards', function () {
      expect(Kernel.match__qmark__(1, 1, function () {
        return Kernel.is_number(1);
      })).to.equal(true);
    });
  });
});