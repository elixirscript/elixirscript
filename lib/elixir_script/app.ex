defmodule ElixirScript.App do
  use Application

  def start(_,_) do
    ElixirScript.App.Sup.start_link
  end

  defmodule Sup do
    use Supervisor
    def start_link, do: Supervisor.start_link(__MODULE__,[])
    def init([]), do: supervise([
      worker(ElixirScript.CodeGenerator, [0])
    ], strategy: :one_for_one)
  end
  
end
