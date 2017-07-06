import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import babili from 'rollup-plugin-babili';

export default {
  entry: 'src/javascript/elixir.js',
  moduleName: 'Bootstrap',
  plugins: [
    nodeResolve({ jsnext: true }),
    babel({
      babelrc: false,
    }),
    babili({
      keepFnName: true,
      keepClassName: true,
    }),
  ],
  targets: [{ dest: 'priv/build/iife/Elixir.Bootstrap.js', format: 'iife' }],
};