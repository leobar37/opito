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

export interface CopilotConfig {
  promptsPath: string;
  instructionsPath: string;
  agentsPath: string;
  enabled: boolean;
}

export interface DroidConfig {
  commandsPath: string;
  enabled: boolean;
}

export interface OpitoConfig {
  claude: {
    commandsPath: string;
  };
  opencode: {
    commandsPath: string;
  };
  copilot: CopilotConfig;
  droid: DroidConfig;
  backup: {
    enabled: boolean;
    maxBackups: number;
    path: string;
  };
  baseProvider: Provider;
}

export type SyncTarget = 'claude' | 'opencode' | 'copilot';
export type SyncDirection = 'to' | 'from' | 'bidirectional';

export type Provider = 'claude' | 'opencode' | 'copilot' | 'droid';
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
 * Skill configuration for sync-skills command
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
 * Options for sync-skills command
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
 * Report for sync-skills operation
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
export type SkillProvider = 'claude' | 'droid' | 'opencode';
