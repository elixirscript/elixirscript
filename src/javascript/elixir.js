import * as Core from "./lib/core";

self.processes = self.processes || new Core.ProcessSystem();

export Core;
export { default as Patterns } from './lib/patterns/patterns';
export { default as Kernel } from './lib/kernel';
export { default as Atom } from './lib/atom';
export { default as Enum } from './lib/enum';
export { default as Integer } from './lib/integer';
export { default as List } from './lib/list';
export { default as Range } from './lib/range';
export { default as Tuple } from './lib/tuple';
export { default as Agent } from './lib/agent';
export { default as Keyword } from './lib/keyword';
export { default as Base } from './lib/base';
export { default as String } from './lib/string';
export { default as Bitwise } from './lib/bitwise';
export { default as Enumerable } from './lib/enumerable';
export { default as Collectable } from './lib/collectable';
export { default as Inspect } from './lib/inspect';
export { default as Map } from './lib/map';
export { default as Set } from './lib/set';
export { default as MapSet } from './lib/map_set';
export { default as VirtualDOM } from './lib/virtual-dom';
export { default as View } from './lib/view';
