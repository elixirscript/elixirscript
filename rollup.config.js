import nodeResolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";

export default {
  entry: "src/javascript/elixir.js",
  dest: "priv/es/elixir/Elixir.Bootstrap.js",
  sourceMap: "inline",
  format: "es",
  moduleName: "Elixir.Bootstrap",
  plugins: [
    nodeResolve({ jsnext: true }),
    babel({
      babelrc: false
    })
  ]
};
