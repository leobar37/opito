/**
 * Skill converter for transforming skills between different provider formats
 * 
 * Rule: If strategy mapping is not possible, sync with full permissions
 */
import YAML from 'yaml';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SkillConfig, SkillFrontmatter, SkillProvider } from '../../types/index.js';

export class SkillConverter {
  /**
   * Convert a skill from one provider format to another
   */
  convert(skill: SkillConfig, from: SkillProvider, to: SkillProvider): SkillConfig {
    const convertedFrontmatter = this.convertFrontmatter(skill.frontmatter, from, to);

    return {
      name: skill.name,
      description: skill.description,
      content: skill.content,
      frontmatter: convertedFrontmatter,
      sourcePath: skill.sourcePath,
    };
  }

  /**
   * Convert frontmatter between provider formats
   */
  private convertFrontmatter(
    frontmatter: SkillFrontmatter,
    from: SkillProvider,
    to: SkillProvider
  ): SkillFrontmatter {
    const base: SkillFrontmatter = {
      name: frontmatter.name,
      description: frontmatter.description,
    };

    // If same provider, return as-is
    if (from === to) {
      return { ...frontmatter };
    }

    switch (to) {
      case 'claude':
        return this.toClaudeFormat(frontmatter, from, base);
      case 'droid':
        return this.toDroidFormat(frontmatter, from, base);
      case 'opencode':
        return this.toOpencodeFormat(frontmatter, from, base);
      default:
        return base;
    }
  }

  /**
   * Convert to Claude Code format
   */
  private toClaudeFormat(
    frontmatter: SkillFrontmatter,
    from: SkillProvider,
    base: SkillFrontmatter
  ): SkillFrontmatter {
    // Claude uses allowed-tools
    // If coming from Droid with disableModelInvocation=true, no tools allowed
    // Otherwise, full permissions (no allowed-tools = all tools)

    if (from === 'droid') {
      if (frontmatter.disableModelInvocation === true) {
        // Model can't invoke = no tools allowed
        return {
          ...base,
          allowedTools: [],
        };
      }
      // Full permissions
      return base;
    }

    if (from === 'opencode') {
      // OpenCode doesn't have tool restrictions in frontmatter
      // Use full permissions
      return base;
    }

    // From Claude - preserve allowedTools if exists
    if (frontmatter.allowedTools !== undefined) {
      return {
        ...base,
        allowedTools: frontmatter.allowedTools,
      };
    }

    // Full permissions
    return base;
  }

  /**
   * Convert to Droid format
   */
  private toDroidFormat(
    frontmatter: SkillFrontmatter,
    from: SkillProvider,
    base: SkillFrontmatter
  ): SkillFrontmatter {
    // Droid uses user-invocable and disable-model-invocation

    if (from === 'claude') {
      // If Claude has allowedTools and it's empty, disable model invocation
      if (frontmatter.allowedTools !== undefined && frontmatter.allowedTools.length === 0) {
        return {
          ...base,
          userInvocable: true,
          disableModelInvocation: true,
        };
      }
      // Full permissions
      return {
        ...base,
        userInvocable: true,
        disableModelInvocation: false,
      };
    }

    if (from === 'opencode') {
      // OpenCode doesn't have invocation restrictions
      // Use full permissions
      return {
        ...base,
        userInvocable: true,
        disableModelInvocation: false,
      };
    }

    // From Droid - preserve if exists
    return {
      ...base,
      userInvocable: frontmatter.userInvocable ?? true,
      disableModelInvocation: frontmatter.disableModelInvocation ?? false,
    };
  }

  /**
   * Convert to OpenCode format
   */
  private toOpencodeFormat(
    frontmatter: SkillFrontmatter,
    from: SkillProvider,
    base: SkillFrontmatter
  ): SkillFrontmatter {
    // OpenCode uses license, compatibility, metadata
    // No invocation restrictions in frontmatter (those go in opencode.json)

    // Preserve OpenCode-specific fields if they exist
    return {
      ...base,
      license: frontmatter.license,
      compatibility: frontmatter.compatibility ?? from,
      metadata: frontmatter.metadata ?? {
        source: from,
        converted: 'true',
      },
    };
  }

  /**
   * Write a skill to disk in the target provider format
   */
  async writeSkill(
    skill: SkillConfig,
    to: SkillProvider,
    skillsPath: string
  ): Promise<void> {
    const skillDir = join(skillsPath, skill.name);
    await mkdir(skillDir, { recursive: true });

    const skillFile = join(skillDir, 'SKILL.md');
    const content = this.serializeSkill(skill, to);

    await writeFile(skillFile, content);
  }

  /**
   * Serialize a skill to markdown with frontmatter
   */
  private serializeSkill(skill: SkillConfig, to: SkillProvider): string {
    const frontmatter: Record<string, unknown> = {
      name: skill.frontmatter.name,
      description: skill.frontmatter.description,
    };

    // Add provider-specific fields
    switch (to) {
      case 'claude':
        if (skill.frontmatter.allowedTools !== undefined) {
          frontmatter['allowed-tools'] = skill.frontmatter.allowedTools;
        }
        break;
      case 'droid':
        if (skill.frontmatter.userInvocable !== undefined) {
          frontmatter['user-invocable'] = skill.frontmatter.userInvocable;
        }
        if (skill.frontmatter.disableModelInvocation !== undefined) {
          frontmatter['disable-model-invocation'] = skill.frontmatter.disableModelInvocation;
        }
        break;
      case 'opencode':
        if (skill.frontmatter.license !== undefined) {
          frontmatter['license'] = skill.frontmatter.license;
        }
        if (skill.frontmatter.compatibility !== undefined) {
          frontmatter['compatibility'] = skill.frontmatter.compatibility;
        }
        if (skill.frontmatter.metadata !== undefined) {
          frontmatter['metadata'] = skill.frontmatter.metadata;
        }
        break;
    }

    return `---\n${YAML.stringify(frontmatter)}---\n\n${skill.content}\n`;
  }
}
