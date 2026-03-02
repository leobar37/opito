import { unifiedSyncCommand, legacySyncCommand } from './sync.js';
import { syncCopilotCommand } from './sync-copilot.js';
import { syncDroidCommand } from './sync-droid.js';
import { syncSkillsCommand } from './sync-skills.js';
import { listCommand } from './list.js';
import { initCommand } from './init.js';
import { doctorCommand } from './doctor.js';

export const commands = {
  sync: unifiedSyncCommand,
  legacySync: legacySyncCommand,
  syncCopilot: syncCopilotCommand,
  syncDroid: syncDroidCommand,
  syncSkills: syncSkillsCommand,
  list: listCommand,
  init: initCommand,
  doctor: doctorCommand,
};

export { unifiedSyncCommand, legacySyncCommand, syncCopilotCommand, syncDroidCommand, syncSkillsCommand, listCommand, initCommand, doctorCommand };
