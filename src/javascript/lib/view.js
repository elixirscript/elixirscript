import Kernel from './kernel';
import Keyword from './keyword';
import VirtualDOM from './virtual-dom';


const start = function(domRoot, renderFn, initialState, options = []){
  const name = Keyword.has_key__qm__(options, Kernel.SpecialForms.atom("name")) ? Keyword.get(options, Kernel.SpecialForms.atom("name")) : Symbol();

  self.post_office.add_mailbox(name);

  const tree = renderFn.apply(this, initialState);
  const rootNode = VirtualDOM.create(tree);

  domRoot.appendChild(rootNode);
  self.post_office.send(name, Kernel.SpecialForms.tuple(rootNode, tree, renderFn));

  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), name);
}

const stop = function(agent, timeout = 5000){
  self.post_office.remove_mailbox(agent);
  return Kernel.SpecialForms.atom("ok");
}


const update = function(agent, state){

  const current_state = self.post_office.receive(agent);

  let rootNode = Kernel.elem(current_state, 0);
  let tree = Kernel.elem(current_state, 1);
  let renderFn = Kernel.elem(current_state, 2);

  let newTree = renderFn.apply(this, state);

  let patches = VirtualDOM.diff(tree, newTree)
  rootNode = VirtualDOM.patch(rootNode, patches)


  self.post_office.send(agent, Kernel.SpecialForms.tuple(rootNode, newTree, renderFn));

  return Kernel.SpecialForms.atom("ok");
}


export default {
  start,
  stop,
  update
}
