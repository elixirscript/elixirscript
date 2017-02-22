defmodule ElixirScript.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "turn javascript ast into javascript code strings" do
    js_code = ElixirScript.compile(":atom")
    assert_js_matches "Symbol.for('atom')", js_code
  end


  test "parse macros" do

    js_code = ElixirScript.compile("""
      defmodule Animals do
        use ElixirScript.Using

        defp something_else() do
          ElixirScript.Math.squared(1)
        end

      end
    """, %{ env: make_custom_env() })

    assert_js_matches """
         const something_else = Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function()    {
             return     1 * 1;
           }));
         const sandwich = Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function()    {
             return     null;
           }));
     """, js_code
  end


  test "set standard lib path" do

    js_code = ElixirScript.compile("""
      defmodule Animals do
        use ElixirScript.Using

        defp something_else() do
          ElixirScript.Math.squared(1)
        end

      end
    """, %{ env: make_custom_env(), core_path: "elixirscript"} )

    assert_js_matches """
         const something_else = Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function()    {
             return     1 * 1;
           }));
         const sandwich = Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([],function()    {
             return     null;
           }));
     """, js_code
  end
end
