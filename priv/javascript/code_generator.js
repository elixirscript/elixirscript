var escodegen = require('escodegen');
var node_erlastic = require('node_erlastic');

node_erlastic.server(function(term, from, state, done){
    if (term == "get"){
        return done("reply", state);
    }

    if (term[0] == "translate"){
        var ast = JSON.parse(term[1]);
        var generated = escodegen.generate(ast);
        return done("noreply", generated);
    }
    
    throw new Error("unexpected request")
});
