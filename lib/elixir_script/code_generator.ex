defmodule ElixirScript.CodeGenerator do

  def start_link(ini) do
    Exos.Proc.start_link("node code_generator.js", ini, [cd: ElixirScript.operating_path], name: __MODULE__)
  end

  def translate(code) do
    GenServer.cast(__MODULE__, {:translate, code })
    GenServer.call(__MODULE__, :get, :infinity)
  end
  
end
