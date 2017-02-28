import nodeResolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";

export default {
  entry: "src/javascript/elixir.js",
  moduleName: "Bootstrap",
  plugins: [
    nodeResolve({ jsnext: true }),
    babel({
      babelrc: false
    })
  ],
  targets: [{ dest: "priv/build/iife/Elixir.Bootstrap.js", format: "iife" }]
};
