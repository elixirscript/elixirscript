function start(app, type = Symbol.for("temporary")){
  return app.start(type, []);
}

export default { start };