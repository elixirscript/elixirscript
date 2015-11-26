var Set = require('../lib/set');
var MapSet = require('../lib/map_set');
var Kernel = require('../lib/kernel');
var expect = require('chai').expect;

describe('Set', function(){

  it('new', function(){
    let set = MapSet.new();

    expect(Set.size(set)).to.equal(0);
  });

  it('put', function(){
    let set = MapSet.new();

    expect(Set.size(set)).to.equal(0);

    set = Set.put(set, "hello");
    expect(Set.size(set)).to.equal(1);

    set = Set.put(set, "hello");
    expect(Set.size(set)).to.equal(1);
  });

  it('to_list', function(){
    let set = MapSet.new();

    set = Set.put(set, "hello");
    expect(Set.to_list(set)).to.deep.equal(["hello"]);
  });

  it('delete', function(){
    let set = MapSet.new();

    set = Set.put(set, "hello");
    expect(Set.size(set)).to.equal(1);

    set = Set.delete(set, "hello")
    expect(Set.size(set)).to.equal(0);    
  });


  it('difference', function(){
    let set1 = MapSet.new();
    let set2 = MapSet.new();

    set1 = Set.put(set1, "hello");
    set1 = Set.put(set1, "world");

    set2 = Set.put(set2, "goodbye");
    set2 = Set.put(set2, "world");

    let set3 = Set.difference(set1, set2);

    expect(Set.to_list(set3)).to.deep.equal(["hello"]);   
  });


  it('intersection', function(){
    let set1 = MapSet.new();
    let set2 = MapSet.new();

    set1 = Set.put(set1, "hello");
    set1 = Set.put(set1, "world");

    set2 = Set.put(set2, "goodbye");
    set2 = Set.put(set2, "world");

    let set3 = Set.intersection(set1, set2);

    expect(Set.to_list(set3)).to.deep.equal(["world"]);   
  });


  it('union', function(){
    let set1 = MapSet.new();
    let set2 = MapSet.new();

    set1 = Set.put(set1, "hello");
    set1 = Set.put(set1, "world");

    set2 = Set.put(set2, "goodbye");
    set2 = Set.put(set2, "world");

    let set3 = Set.union(set1, set2);

    expect(Set.to_list(set3)).to.deep.equal(["hello", "world", "goodbye"]);   
  });


  it('subset?', function(){
    let set1 = MapSet.new();
    let set2 = MapSet.new();

    set1 = Set.put(set1, "world");

    set2 = Set.put(set2, "goodbye");
    set2 = Set.put(set2, "world");

    expect(Set.subset__qmark__(set1, set2)).to.equal(true);   
    expect(Set.subset__qmark__(set2, set1)).to.equal(false);   
  });
  
})

