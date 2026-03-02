/**
 * OpenCode skill parser
 */
import { SkillParser } from './skill-parser.js';
import type { SkillFrontmatter } from '../../types/index.js';

export class OpencodeSkillParser extends SkillParser {
  protected extractFrontmatter(
    raw: Record<string, unknown>,
    name: string,
    description: string
  ): SkillFrontmatter {
    const license = raw['license'];
    const compatibility = raw['compatibility'];
    const metadata = raw['metadata'];

    return {
      name,
      description,
      license: typeof license === 'string' ? license : undefined,
      compatibility: typeof compatibility === 'string' ? compatibility : undefined,
      metadata: metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? metadata as Record<string, string>
        : undefined,
    };
  }
}
