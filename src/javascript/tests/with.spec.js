import Core from "../lib/core";
const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;
const Tuple = Core.Tuple;

import Enum from "../lib/enum";

import chai from 'chai';
var expect = chai.expect;

const $ = Patterns.variable();

function map_fetch(map, key){
  if(key in map){
    return new Tuple(Symbol.for('ok'), map[key]);
  }

  return Symbol.for('error');
}

describe('with', () => {

  it('normal', () => {
    /*
     opts = %{width: 10, height: 15}

     with {:ok, width} <- Map.fetch(opts, :width),
          {:ok, height} <- Map.fetch(opts, :height),
          do: {:ok, width * height}

     {:ok, 150}
     */

    let opts = { width: 10, height: 15 };

    let value = SpecialForms._with(
      [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, "width")],
      [new Tuple(Symbol.for('ok'), $), (width) => map_fetch(opts, "height")],
      (width, height) => new Tuple(Symbol.for('ok'), width * height)
    );

    expect(value).to.eql(new Tuple(Symbol.for('ok'), 150));
  });


  it('without match', () => {
    /*
     opts = %{width: 10}

     with {:ok, width} <- Map.fetch(opts, :width),
          {:ok, height} <- Map.fetch(opts, :height),
          do: {:ok, width * height}

     :error
     */

    let opts = { width: 10 };

    let value = SpecialForms._with(
      [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, "width")],
      [new Tuple(Symbol.for('ok'), $), (width) => map_fetch(opts, "height")],
      (width, height) => new Tuple(Symbol.for('ok'), width * height)
    );

    expect(value).to.eql(Symbol.for('error'));
  });


  it('bare expression', () => {
    /*
     opts = %{width: 10}

     with {:ok, width} <- Map.fetch(opts, :width),
          double_width = width * 2,
          {:ok, height} <- Map.fetch(opts, :height),
          do: {:ok, double_width * height}

     {:ok, 300}
     */

    let opts = { width: 10, height: 15 };

    let value = SpecialForms._with(
      [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, "width")],
      [$, (width) => width * 2],
      [new Tuple(Symbol.for('ok'), $), (width, double_width) => map_fetch(opts, "height")],
      (width, double_width, height) => new Tuple(Symbol.for('ok'), double_width * height)
    );

    expect(value).to.eql(new Tuple(Symbol.for('ok'), 300));
  });

});

