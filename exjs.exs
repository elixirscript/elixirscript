defmodule ElixirScript.Config do
  
  def project() do
    [
      app: :app,
      js_deps: [
        { :JQuery, from: "jquery" }
      ]
    ]
  end
end

