const __MODULE_ = Symbol('Kernel');

export function tl(list){
  return list.slice(1);
}

export function hd(list){
  return list.slice(0,1)[0];
}