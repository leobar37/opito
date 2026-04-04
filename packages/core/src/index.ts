// Types from index.ts
export type {
  OpitoConfig,
  CommandConfig,
  SyncOptions,
  SyncResult,
  SyncReport,
  Provider,
  Scope,
  SkillProvider,
  AgentProvider,
  ParsedFrontmatter,
  SkillConfig,
  SkillFrontmatter,
  SyncSkillsOptions,
  SyncSkillResult,
  SyncSkillsReport,
  CodexToolDependency,
  CodexInterfaceConfig,
  CodexPolicyConfig,
  CodexSkillFrontmatter,
  AgentConfig,
  AgentFrontmatter,
  SyncAgentsOptions,
  SyncAgentResult,
  SyncAgentsReport,
  CopilotConfig,
  DroidConfig,
  UnifiedSyncOptions,
  DiffOptions,
  ListOptions,
  LogLevel,
} from './types/index.js';

// Types from profiles.ts
export type {
  ProviderType,
  CliType,
  Profile,
  ProfileModel,
  OpitoConfig as ProfileOpitoConfig,
  ClaudeSettings,
  DroidSettings,
  DroidCustomModel,
} from './types/profiles.js';

// Utils
export { configManager } from './utils/config.js';
export * from './utils/fs.js';
export { logger } from './utils/logger.js';
export { loader, withLoader } from './utils/loader.js';
export * from './utils/prompts.js';
export { BackupManager } from './utils/backup.js';
export { getSkillsPath, detectLocalSkills, getAgentsPath, detectLocalAgents } from './utils/config.js';
export type { LocalSkillsDetection, LocalAgentsDetection } from './utils/config.js';

// Core sync
export { SyncEngine } from './sync/sync-engine.js';
export { Converter } from './sync/converter.js';
export {
  PROVIDERS,
  getProviderPaths,
  createParser,
  createConverter,
  getDefaultTarget,
  isValidProvider,
  isValidScope,
  getAllProviders,
  getProviderDisplayName,
  getProviderInfo,
  type ParserInstance,
  type ConverterInstance,
  type ProviderPaths,
} from './sync/providers.js';

// Parsers
export { ClaudeParser } from './parsers/claude.js';
export { OpencodeParser } from './parsers/opencode.js';
export { CopilotParser } from './parsers/copilot.js';
export { DroidParser } from './parsers/droid.js';
export { AgentParser } from './parsers/agent-parser.js';
export { SkillParser } from './parsers/skill-parser.js';
export { ClaudeAgentParser } from './parsers/claude-agent-parser.js';
export { OpencodeAgentParser } from './parsers/opencode-agent-parser.js';
export { DroidAgentParser } from './parsers/droid-agent-parser.js';
export { ClaudeSkillParser } from './parsers/claude-skill-parser.js';
export { OpencodeSkillParser } from './parsers/opencode-skill-parser.js';
export { CodexSkillParser } from './parsers/codex-skill-parser.js';
export { DroidSkillParser } from './parsers/droid-skill-parser.js';
export type { CopilotPromptConfig } from './parsers/copilot.js';

// Converters
export { AgentConverter } from './converters/agent-converter.js';
export { SkillConverter } from './converters/skill-converter.js';
export { DroidConverter } from './converters/droid-converter.js';
export { CopilotConverter } from './converters/copilot-converter.js';

// Profile Manager
export {
  ensureDirectories,
  getConfig,
  getProfilePath,
  profileExists,
  getProfile,
  saveProfile,
  deleteProfile,
  listProfiles,
  createDefaultProfile,
  getDefaultProfiles,
} from './sync/profile-manager.js';
