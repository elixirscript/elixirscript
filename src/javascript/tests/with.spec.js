import Core from '../lib/core';
import test from 'ava';

const Patterns = Core.Patterns;
const SpecialForms = Core.SpecialForms;
const Tuple = Core.Tuple;
const MatchError = Core.Patterns.MatchError;

const $ = Patterns.variable();

function map_fetch(map, key) {
  if (key in map) {
    return new Tuple(Symbol.for('ok'), map[key]);
  }

  return Symbol.for('error');
}

test('with', (t) => {
  /*
     opts = %{width: 10, height: 15}

     with {:ok, width} <- Map.fetch(opts, :width),
          {:ok, height} <- Map.fetch(opts, :height),
          do: {:ok, width * height}

     {:ok, 150}
     */

  const opts = { width: 10, height: 15 };

  const value = SpecialForms._with(
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'width')],
    [new Tuple(Symbol.for('ok'), $), width => map_fetch(opts, 'height')],
    (width, height) => new Tuple(Symbol.for('ok'), width * height),
  );

  t.deepEqual(value, new Tuple(Symbol.for('ok'), 150));
});

test('with without match', (t) => {
  /*
     opts = %{width: 10}

     with {:ok, width} <- Map.fetch(opts, :width),
          {:ok, height} <- Map.fetch(opts, :height),
          do: {:ok, width * height}

     :error
     */

  const opts = { width: 10 };

  const value = SpecialForms._with(
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'width')],
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'height')],
    (width, height) => new Tuple(Symbol.for('ok'), width * height),
  );

  t.deepEqual(value, Symbol.for('error'));
});

test('with bare expression', (t) => {
  /*
     opts = %{width: 10}

     with {:ok, width} <- Map.fetch(opts, :width),
          double_width = width * 2,
          {:ok, height} <- Map.fetch(opts, :height),
          do: {:ok, double_width * height}

     {:ok, 300}
     */

  const opts = { width: 10, height: 15 };

  const value = SpecialForms._with(
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'width')],
    [$, width => width * 2],
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'height')],
    (width, double_width, height) => new Tuple(Symbol.for('ok'), double_width * height),
  );

  t.deepEqual(value, new Tuple(Symbol.for('ok'), 300));
});

test('with else', (t) => {
  /*
      opts = %{width: 10}

      with {:ok, width} <- Map.fetch(opts, :width),
           {:ok, height} <- Map.fetch(opts, :height) do
        {:ok, width * height}
      else
        :error -> {:error, :wrong_data}
      end

      {:error, :wrong_data}
    */

  const opts = { width: 10 };

  const value = SpecialForms._with(
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'width')],
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'height')],
    (width, height) => new Tuple(Symbol.for('ok'), width * height),
    Patterns.defmatch(
      Patterns.clause(
        [Symbol.for('error')],
        () => new Tuple(Symbol.for('error'), Symbol.for('wrong_data')),
      ),
    ),
  );

  t.deepEqual(value, new Tuple(Symbol.for('error'), Symbol.for('wrong_data')));
});

test('with else that don`t match', (t) => {
  /*
      opts = %{width: 10}

      with {:ok, width} <- Map.fetch(opts, :width),
           {:ok, height} <- Map.fetch(opts, :height) do
        {:ok, width * height}
      else
        :fail -> {:error, :wrong_data}
      end

      {:error, :wrong_data}
    */

  const opts = { width: 10 };

  const withFunction = SpecialForms._with.bind(
    null,
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'width')],
    [new Tuple(Symbol.for('ok'), $), () => map_fetch(opts, 'height')],
    (width, height) => new Tuple(Symbol.for('ok'), width * height),
    Patterns.defmatch(
      Patterns.clause(
        [Symbol.for('fail')],
        () => new Tuple(Symbol.for('error'), Symbol.for('wrong_data')),
      ),
    ),
  );

  t.throws(withFunction, MatchError);
});
