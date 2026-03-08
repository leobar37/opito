/**
 * Skill converter for transforming skills between different provider formats
 *
 * Rule: If strategy mapping is not possible, sync with full permissions
 */
import YAML from 'yaml';
import { mkdir, writeFile, readdir, readFile, stat, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { SkillConfig, SkillFrontmatter, SkillProvider, CodexSkillFrontmatter } from '../../types/index.js';

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
      case 'codex':
        return this.toCodexFormat(frontmatter, from, base);
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

    if (from === 'opencode' || from === 'codex') {
      // OpenCode and Codex don't have tool restrictions in frontmatter
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
   * Convert to Codex format
   */
  private toCodexFormat(
    frontmatter: SkillFrontmatter,
    from: SkillProvider,
    base: SkillFrontmatter
  ): CodexSkillFrontmatter {
    const codexFrontmatter = frontmatter as CodexSkillFrontmatter;

    return {
      ...base,
      policy: codexFrontmatter.policy,
      dependencies: codexFrontmatter.dependencies,
      interface: codexFrontmatter.interface,
    };
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
   * Also copies all supporting files from the source skill directory
   */
  async writeSkill(
    skill: SkillConfig,
    to: SkillProvider,
    skillsPath: string,
    sourceSkillPath?: string,
  ): Promise<void> {
    const skillDir = join(skillsPath, skill.name);
    await mkdir(skillDir, { recursive: true });

    const skillFile = join(skillDir, 'SKILL.md');
    const content = this.serializeSkill(skill, to);

    await writeFile(skillFile, content);

    // Copy supporting files if source path is provided
    if (sourceSkillPath) {
      await this.copySkillDirectory(sourceSkillPath, skillDir);
    }
  }

  /**
   * Copy all files from source skill directory to target
   * Preserves directory structure
   */
  private async copySkillDirectory(
    sourcePath: string,
    targetPath: string,
  ): Promise<void> {
    try {
      const entries = await readdir(sourcePath, { withFileTypes: true });

      for (const entry of entries) {
        const sourceFile = join(sourcePath, entry.name);
        const targetFile = join(targetPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively copy subdirectories
          await mkdir(targetFile, { recursive: true });
          await this.copySkillDirectory(sourceFile, targetFile);
        } else if (entry.isFile() && entry.name !== 'SKILL.md') {
          // Copy files except SKILL.md (which was already written)
          await copyFile(sourceFile, targetFile);
        }
      }
    } catch {
      // Source directory doesn't exist or can't be read, skip
    }
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
      case 'codex':
        // Codex uses standard agentskills.io format
        // Additional metadata goes in agents/openai.yaml, not SKILL.md frontmatter
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
