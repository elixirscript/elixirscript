var acorn = require('acorn');
var escodegen = require('escodegen');

var options = { ecmaVersion: 6}

//var null_ast = acorn.parse('null', options);
//console.log(JSON.stringify(null_ast));
//
//var number_ast = acorn.parse('1.10', options);
//console.log(JSON.stringify(number_ast));
//
//var string_ast = acorn.parse('"batman"', options);
//console.log(JSON.stringify(string_ast));
//
//var bool_ast = acorn.parse('true', options);
//console.log(JSON.stringify(bool_ast));
//
//var array_ast = acorn.parse('[1, 2, 3]', options);
//console.log(JSON.stringify(array_ast));
//
//var function_ast = acorn.parse('function hello(a, b) {}', options);
//console.log(JSON.stringify(function_ast));
//
//var object_ast = acorn.parse('var s = {name:"Rose", age: 25 }', options);
//console.log(JSON.stringify(object_ast));
//
//var assignment_ast = acorn.parse('let s = 1', options);
//console.log(JSON.stringify(assignment_ast));
//
//var symbol_ast = acorn.parse('Symbol("s")', options);
//console.log(JSON.stringify(symbol_ast));

var class_ast = acorn.parse('export class Hello{ world(){var a = 1;} }', options);
console.log(JSON.stringify(class_ast));

//var import_ast = acorn.parse('import {Home} from "home"; class Hello{}', options);
//console.log(JSON.stringify(import_ast));

//var import_ast = acorn.parse('Home.do_it(e,z);', options);
//console.log(JSON.stringify(import_ast));

//var import_ast = acorn.parse('class Hello{ world(){}; taco(a,b){this.world()}; }', options);
//console.log(JSON.stringify(import_ast));

//var import_ast = acorn.parse('Home.do_it(e,z,function(x){});', options);
//console.log(JSON.stringify(import_ast));


var g = escodegen.generate(class_ast);
console.log(g);