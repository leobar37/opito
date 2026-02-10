import { syncCommand } from './sync.js';
import { syncCopilotCommand } from './sync-copilot.js';
import { listCommand } from './list.js';
import { diffCommand } from './diff.js';
import { initCommand } from './init.js';
import { doctorCommand } from './doctor.js';

export const commands = {
  sync: syncCommand,
  syncCopilot: syncCopilotCommand,
  list: listCommand,
  diff: diffCommand,
  init: initCommand,
  doctor: doctorCommand,
};

export { syncCommand, syncCopilotCommand, listCommand, diffCommand, initCommand, doctorCommand };
