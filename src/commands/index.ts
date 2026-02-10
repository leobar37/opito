import { syncCommand } from './sync';
import { listCommand } from './list';
import { diffCommand } from './diff';
import { initCommand } from './init';
import { doctorCommand } from './doctor';

export const commands = {
  sync: syncCommand,
  list: listCommand,
  diff: diffCommand,
  init: initCommand,
  doctor: doctorCommand,
};

export { syncCommand, listCommand, diffCommand, initCommand, doctorCommand };
