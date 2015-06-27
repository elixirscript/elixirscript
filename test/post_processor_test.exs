defmodule ElixirScript.PostProcessor.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "load parse js_deps with no options" do
    js_deps = [
        { :jquery }
    ]

    result = ElixirScript.PostProcessor.create_import_statements(js_deps)
    |> ESTree.Builder.program
    |> ElixirScript.javascript_ast_to_code!

    assert result == "import jquery from 'jquery';"
  end

  should "load parse js_deps with as option" do
    js_deps = [
        { :underscore, as: :something_else }
    ]

    result = ElixirScript.PostProcessor.create_import_statements(js_deps)
    |> ESTree.Builder.program
    |> ElixirScript.javascript_ast_to_code!

    assert result == "import { default as something_else } from 'underscore';"
  end

  should "load parse js_deps with from option" do
    js_deps = [
        { :phoenix, from: "./something" } 
    ]

    result = ElixirScript.PostProcessor.create_import_statements(js_deps)
    |> ESTree.Builder.program
    |> ElixirScript.javascript_ast_to_code!

    assert result == "import phoenix from './something';"
  end
end