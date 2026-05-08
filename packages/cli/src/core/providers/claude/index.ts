/**
 * Claude Code Provider Strategy
 * 
 * Supports: commands, skills, agents
 * 
 * Wraps existing Claude parsers to implement IProviderStrategy
 */
import {
  ClaudeParser,
  ClaudeSkillParser,
  ClaudeAgentParser,
} from '../../parsers/index.js';
import { AgentConverter, SkillConverter } from '../../converters/index.js';
import type {
  CommandConfig,
  SkillConfig,
  AgentConfig,
} from '../../types/index.js';
import type {
  IProviderStrategy,
  ProviderStrategyConfig,
} from '../../strategies/base-strategy.js';
import { PROVIDER_CAPABILITIES } from '../../strategies/capabilities.js';

export class ClaudeStrategy implements IProviderStrategy {
  readonly name = 'claude';
  readonly displayName = 'Claude Code';
  readonly capabilities = PROVIDER_CAPABILITIES.claude!;

  private config!: ProviderStrategyConfig;
  private commandParser!: ClaudeParser;
  private skillParser!: ClaudeSkillParser;
  private agentParser!: ClaudeAgentParser;
  private skillConverter = new SkillConverter();
  private agentConverter = new AgentConverter();

  initialize(config: ProviderStrategyConfig): void {
    this.config = config;
    const commandsPath = config.commandsPath ?? config.basePath;
    const skillsPath = config.skillsPath ?? config.basePath;
    const agentsPath = config.agentsPath ?? config.basePath;
    this.commandParser = new ClaudeParser(commandsPath);
    this.skillParser = new ClaudeSkillParser(skillsPath);
    this.agentParser = new ClaudeAgentParser(agentsPath);
  }

  // ─── Commands ───

  async parseCommands(): Promise<CommandConfig[]> {
    return this.commandParser.parseAll();
  }

  async writeCommand(command: CommandConfig): Promise<void> {
    return this.commandParser.writeCommand(command);
  }

  async commandExists(name: string): Promise<boolean> {
    return this.commandParser.commandExists(name);
  }

  // ─── Skills ───

  async parseSkills(): Promise<SkillConfig[]> {
    return this.skillParser.parseAll();
  }

  async writeSkill(skill: SkillConfig): Promise<void> {
    return this.skillConverter.writeSkill(skill, 'claude', this.config.skillsPath ?? this.config.basePath);
  }

  async skillExists(name: string): Promise<boolean> {
    return this.skillParser.skillExists(name);
  }

  // ─── Agents ───

  async parseAgents(): Promise<AgentConfig[]> {
    return this.agentParser.parseAll();
  }

  async writeAgent(agent: AgentConfig): Promise<void> {
    return this.agentConverter.writeAgent(agent, 'claude', this.config.agentsPath ?? this.config.basePath);
  }

  async agentExists(name: string): Promise<boolean> {
    return this.agentParser.agentExists(name);
  }
}
