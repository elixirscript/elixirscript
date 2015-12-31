defmodule ElixirScript.MapSet do

  defstruct set: []

  def new() do
    %MapSet{}
  end

  def size(set) do
    length(set.set)
  end

  def to_list(set) do
    set.set
  end

  def delete(set, term) do
    %{ set | set: Elixir.List.remove(set.set, term) }
  end

  def put(set, term) do
    case member?(set, term) do
      false ->
        %{ set | set: set.set ++ term }
      true ->
        set
    end
  end

  def member?(set, term) do
    set.set.indexOf(term) >= 0
  end

  def equal?(set1, set2) do
    set1 === set2
  end

  def difference(set1, set2) do
    do_difference(to_list(set1), set2, new())
  end

  def do_difference([], _, difference_set) do
    difference_set
  end

  def do_difference(set1_list, set2, difference_set) do
    term = hd(set1_list)
    case member?(set2, term) do
      true ->
        do_difference(tl(set1_list), set2, difference_set)
      false ->
        do_difference(tl(set1_list), set2, %{ difference_set | set: difference_set.set ++ [term]})
    end
  end

  def intersection(set1, set2) do
    do_intersection(to_list(set1), set2, new())
  end

  def do_intersection([], _, intersection_set) do
    intersection_set
  end

  def do_intersection(set1_list, set2, intersection_set) do
    term = hd(set1_list)
    case member?(set2, term) do
      false ->
        do_intersection(tl(set1_list), set2, intersection_set)
      true ->
        do_intersection(tl(set1_list), set2, %{ intersection_set | set: intersection_set.set ++ [term]})
    end
  end

  def union(set1, set2) do
    %{ set1 | set: set1.set ++ set2.set}
  end

  def disjoint?(set1, set2) do
    size(intersection(set1, set2)) == 0
  end

  def subset?(set1, set2) do
    do_subset?(to_list(set1), set2)
  end

  def do_subset?([], _) do
    true
  end

  def do_subset?(set1_list, set2) do
    term = hd(set1_list)
    case member?(set2, term) do
      false ->
        false
      true ->
        do_subset?(tl(set1_list), set2)
    end
  end

end
