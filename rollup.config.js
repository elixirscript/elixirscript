import { rollup } from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/javascript/elixir.js',
  dest: 'priv/elixir/Elixir.Bootstrap.js',
  sourceMap: 'inline',
  format: 'es6',
  plugins: [
    nodeResolve({ jsnext: true }),
    babel({
      babelrc: false
    })
  ]
};
