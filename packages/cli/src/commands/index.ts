import { unifiedSyncCommand } from './sync.js';
import { listCommand } from './list.js';
import { initCommand } from './init.js';
import { doctorCommand } from './doctor.js';
export const commands = {
  sync: unifiedSyncCommand,
  list: listCommand,
  init: initCommand,
  doctor: doctorCommand,
};

export { unifiedSyncCommand, listCommand, initCommand, doctorCommand };
