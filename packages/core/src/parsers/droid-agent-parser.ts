/**
 * Droid (Factory AI) agent parser
 * 
 * Droid agents are stored as markdown files directly in the droids directory,
 * rather than in subdirectories with AGENT.md files like Claude/OpenCode.
 */
import YAML from 'yaml';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentConfig, AgentFrontmatter } from './agent-parser.js';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export class DroidAgentParser {
  private droidsPath: string;

  constructor(droidsPath: string) {
    this.droidsPath = droidsPath;
  }

  /**
   * Parse all agents from the droids directory
   * Each .md file represents an agent
   */
  async parseAll(): Promise<AgentConfig[]> {
    const agents: AgentConfig[] = [];

    try {
      const entries = await readdir(this.droidsPath, { withFileTypes: true });
      const mdFiles = entries.filter(
        entry => entry.isFile() && entry.name.endsWith('.md')
      );

      for (const file of mdFiles) {
        const filePath = join(this.droidsPath, file.name);
        try {
          const content = await readFile(filePath, 'utf-8');
          const parsed = this.parseAgentFile(content, file.name, filePath);
          if (parsed) {
            agents.push(parsed);
          }
        } catch {
          continue;
        }
      }
    } catch {
      return [];
    }

    return agents;
  }

  /**
   * Parse a single markdown agent file
   */
  parseAgentFile(content: string, filename: string, sourcePath: string): AgentConfig | null {
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
    let parseError = false;
    try {
      rawFrontmatter = YAML.parse(frontmatterText) || {};
    } catch {
      rawFrontmatter = {};
      parseError = true;
    }

    // Extract name (from filename or frontmatter)
    const name = String(rawFrontmatter.name || filename.replace('.md', ''));
    let description = String(rawFrontmatter.description || '');

    // Fallback: if YAML parsing failed or description is empty, try to extract from raw text
    if (parseError || !description) {
      const descMatch = frontmatterText.match(/^description:\s*(.+)$/m);
      if (descMatch && descMatch[1]) {
        description = descMatch[1].trim();
      }
    }

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
   * Extract provider-specific frontmatter fields for Droid
   */
  protected extractFrontmatter(
    raw: Record<string, unknown>,
    name: string,
    description: string
  ): AgentFrontmatter {
    const model = raw['model'];
    const tools = raw['tools'];
    const userInvocable = raw['user-invocable'];
    const disableModelInvocation = raw['disable-model-invocation'];

    return {
      name,
      description,
      model: typeof model === 'string' ? model : undefined,
      tools: Array.isArray(tools)
        ? tools.map(t => String(t))
        : undefined,
      userInvocable: typeof userInvocable === 'boolean' ? userInvocable : undefined,
      disableModelInvocation: typeof disableModelInvocation === 'boolean'
        ? disableModelInvocation
        : undefined,
    };
  }

  /**
   * Check if an agent exists
   */
  async agentExists(name: string): Promise<boolean> {
    try {
      const entries = await readdir(this.droidsPath, { withFileTypes: true });
      return entries.some(
        entry => entry.isFile() && entry.name === `${name}.md`
      );
    } catch {
      return false;
    }
  }
}
