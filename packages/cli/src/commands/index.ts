import { unifiedSyncCommand } from './sync.js';
import { syncSkillsCommand } from './sync-skills.js';
import { syncAgentsCommand } from './sync-agents.js';
import { syncToClaudeCommand } from './sync-to-claude.js';
import { listCommand } from './list.js';
import { initCommand } from './init.js';
import { doctorCommand } from './doctor.js';
export const commands = {
  sync: unifiedSyncCommand,
  syncSkills: syncSkillsCommand,
  syncAgents: syncAgentsCommand,
  syncToClaude: syncToClaudeCommand,
  list: listCommand,
  init: initCommand,
  doctor: doctorCommand,
};

export { unifiedSyncCommand, syncSkillsCommand, syncAgentsCommand, syncToClaudeCommand, listCommand, initCommand, doctorCommand };
