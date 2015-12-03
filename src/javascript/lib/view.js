import Kernel from './kernel';
import Keyword from './keyword';
import VirtualDOM from './virtual-dom';


const start = function(domRoot, renderFn, initialState, options = []){
  let pid = self.processes.spawn();

  if(Keyword.has_key__qm__(options, Kernel.SpecialForms.atom("name"))){
    pid = self.processes.register(Keyword.get(options, Kernel.SpecialForms.atom("name")), pid)
  }

  const tree = renderFn.apply(this, initialState);
  const rootNode = VirtualDOM.create(tree);

  domRoot.appendChild(rootNode);

  self.processes.put(pid, "state", Kernel.SpecialForms.tuple(rootNode, tree, renderFn));
  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), pid);
}

const stop = function(agent, timeout = 5000){
  self.processes.exit(agent);
  return Kernel.SpecialForms.atom("ok");
}

const render = function(agent, state){

  const current_state = self.processes.get(agent, "state");

  let rootNode = Kernel.elem(current_state, 0);
  let tree = Kernel.elem(current_state, 1);
  let renderFn = Kernel.elem(current_state, 2);

  let newTree = renderFn.apply(this, state);

  let patches = VirtualDOM.diff(tree, newTree)
  rootNode = VirtualDOM.patch(rootNode, patches)


  self.processes.put(agent, "state", Kernel.SpecialForms.tuple(rootNode, newTree, renderFn));

  return Kernel.SpecialForms.atom("ok");
}


export default {
  start,
  stop,
  render
}
