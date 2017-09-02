import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';

export default {
  entry: 'src/javascript/elixir.js',
  moduleName: 'ElixirScript',
  plugins: [
    nodeResolve({ jsnext: true }),
    babel({
<<<<<<< HEAD
      babelrc: false
    })
    //minify({
    //  keepFnName: true,
    //  keepClassName: true
    //})
=======
      babelrc: false,
    }),
    minify({
      keepFnName: true,
      keepClassName: true,
    }),
>>>>>>> master
  ],
  targets: [{ dest: 'priv/build/iife/ElixirScript.Core.js', format: 'iife' }],
};
