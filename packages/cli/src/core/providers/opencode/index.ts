/**
 * OpenCode Provider Strategy
 * 
 * Supports: commands, skills, agents
 */
import {
  OpencodeParser,
  OpencodeSkillParser,
  OpencodeAgentParser,
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

export class OpencodeStrategy implements IProviderStrategy {
  readonly name = 'opencode';
  readonly displayName = 'OpenCode';
  readonly capabilities = PROVIDER_CAPABILITIES.opencode!;

  private config!: ProviderStrategyConfig;
  private commandParser!: OpencodeParser;
  private skillParser!: OpencodeSkillParser;
  private agentParser!: OpencodeAgentParser;
  private skillConverter = new SkillConverter();
  private agentConverter = new AgentConverter();

  initialize(config: ProviderStrategyConfig): void {
    this.config = config;
    const commandsPath = config.commandsPath ?? config.basePath;
    const skillsPath = config.skillsPath ?? config.basePath;
    const agentsPath = config.agentsPath ?? config.basePath;
    this.commandParser = new OpencodeParser(commandsPath);
    this.skillParser = new OpencodeSkillParser(skillsPath);
    this.agentParser = new OpencodeAgentParser(agentsPath);
  }

  async parseCommands(): Promise<CommandConfig[]> {
    return this.commandParser.parseAll();
  }

  async writeCommand(command: CommandConfig): Promise<void> {
    return this.commandParser.writeCommand(command);
  }

  async commandExists(name: string): Promise<boolean> {
    return this.commandParser.commandExists(name);
  }

  async parseSkills(): Promise<SkillConfig[]> {
    return this.skillParser.parseAll();
  }

  async writeSkill(skill: SkillConfig): Promise<void> {
    return this.skillConverter.writeSkill(skill, 'opencode', this.config.skillsPath ?? this.config.basePath);
  }

  async skillExists(name: string): Promise<boolean> {
    return this.skillParser.skillExists(name);
  }

  async parseAgents(): Promise<AgentConfig[]> {
    return this.agentParser.parseAll();
  }

  async writeAgent(agent: AgentConfig): Promise<void> {
    return this.agentConverter.writeAgent(agent, 'opencode', this.config.agentsPath ?? this.config.basePath);
  }

  async agentExists(name: string): Promise<boolean> {
    return this.agentParser.agentExists(name);
  }
}
