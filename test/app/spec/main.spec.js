import test from 'ava';
import Elixir from '../build/Elixir.App';

const sinon = require('sinon');

test('Elixir.start:calls the modules start function', t => {
  const callback = sinon.spy();

  Elixir.start(Elixir.Main, [callback]);

  t.true(callback.called);
});
