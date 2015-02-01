defmodule ExToJS.SpiderMonkey.Nodes do
  alias ExToJS.SpiderMonkey
  
  def literal(value) do
    %{ type: "Literal", value: value }
  end

  def array(value) do
    %{ type: "ArrayExpression", elements: Enum.map(value, fn(x) -> SpiderMonkey.parse(x) end)}
  end

  def symbol(value) do
    %{
      type: "CallExpression", 
      callee: identifier("Symbol"),
      arguments: [
        literal(Atom.to_string(value))
      ]
    }
  end

  def identifier(value) do
    %{type: "Identifier", name: value }
  end

  def object(fields) do
    %{ 
        type: "ObjectExpression",
        properties: Enum.map(fields, fn({x, y}) -> property(x, y) end)
    }
  end

  def property(key, value) do
    %{  
        type: "Property",
        key: identifier(key), 
        value: SpiderMonkey.parse(value) 
    }
  end

  def variable(name, value) do
    %{
      type: "VariableDeclaration",
      declarations: [
        %{
          type: "VariableDeclarator",
          id: %{
              type: "Identifier",
              name: name },
              init: SpiderMonkey.parse(value)
        }
      ],
      kind: "let"
    }
  end

  def binary(operator, left, right) do
    %{
      type: "BinaryExpression",
      left: SpiderMonkey.parse(left),
      operator: Atom.to_string(operator),
      right: SpiderMonkey.parse(right)
    }
  end

  def method(name, params, body) do
    %{
      type: "MethodDefinition",
      static: false,
      computed: false,
      key: identifier(Atom.to_string(name)),
      kind: "",
      value: function(params, body)
    }
  end

  def function(params, body) do
    %{
      type: "FunctionExpression",
      id: nil,
      params: Enum.map(params, fn({name, _, _}) -> 
        SpiderMonkey.parse(Atom.to_string(name)) 
      end),
      defaults: [],
      rest: nil,
      generator: false,
      body: block(body),
      expression: false
    }
  end

  def block(body) do
    %{
        type: "BlockStatement",
        body: [SpiderMonkey.parse(body)]
      }
  end

  def class(name, body) do
    %{
        type: "ClassDeclaration",
        id: identifier(List.last(name) |> Atom.to_string),
        superClass: nil,
        body: %{
          type: "ClassBody",
          body: SpiderMonkey.parse(body)
        }
    }
  end

  def import_declaration(name) do
    class_name = List.last(name) |> Atom.to_string
    import_path = Enum.map(name, fn(x) -> Inflex.underscore(x) end) |> Enum.join("/")
    import_path = "'" <> import_path <> "'"

    %{
      type: "ImportDeclaration",
      specifiers: [
        %{
          type: "ImportSpecifier",
          id: identifier(class_name),
          name: nil,
          default: false
        }
      ],
      source: identifier(import_path)
    }
  end

  def export(node) do
    %{
      type: "ExportDeclaration",
      declaration: node,
      default: false,
      specifiers: nil,
      source: nil
    }
  end

  def call(module_name, function_name, params) do
      %{
        type: "CallExpression",
        callee: %{
          type: "MemberExpression",
          object: identifier(module_name),
          property: identifier(function_name),
          computed: false
        },
        arguments: Enum.map(params, &SpiderMonkey.parse(&1))
      }
  end

  def call(function_name, params) do
      %{
        type: "CallExpression",
        callee: %{
          type: "MemberExpression",
          object: %{ type: "ThisExpression" },
          property: identifier(function_name),
          computed: false
        },
        arguments: Enum.map(params, &SpiderMonkey.parse(&1))
      }
  end

end