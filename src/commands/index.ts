import { unifiedSyncCommand, legacySyncCommand } from './sync.js';
import { syncCopilotCommand } from './sync-copilot.js';
import { syncDroidCommand } from './sync-droid.js';
import { syncSkillsCommand } from './sync-skills.js';
import { syncToClaudeCommand } from './sync-to-claude.js';
import { listCommand } from './list.js';
import { initCommand } from './init.js';
import { doctorCommand } from './doctor.js';
import { providerCommand, setupProfileCommand } from './provider.js';
import { dashboardCommand } from './dashboard.js';

export const commands = {
  sync: unifiedSyncCommand,
  legacySync: legacySyncCommand,
  syncCopilot: syncCopilotCommand,
  syncDroid: syncDroidCommand,
  syncSkills: syncSkillsCommand,
  syncToClaude: syncToClaudeCommand,
  list: listCommand,
  init: initCommand,
  doctor: doctorCommand,
  provider: providerCommand,
  setupProfile: setupProfileCommand,
  dashboard: dashboardCommand,
};

export { unifiedSyncCommand, legacySyncCommand, syncCopilotCommand, syncDroidCommand, syncSkillsCommand, syncToClaudeCommand, listCommand, initCommand, doctorCommand, providerCommand, setupProfileCommand, dashboardCommand };
