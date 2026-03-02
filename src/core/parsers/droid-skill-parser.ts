/**
 * Droid (Factory AI) skill parser
 */
import { SkillParser } from './skill-parser.js';
import type { SkillFrontmatter } from '../../types/index.js';

export class DroidSkillParser extends SkillParser {
  protected extractFrontmatter(
    raw: Record<string, unknown>,
    name: string,
    description: string
  ): SkillFrontmatter {
    const userInvocable = raw['user-invocable'];
    const disableModelInvocation = raw['disable-model-invocation'];

    return {
      name,
      description,
      userInvocable: typeof userInvocable === 'boolean' ? userInvocable : undefined,
      disableModelInvocation: typeof disableModelInvocation === 'boolean'
        ? disableModelInvocation
        : undefined,
    };
  }
}
