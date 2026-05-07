/**
 * Base agent parser for reading agent markdown files
 */
import YAML from 'yaml';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

/**
 * Agent frontmatter fields for all providers
 */
export interface AgentFrontmatter {
  // Common fields
  name: string;
  description: string;
  // Model support
  model?: string;
  // Tools support
  tools?: string[];
  // Provider-specific fields will be added by implementations
  [key: string]: unknown;
}

/**
 * Shared agent configuration shape
 */
export interface AgentConfig {
  name: string;
  description: string;
  content: string;
  sourcePath: string;
  frontmatter: AgentFrontmatter;
}

export interface ParsedAgent {
  frontmatter: AgentFrontmatter;
  content: string;
}

export abstract class AgentParser {
  protected agentsPath: string;

  constructor(agentsPath: string) {
    this.agentsPath = agentsPath;
  }

  /**
   * Parse all agents from the agents directory
   * Agents are stored as top-level .md files in the agents directory
   */
  async parseAll(): Promise<AgentConfig[]> {
    const agents: AgentConfig[] = [];

    try {
      const entries = await readdir(this.agentsPath, { withFileTypes: true });
      const agentFiles = entries.filter(
        entry => entry.isFile() && entry.name.endsWith('.md')
      );

      for (const file of agentFiles) {
        const agentPath = join(this.agentsPath, file.name);
        const name = file.name.replace('.md', '');
        
        try {
          const content = await readFile(agentPath, 'utf-8');
          const parsed = this.parseAgentFile(content, name, agentPath);
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
   * Parse a single agent markdown file
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

    const name = String(rawFrontmatter.name || filename);
    let description = String(rawFrontmatter.description || '');

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
   * Extract provider-specific frontmatter fields
   */
  protected abstract extractFrontmatter(
    raw: Record<string, unknown>,
    name: string,
    description: string
  ): AgentFrontmatter;

  /**
   * Check if an agent exists (by filename)
   */
  async agentExists(name: string): Promise<boolean> {
    try {
      const entries = await readdir(this.agentsPath, { withFileTypes: true });
      return entries.some(
        entry => entry.isFile() && entry.name === `${name}.md`
      );
    } catch {
      return false;
    }
  }
}
