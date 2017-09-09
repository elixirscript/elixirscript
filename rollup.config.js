import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';

export default {
  entry: 'src/javascript/elixir.js',
  moduleName: 'ElixirScript',
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
    }),
    commonjs(),
    babel({
      babelrc: false,
    }),
    minify({
      keepFnName: true,
      keepClassName: true,
    }),
  ],
  targets: [{ dest: 'priv/build/iife/ElixirScript.Core.js', format: 'iife' }],
};
