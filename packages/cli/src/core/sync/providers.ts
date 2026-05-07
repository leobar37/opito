import { cwd } from 'node:process';
import { join, resolve } from 'node:path';
import { ClaudeParser } from '../parsers/claude.js';
import { OpencodeParser } from '../parsers/opencode.js';
import { DroidParser } from '../parsers/droid.js';
import type { Provider, Scope, OpitoConfig } from '../types/index.js';

export interface ProviderInfo {
  name: Provider;
  displayName: string;
  description: string;
  supportsLocal: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    name: 'claude',
    displayName: 'Claude Code',
    description: 'Claude Code commands from ~/.claude/commands/',
    supportsLocal: false,
  },
  {
    name: 'opencode',
    displayName: 'OpenCode',
    description: 'OpenCode commands from ~/.config/opencode/commands/',
    supportsLocal: true,
  },
  {
    name: 'droid',
    displayName: 'Droid (Factory AI)',
    description: 'Factory AI Droid commands from ~/.factory/commands/',
    supportsLocal: true,
  },
];

export function getProviderInfo(name: Provider): ProviderInfo | undefined {
  return PROVIDERS.find(p => p.name === name);
}

export function getAllProviders(): Provider[] {
  return PROVIDERS.map(p => p.name);
}

export function getProviderDisplayName(name: Provider): string {
  return getProviderInfo(name)?.displayName || name;
}

export interface ProviderPaths {
  commandsPath: string;
  promptsPath?: string;
  instructionsPath?: string;
  agentsPath?: string;
}

export function getProviderPaths(
  provider: Provider,
  scope: Scope,
  config: OpitoConfig
): ProviderPaths {
  if (scope === 'local') {
    switch (provider) {
      case 'claude':
        return { commandsPath: config.claude.commandsPath };
      case 'opencode':
        return { commandsPath: resolve(cwd(), '.opencode', 'commands') };
      case 'droid':
        return { commandsPath: resolve(cwd(), '.factory', 'commands') };
      default:
        return { commandsPath: resolve(cwd(), '.opencode', 'commands') };
    }
  }

  switch (provider) {
    case 'claude':
      return { commandsPath: config.claude.commandsPath };
    case 'opencode':
      return { commandsPath: config.opencode.commandsPath };
    case 'droid':
      return { commandsPath: config.droid.commandsPath };
    default:
      return { commandsPath: config.opencode.commandsPath };
  }
}

export type ParserInstance = ClaudeParser | OpencodeParser | DroidParser;

export function createParser(provider: Provider, paths: ProviderPaths): ParserInstance {
  switch (provider) {
    case 'claude':
      return new ClaudeParser(paths.commandsPath);
    case 'opencode':
      return new OpencodeParser(paths.commandsPath);
    case 'droid':
      return new DroidParser(paths.commandsPath);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function getDefaultTarget(source: Provider): Provider | null {
  switch (source) {
    case 'claude':
      return 'opencode';
    case 'opencode':
      return 'claude';
    case 'droid':
      return 'claude';
    default:
      return null;
  }
}

export function isValidProvider(name: string): name is Provider {
  return PROVIDERS.some(p => p.name === name);
}

export function isValidScope(name: string): name is Scope {
  return name === 'local' || name === 'global';
}
