defmodule ElixirScript.CompilerStats.Test do
  use ExUnit.Case
  alias  ElixirScript.CompilerStats


  test "no changes found when old and new are empty" do
    old = []
    new = []
    assert CompilerStats.get_changed_files(old, new) == []
  end

  test "all new changes found when old empty and new has files" do
    old = []
    new =  [{"file.ex", %{mtime: 1}}]
    assert CompilerStats.get_changed_files(old, new) == new
  end

  test "all new changes found when old not emtpy and new is empty" do
    old =  [{"file.ex", %{mtime: 1}}]
    new = []
    assert CompilerStats.get_changed_files(old, new) == new
  end

  test "all new changes found when old and new have same size but different file" do
    old =  [{"file.ex", %{mtime: 1}}]
    new =  [{"new_file.ex", %{mtime: 1}}]
    assert CompilerStats.get_changed_files(old, new) == new
  end

  test "all new changes found when old and new have same file and different size" do
    old =  [{"file.ex", %{mtime: 1}}]
    new =  [{"file.ex", %{mtime: 2}}]
    assert CompilerStats.get_changed_files(old, new) == new
  end

  test "no changes found when old and new have same file and size" do
    old =  [{"file.ex", %{mtime: 1}}]
    new =  [{"file.ex", %{mtime: 1}}]
    assert CompilerStats.get_changed_files(old, new) == []
  end

  test "all new changes found when old has less files than new" do
    old =  [{"file.ex", %{mtime: 1}}]
    new =  [{"file.ex", %{mtime: 1}}, {"new_file.ex", %{mtime: 1}}]
    assert CompilerStats.get_changed_files(old, new) == new
  end
end
