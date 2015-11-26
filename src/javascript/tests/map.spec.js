var Map = require('../lib/map');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;

describe('Map', function(){

  it('new', function(){
    let map = Map.new();

    expect(Object.keys(map).length).to.equal(0);
  });

  it('keys', function(){
    let map = Map.new();
    expect(Map.keys(map)).to.deep.equal([]);

    map = Map.put(map, "hello", "world");
    expect(Map.keys(map)).to.deep.equal(["hello"]);
  });

  it('to_list', function(){
    let map = Map.new();

    map = Map.put(map, "hello", "world");
    expect(Map.to_list(map)).to.deep.equal([Kernel.SpecialForms.tuple("hello", "world")]);
  });

  it('delete', function(){
    let map = Map.new();

    map = Map.put(map, "hello", "world");
    expect(Map.keys(map).length).to.equal(1);

    map = Map.delete(map, "hello")
    expect(Map.keys(map).length).to.equal(0);    
  });

})

