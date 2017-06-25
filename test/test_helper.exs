exclude = if Node.alive?, do: [], else: [skip: true]

ExUnit.start(exclude: exclude)
