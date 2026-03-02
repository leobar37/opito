/**
 * Base skill parser for reading SKILL.md files
 */
import YAML from 'yaml';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { SkillConfig, SkillFrontmatter } from '../../types/index.js';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  content: string;
}

export abstract class SkillParser {
  protected skillsPath: string;

  constructor(skillsPath: string) {
    this.skillsPath = skillsPath;
  }

  /**
   * Parse all skills from the skills directory
   */
  async parseAll(): Promise<SkillConfig[]> {
    const skills: SkillConfig[] = [];

    try {
      const entries = await readdir(this.skillsPath, { withFileTypes: true });
      const skillDirs = entries.filter(entry => entry.isDirectory());

      for (const dir of skillDirs) {
        const skillPath = join(this.skillsPath, dir.name, 'SKILL.md');
        try {
          const skillStat = await stat(skillPath);
          if (!skillStat.isFile()) continue;

          const content = await readFile(skillPath, 'utf-8');
          const parsed = this.parseSkillFile(content, dir.name, skillPath);
          if (parsed) {
            skills.push(parsed);
          }
        } catch {
          // SKILL.md doesn't exist in this directory, skip
          continue;
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
      return [];
    }

    return skills;
  }

  /**
   * Parse a single SKILL.md file
   */
  parseSkillFile(content: string, dirName: string, sourcePath: string): SkillConfig | null {
    const match = content.match(FRONTMATTER_REGEX);

    if (!match) {
      return null;
    }

    const frontmatterText = match[1] ?? '';
    const bodyContent = match[2];

    if (!bodyContent) {
      return null;
    }

    let rawFrontmatter: Record<string, unknown>;
    try {
      rawFrontmatter = YAML.parse(frontmatterText) || {};
    } catch {
      rawFrontmatter = {};
    }

    // Validate required fields
    const name = String(rawFrontmatter.name || dirName);
    const description = String(rawFrontmatter.description || '');

    if (!description) {
      return null;
    }

    const frontmatter = this.extractFrontmatter(rawFrontmatter, name, description);

    return {
      name,
      description,
      content: bodyContent.trim(),
      frontmatter,
      sourcePath,
    };
  }

  /**
   * Extract provider-specific frontmatter fields
   */
  protected abstract extractFrontmatter(
    raw: Record<string, unknown>,
    name: string,
    description: string
  ): SkillFrontmatter;

  /**
   * Check if a skill exists
   */
  async skillExists(name: string): Promise<boolean> {
    try {
      const entries = await readdir(this.skillsPath, { withFileTypes: true });
      return entries.some(entry => entry.isDirectory() && entry.name === name);
    } catch {
      return false;
    }
  }
}
