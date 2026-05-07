/**
 * Setup and initialization for provider strategies
 * 
 * Registers all built-in strategies with the strategyRegistry
 * and initializes them with paths from the configuration.
 */
import {
  ClaudeStrategy,
  OpencodeStrategy,
  DroidStrategy,
  CodexStrategy,
} from './index.js';
import { strategyRegistry } from '../strategies/registry.js';
import type { OpitoConfig } from '../types/index.js';
import { getSkillsPath, getAgentsPath } from '../utils/config.js';
import type { Scope } from '../types/index.js';

/**
 * Register all built-in strategies (without initializing)
 */
export function registerBuiltInStrategies(): void {
  strategyRegistry.register(new ClaudeStrategy());
  strategyRegistry.register(new OpencodeStrategy());
  strategyRegistry.register(new DroidStrategy());
  strategyRegistry.register(new CodexStrategy());
}

/**
 * Initialize all registered strategies with configuration
 */
export async function initializeStrategies(
  config: OpitoConfig,
  scope: Scope = 'global'
): Promise<void> {
  const claude = strategyRegistry.get('claude');
  if (claude) {
    await claude.initialize({
      basePath: config.claude.commandsPath,
      skillsPath: getSkillsPath('claude', scope),
      agentsPath: getAgentsPath('claude', scope),
    });
  }

  const opencode = strategyRegistry.get('opencode');
  if (opencode) {
    await opencode.initialize({
      basePath: config.opencode.commandsPath,
      skillsPath: getSkillsPath('opencode', scope),
      agentsPath: getAgentsPath('opencode', scope),
    });
  }

  const droid = strategyRegistry.get('droid');
  if (droid) {
    await droid.initialize({
      basePath: config.droid.commandsPath,
      skillsPath: getSkillsPath('droid', scope),
      agentsPath: getAgentsPath('droid', scope),
    });
  }

  const codex = strategyRegistry.get('codex');
  if (codex) {
    await codex.initialize({
      basePath: getSkillsPath('codex', scope),
      skillsPath: getSkillsPath('codex', scope),
    });
  }
}

/**
 * Convenience: register + initialize in one call
 */
export async function setupStrategies(
  config: OpitoConfig,
  scope: Scope = 'global'
): Promise<void> {
  registerBuiltInStrategies();
  await initializeStrategies(config, scope);
}
