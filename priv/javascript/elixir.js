import PostOffice from './lib/post_office';
import ProcessManager from './lib/processes/process_manager';


self.post_office = self.post_office || new PostOffice();
self.process_manager = self.process_manager || new ProcessManager();

export { default as Patterns } from './lib/patterns/patterns';
export { default as BitString } from './lib/bit_string';
export { default as Kernel } from './lib/kernel';
export { default as Atom } from './lib/atom';
export { default as Enum } from './lib/enum';
export { default as Integer } from './lib/integer';
export { default as JS } from './lib/js';
export { default as List } from './lib/list';
export { default as Range } from './lib/range';
export { default as Tuple } from './lib/tuple';
export { default as Agent } from './lib/agent';
export { default as Keyword } from './lib/keyword';