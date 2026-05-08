/**
 * Types for opito CLI
 */

export interface CommandConfig {
  name: string;
  description: string;
  content: string;
  frontmatter: Record<string, unknown>;
  sourcePath: string;
}

export interface SyncOptions {
  dryRun?: boolean;
  force?: boolean;
  watch?: boolean;
  filter?: string[];
}

export interface ListOptions {
  source?: 'claude' | 'opencode' | 'all';
  format?: 'table' | 'json';
}

export interface DiffOptions {
  command?: string;
}

export interface DroidConfig {
  commandsPath: string;
  skillsPath?: string;
  agentsPath?: string;
  enabled: boolean;
}

export interface OpitoConfig {
  claude: {
    commandsPath: string;
    skillsPath?: string;
    agentsPath?: string;
  };
  opencode: {
    commandsPath: string;
    skillsPath?: string;
    agentsPath?: string;
  };
  droid: DroidConfig;
  backup: {
    enabled: boolean;
    maxBackups: number;
    path: string;
  };
  baseProvider: Provider;
}

export type SyncTarget = 'claude' | 'opencode';
export type SyncDirection = 'to' | 'from' | 'bidirectional';

export type Provider = 'claude' | 'opencode' | 'droid';
export type Scope = 'local' | 'global';

export interface UnifiedSyncOptions extends SyncOptions {
  provider?: Provider;
  target?: Provider;
  scope?: Scope;
  interactive?: boolean;
}

export interface SyncResult {
  success: boolean;
  command: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  error?: string;
}

export interface SyncReport {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: SyncResult[];
}

export interface ParsedFrontmatter {
  description?: string;
  [key: string]: unknown;
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

/**
 * Skill configuration for sync skills operations
 */
export interface SkillConfig {
  name: string;
  description: string;
  content: string;
  sourcePath: string;
  frontmatter: SkillFrontmatter;
}

/**
 * Frontmatter fields for skills across all providers
 */
export interface SkillFrontmatter {
  // Common fields (required)
  name: string;
  description: string;
  // Claude specific
  allowedTools?: string[];
  // Droid specific
  userInvocable?: boolean;
  disableModelInvocation?: boolean;
  // OpenCode specific
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
}

/**
 * Options for sync skills operations
 */
export interface SyncSkillsOptions extends SyncOptions {
  from?: SkillProvider;
  to?: SkillProvider;
}

/**
 * Result of syncing a single skill
 */
export interface SyncSkillResult {
  success: boolean;
  skill: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  error?: string;
}

/**
 * Report for sync skills operations
 */
export interface SyncSkillsReport {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: SyncSkillResult[];
}

/**
 * Providers that support skills
 */
export type SkillProvider = 'claude' | 'droid' | 'opencode' | 'codex';

/**
 * Codex-specific tool dependency configuration
 */
export interface CodexToolDependency {
  type: string;
  value: string;
  description?: string;
  transport?: string;
  url?: string;
}

/**
 * Codex-specific interface configuration for UI metadata
 */
export interface CodexInterfaceConfig {
  displayName?: string;
  shortDescription?: string;
  iconSmall?: string;
  iconLarge?: string;
  brandColor?: string;
  defaultPrompt?: string;
}

/**
 * Codex-specific policy configuration
 */
export interface CodexPolicyConfig {
  allowImplicitInvocation?: boolean;
}

/**
 * Extended skill frontmatter for Codex with agents/openai.yaml support
 */
export interface CodexSkillFrontmatter extends SkillFrontmatter {
  policy?: CodexPolicyConfig;
  dependencies?: {
    tools?: CodexToolDependency[];
  };
  interface?: CodexInterfaceConfig;
}

export type AgentProvider = 'claude' | 'opencode' | 'droid';

export interface AgentConfig {
  name: string;
  description: string;
  content: string;
  sourcePath: string;
  frontmatter: AgentFrontmatter;
}

export interface AgentFrontmatter {
  name: string;
  description: string;
  instructions?: string;
  enabled?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  userInvocable?: boolean;
  disableModelInvocation?: boolean;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
}

export interface SyncAgentsOptions extends SyncOptions {
  from?: AgentProvider;
  to?: AgentProvider;
}

export interface SyncAgentResult {
  success: boolean;
  agent: string;
  action: 'created' | 'updated' | 'skipped' | 'removed' | 'error';
  error?: string;
}

export interface SyncAgentsReport {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  removed: number;
  errors: number;
  results: SyncAgentResult[];
}
