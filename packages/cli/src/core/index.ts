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

// Core sync (Provider Strategy Architecture)
export { SyncEngine } from './sync/v2/index.js';
export type { SyncEngineOptions, ConverterFn, WriteFn } from './sync/v2/index.js';
export {
  PROVIDERS,
  getProviderPaths,
  createParser,
  getDefaultTarget,
  isValidProvider,
  isValidScope,
  getAllProviders,
  getProviderDisplayName,
  getProviderInfo,
  type ParserInstance,
  type ProviderPaths,
} from './sync/providers.js';

// Parsers
export { ClaudeParser } from './parsers/claude.js';
export { OpencodeParser } from './parsers/opencode.js';
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

// Converters
export { AgentConverter } from './converters/agent-converter.js';
export { SkillConverter } from './converters/skill-converter.js';


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

// Strategies (NEW - Provider Strategy Architecture)
export type {
  IProviderStrategy,
  ProviderStrategyConfig,
} from './strategies/base-strategy.js';
export {
  ProviderCapabilityError,
  isProviderStrategy,
} from './strategies/base-strategy.js';
export type {
  FeatureType,
  ProviderCapabilities,
} from './strategies/capabilities.js';
export {
  PROVIDER_CAPABILITIES,
  supportsFeature,
  getSupportedFeatures,
} from './strategies/capabilities.js';
export {
  strategyRegistry,
  StrategyRegistry,
  isValidStrategy,
  getStrategyDisplayName,
} from './strategies/registry.js';

// Provider Strategies (NEW)
export {
  ClaudeStrategy,
  OpencodeStrategy,
  DroidStrategy,
  CodexStrategy,
} from './providers/index.js';
export {
  registerBuiltInStrategies,
  initializeStrategies,
  setupStrategies,
} from './providers/setup.js';

// Plugins
export type { Plugin } from './plugins/base.js';
export { BasePlugin } from './plugins/base.js';
export { pluginRegistry } from './plugins/registry.js';
