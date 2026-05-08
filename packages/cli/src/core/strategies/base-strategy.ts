/**
 * Base interface for all provider strategies
 * 
 * Each provider (Claude, OpenCode, Droid, Codex) implements this interface
 * to expose parsing, writing, and existence-check capabilities.
 * 
 * Capabilities declare which features are supported. Methods for unsupported
 * features should throw ProviderCapabilityError.
 */
import type {
  CommandConfig,
  SkillConfig,
  AgentConfig,
} from '../types/index.js';
import type { ProviderCapabilities, FeatureType } from './capabilities.js';

/**
 * Error thrown when a provider method is called for an unsupported feature
 */
export class ProviderCapabilityError extends Error {
  constructor(
    public readonly provider: string,
    public readonly feature: FeatureType
  ) {
    super(
      `Provider "${provider}" does not support feature "${feature}"`
    );
    this.name = 'ProviderCapabilityError';
  }
}

/**
 * Configuration passed to initialize a provider strategy
 */
export interface ProviderStrategyConfig {
  /** Base path for the provider's data */
  basePath: string;
  /** Optional explicit path for commands */
  commandsPath?: string;
  /** Optional explicit path for skills */
  skillsPath?: string;
  /** Optional explicit path for agents/droids */
  agentsPath?: string;
  /** Optional provider-specific configuration */
  [key: string]: unknown;
}

/**
 * Base interface that all provider strategies must implement
 */
export interface IProviderStrategy {
  /** Unique provider identifier (e.g., 'claude', 'opencode') */
  readonly name: string;
  
  /** Human-readable display name */
  readonly displayName: string;
  
  /** Which features this provider supports */
  readonly capabilities: ProviderCapabilities;

  /**
   * Initialize the strategy with configuration
   * Called once before any parse/write operations
   */
  initialize(config: ProviderStrategyConfig): Promise<void> | void;

  // ─── Parse operations ───

  /**
   * Parse all commands from the provider's storage
   * @throws ProviderCapabilityError if commands not supported
   */
  parseCommands(): Promise<CommandConfig[]>;

  /**
   * Parse all skills from the provider's storage
   * @throws ProviderCapabilityError if skills not supported
   */
  parseSkills(): Promise<SkillConfig[]>;

  /**
   * Parse all agents from the provider's storage
   * @throws ProviderCapabilityError if agents not supported
   */
  parseAgents(): Promise<AgentConfig[]>;

  // ─── Write operations ───

  /**
   * Write a command to the provider's storage
   * @throws ProviderCapabilityError if commands not supported
   */
  writeCommand(command: CommandConfig): Promise<void>;

  /**
   * Write a skill to the provider's storage
   * @throws ProviderCapabilityError if skills not supported
   */
  writeSkill(skill: SkillConfig): Promise<void>;

  /**
   * Write an agent to the provider's storage
   * @throws ProviderCapabilityError if agents not supported
   */
  writeAgent(agent: AgentConfig): Promise<void>;

  // ─── Existence checks ───

  /**
   * Check if a command exists by name
   * @throws ProviderCapabilityError if commands not supported
   */
  commandExists(name: string): Promise<boolean>;

  /**
   * Check if a skill exists by name
   * @throws ProviderCapabilityError if skills not supported
   */
  skillExists(name: string): Promise<boolean>;

  /**
   * Check if an agent exists by name
   * @throws ProviderCapabilityError if agents not supported
   */
  agentExists(name: string): Promise<boolean>;
}

/**
 * Type guard to check if an object implements IProviderStrategy
 */
export function isProviderStrategy(obj: unknown): obj is IProviderStrategy {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.name === 'string' &&
    typeof s.displayName === 'string' &&
    s.capabilities !== undefined &&
    typeof s.parseCommands === 'function' &&
    typeof s.parseSkills === 'function' &&
    typeof s.parseAgents === 'function'
  );
}
