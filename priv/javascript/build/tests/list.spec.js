'use strict';

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

var List = require('../lib/list');
var Atom = require('../lib/atom');
var expect = require('chai').expect;

describe('List', function () {

  describe('duplicate', function () {
    it('must make a tuple with the value duplicated the specified amount of times', function () {
      var t = List.duplicate('value', 3);

      expect(t.length()).to.equal(3);
      expect(t.get(0)).to.equal('value');
      expect(t.get(1)).to.equal('value');
      expect(t.get(2)).to.equal('value');

      t = List.duplicate('value', 0);
      expect(t.length()).to.equal(0);
    });
  });

  describe('delete_at', function () {
    it('must delete first item', function () {
      var t = List(1, 2, 3);
      t = List.delete_at(t, 0);
      expect(t.get(0)).to.equal(2);
    });
  });

  describe('delete', function () {
    it('delete item in list', function () {
      var t = List(Atom('a'), Atom('b'), Atom('c'));
      t = List['delete'](t, Atom('b'));
      expect(t.get(1)).to.equal(Atom('c'));
    });
  });

  describe('flatten', function () {
    it('must flatten a list into one list', function () {
      var t = List(1, List(2), 3);

      t = List.flatten(t);

      expect(t.get(0)).to.equal(1);
      expect(t.get(1)).to.equal(2);
      expect(t.get(2)).to.equal(3);
    });

    it('must flatten a deeply nested list into one list', function () {
      var t = List(1, List(2, List(4)), 3);

      t = List.flatten(t);

      expect(t.get(0)).to.equal(1);
      expect(t.get(1)).to.equal(2);
      expect(t.get(2)).to.equal(4);
      expect(t.get(3)).to.equal(3);
    });
  });

  describe('toString', function () {
    it('must display correctly', function () {
      var t = List(1, 2, 3);
      expect(t.toString()).to.equal('1,2,3');
    });
  });

  describe('destructuring', function () {
    it('destructure into an array', function () {
      var t = List(1, 2, 3);

      var _t = _slicedToArray(t, 3);

      var a = _t[0];
      var b = _t[1];
      var c = _t[2];

      expect(a).to.equal(1);
      expect(b).to.equal(2);
      expect(c).to.equal(3);
    });
  });

  describe('Object.freeze', function () {
    it('does not allow changing array', function () {
      var t = Object.freeze([1, 2, 3]);

      t[0] = 3;

      expect(t[0]).to.equal(1);
    });
  });
});