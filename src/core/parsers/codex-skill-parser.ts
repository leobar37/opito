/**
 * Codex skill parser
 * 
 * Codex skills follow the agentskills.io specification with additional
 * metadata in agents/openai.yaml for UI configuration, policies, and
 * MCP dependencies.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import YAML from 'yaml';
import { SkillParser } from './skill-parser.js';
import type { CodexSkillFrontmatter, SkillFrontmatter } from '../../types/index.js';

interface OpenAIYamlConfig {
  interface?: {
    display_name?: string;
    short_description?: string;
    icon_small?: string;
    icon_large?: string;
    brand_color?: string;
    default_prompt?: string;
  };
  policy?: {
    allow_implicit_invocation?: boolean;
  };
  dependencies?: {
    tools?: Array<{
      type: string;
      value: string;
      description?: string;
      transport?: string;
      url?: string;
    }>;
  };
}

export class CodexSkillParser extends SkillParser {
  protected extractFrontmatter(
    raw: Record<string, unknown>,
    name: string,
    description: string
  ): SkillFrontmatter {
    // Start with base frontmatter
    const base: CodexSkillFrontmatter = {
      name,
      description,
    };

    return base;
  }

  /**
   * Parse a single skill directory, including agents/openai.yaml if present
   */
  async parseSkill(skillName: string): Promise<CodexSkillFrontmatter | null> {
    const skillDir = join(this.skillsPath, skillName);
    const skillMdPath = join(skillDir, 'SKILL.md');
    const openaiYamlPath = join(skillDir, 'agents', 'openai.yaml');

    try {
      // Read SKILL.md
      const skillContent = await readFile(skillMdPath, 'utf-8');
      const parsed = this.parseSkillFile(skillContent, skillName, skillMdPath);
      
      if (!parsed) {
        return null;
      }

      // Try to read agents/openai.yaml for additional metadata
      let openaiConfig: OpenAIYamlConfig = {};
      try {
        const yamlContent = await readFile(openaiYamlPath, 'utf-8');
        openaiConfig = YAML.parse(yamlContent) || {};
      } catch {
        // agents/openai.yaml is optional, ignore if not present
      }

      // Merge SKILL.md frontmatter with openai.yaml config
      const frontmatter: CodexSkillFrontmatter = {
        ...parsed.frontmatter,
        name: parsed.frontmatter.name,
        description: parsed.frontmatter.description,
      };

      // Add interface metadata from openai.yaml
      if (openaiConfig.interface) {
        frontmatter.interface = {
          displayName: openaiConfig.interface.display_name,
          shortDescription: openaiConfig.interface.short_description,
          iconSmall: openaiConfig.interface.icon_small,
          iconLarge: openaiConfig.interface.icon_large,
          brandColor: openaiConfig.interface.brand_color,
          defaultPrompt: openaiConfig.interface.default_prompt,
        };
      }

      // Add policy from openai.yaml
      if (openaiConfig.policy) {
        frontmatter.policy = {
          allowImplicitInvocation: openaiConfig.policy.allow_implicit_invocation,
        };
      }

      // Add dependencies from openai.yaml
      if (openaiConfig.dependencies?.tools) {
        frontmatter.dependencies = {
          tools: openaiConfig.dependencies.tools.map(tool => ({
            type: tool.type,
            value: tool.value,
            description: tool.description,
            transport: tool.transport,
            url: tool.url,
          })),
        };
      }

      return frontmatter;
    } catch {
      return null;
    }
  }
}
