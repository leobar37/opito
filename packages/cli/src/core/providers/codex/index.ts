/**
 * Codex Provider Strategy
 *
 * Supports: skills only (no commands, no agents)
 *
 * Codex skills follow the agentskills.io specification with optional
 * agents/openai.yaml for UI configuration, policies, and MCP dependencies.
 */
import { CodexSkillParser } from "../../parsers/index.js";
import { SkillConverter } from "../../converters/index.js";
import type {
  CommandConfig,
  SkillConfig,
  AgentConfig,
} from "../../types/index.js";
import type {
  IProviderStrategy,
  ProviderStrategyConfig,
} from "../../strategies/base-strategy.js";
import { ProviderCapabilityError } from "../../strategies/base-strategy.js";
import { PROVIDER_CAPABILITIES } from "../../strategies/capabilities.js";

export class CodexStrategy implements IProviderStrategy {
  readonly name = "codex";
  readonly displayName = "Codex";
  readonly capabilities = PROVIDER_CAPABILITIES.codex!;

  private config!: ProviderStrategyConfig;
  private skillParser!: CodexSkillParser;
  private skillConverter = new SkillConverter();

  initialize(config: ProviderStrategyConfig): void {
    this.config = config;
    this.skillParser = new CodexSkillParser(config.basePath);
  }

  // ─── Commands: NOT SUPPORTED ───

  async parseCommands(): Promise<CommandConfig[]> {
    throw new ProviderCapabilityError(this.name, "commands");
  }

  async writeCommand(_command: CommandConfig): Promise<void> {
    throw new ProviderCapabilityError(this.name, "commands");
  }

  async commandExists(_name: string): Promise<boolean> {
    throw new ProviderCapabilityError(this.name, "commands");
  }

  // ─── Skills: SUPPORTED ───

  async parseSkills(): Promise<SkillConfig[]> {
    return this.skillParser.parseAll();
  }

  async writeSkill(skill: SkillConfig): Promise<void> {
    return this.skillConverter.writeSkill(skill, "codex", this.config.basePath);
  }

  async skillExists(name: string): Promise<boolean> {
    return this.skillParser.skillExists(name);
  }

  // ─── Agents: NOT SUPPORTED ───

  async parseAgents(): Promise<AgentConfig[]> {
    throw new ProviderCapabilityError(this.name, "agents");
  }

  async writeAgent(_agent: AgentConfig): Promise<void> {
    throw new ProviderCapabilityError(this.name, "agents");
  }

  async agentExists(_name: string): Promise<boolean> {
    throw new ProviderCapabilityError(this.name, "agents");
  }
}
