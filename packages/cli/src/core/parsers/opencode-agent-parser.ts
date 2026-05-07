/**
 * OpenCode agent parser
 */
import { AgentParser } from './agent-parser.js';
import type { AgentFrontmatter } from './agent-parser.js';

export class OpencodeAgentParser extends AgentParser {
  protected extractFrontmatter(
    raw: Record<string, unknown>,
    name: string,
    description: string
  ): AgentFrontmatter {
    const model = raw['model'];
    const tools = raw['tools'];

    return {
      name,
      description,
      model: typeof model === 'string' ? model : undefined,
      tools: Array.isArray(tools)
        ? tools.map(t => String(t))
        : undefined,
    };
  }
}
