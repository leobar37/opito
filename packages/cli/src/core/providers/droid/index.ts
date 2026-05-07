/**
 * Droid (Factory AI) Provider Strategy
 * 
 * Supports: commands, skills, agents
 */
import {
  DroidParser,
  DroidSkillParser,
  DroidAgentParser,
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

export class DroidStrategy implements IProviderStrategy {
  readonly name = 'droid';
  readonly displayName = 'Droid (Factory AI)';
  readonly capabilities = PROVIDER_CAPABILITIES.droid!;

  private config!: ProviderStrategyConfig;
  private commandParser!: DroidParser;
  private skillParser!: DroidSkillParser;
  private agentParser!: DroidAgentParser;
  private skillConverter = new SkillConverter();
  private agentConverter = new AgentConverter();

  initialize(config: ProviderStrategyConfig): void {
    this.config = config;
    const basePath = config.basePath;
    this.commandParser = new DroidParser(basePath);
    this.skillParser = new DroidSkillParser(basePath);
    this.agentParser = new DroidAgentParser(basePath);
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
    return this.skillConverter.writeSkill(skill, 'droid', this.config.basePath);
  }

  async skillExists(name: string): Promise<boolean> {
    return this.skillParser.skillExists(name);
  }

  async parseAgents(): Promise<AgentConfig[]> {
    return this.agentParser.parseAll();
  }

  async writeAgent(agent: AgentConfig): Promise<void> {
    return this.agentConverter.writeAgent(agent, 'droid', this.config.basePath);
  }

  async agentExists(name: string): Promise<boolean> {
    return this.agentParser.agentExists(name);
  }
}
