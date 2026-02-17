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
