/**
 Takes in SpiderMonkey AST in JSON format and returns JavaScript code
 represented by the passed in AST.

 Usage: node code_generator.js <ast>
**/
var escodegen = require('escodegen');
var args = process.argv.slice(2);

var generated = escodegen.generate(JSON.parse(args[0]));
process.stdout.write(generated);
process.exit(0);