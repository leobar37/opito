/**
 * Claude Code skill parser
 */
import { SkillParser } from './skill-parser.js';
import type { SkillFrontmatter } from '../../types/index.js';

export class ClaudeSkillParser extends SkillParser {
  protected extractFrontmatter(
    raw: Record<string, unknown>,
    name: string,
    description: string
  ): SkillFrontmatter {
    const allowedTools = raw['allowed-tools'];

    return {
      name,
      description,
      allowedTools: Array.isArray(allowedTools)
        ? allowedTools.map(t => String(t))
        : undefined,
    };
  }
}
