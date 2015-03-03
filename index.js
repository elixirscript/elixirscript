var acorn = require('acorn');
var escodegen = require('escodegen');

var options = { ecmaVersion: 6, locations: true }

function parse(code){
  var ast = acorn.parse(code, options);
  console.log(JSON.stringify(ast));
  return ast; 
}

function parse_null(){
  return parse('null');
}

function parse_number(){
  return parse('1.10');
}

function parse_negative_number(){
  return parse('-1.1');
}

function parse_string(){
  return parse('"batman"');
}

function parse_bool(){
  return parse('true');
}

function parse_array(){
  return parse('[1, 2, 3]');
}

function parse_function(){
  return parse('function hello(a, b) {}');
}

function parse_object(){
  return parse('var s = {name:"Rose", age: 25 }');
}

function parse_let(){
  return parse('let s = 1');
}

function parse_symbol(){
  return parse('Symbol("s")');
}

function parse_class(){
  return parse('export class Hello{ world(){let a = 1;} }');
}

function parse_import(){
  return parse('import {Crane} from "icabod/crane"; export class Hello{}');
}

function parse_star_import(){
  return parse("import * as World from 'hello/world'");
}

function parse_alias_import(){
  return parse("import { Crane as C } from 'icabod/crane';");
}

function parse_simple_if(){
  return parse('if(tacos == true){a = 1}');
}

function parse_if(){
  return parse('if(tacos == true){a = 1}else if(tacos == false){a = 3}else{a = 2}');
}

function parse_array_destructing(){
  return parse('var [a, b] = [1, 2]');
}

function parse_arrow_function(){
  return parse('(x) => x * 2');
}

function parse_constructor(){
  return parse('export class Hello{ constructor(name = "Bob"){this.name = name;}}')
}

function parse_expression(){
  return parse('(a=1)')
}

function parse_template_string(){
  return parse('`Hello`')
}

function parse_another_import(){
  return parse("import la from 'us'");
}

function parse_new_class(){
  return parse("let user = new User('John', 27)");
}

var g = escodegen.generate(parse_new_class());
console.log(g);
