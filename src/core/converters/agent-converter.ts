/**
 * Agent converter for transforming agents between different provider formats
 *
 * MVP: Conservative mapping of common fields (name, description, content, model, tools)
 * Avoids risky conversions for unsupported metadata
 */
import YAML from 'yaml';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentConfig, AgentFrontmatter, AgentProvider } from '../../types/index.js';

export class AgentConverter {
  /**
   * Convert an agent from one provider format to another
   */
  convert(agent: AgentConfig, from: AgentProvider, to: AgentProvider): AgentConfig {
    const convertedFrontmatter = this.convertFrontmatter(agent.frontmatter, from, to);

    return {
      name: agent.name,
      description: agent.description,
      content: agent.content,
      frontmatter: convertedFrontmatter,
      sourcePath: agent.sourcePath,
    };
  }

  /**
   * Convert frontmatter between provider formats
   */
  private convertFrontmatter(
    frontmatter: AgentFrontmatter,
    from: AgentProvider,
    to: AgentProvider
  ): AgentFrontmatter {
    const base: AgentFrontmatter = {
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
    frontmatter: AgentFrontmatter,
    from: AgentProvider,
    base: AgentFrontmatter
  ): AgentFrontmatter {
    // Claude uses model and tools fields
    return {
      ...base,
      model: frontmatter.model,
      tools: frontmatter.tools,
    };
  }

  /**
   * Convert to Droid format
   */
  private toDroidFormat(
    frontmatter: AgentFrontmatter,
    from: AgentProvider,
    base: AgentFrontmatter
  ): AgentFrontmatter {
    // Droid uses model, tools, and invocation settings
    return {
      ...base,
      model: frontmatter.model,
      tools: frontmatter.tools,
    };
  }

  /**
   * Convert to OpenCode format
   */
  private toOpencodeFormat(
    frontmatter: AgentFrontmatter,
    from: AgentProvider,
    base: AgentFrontmatter
  ): AgentFrontmatter {
    // OpenCode uses model, tools, and compatibility metadata
    return {
      ...base,
      model: frontmatter.model,
      tools: frontmatter.tools,
      compatibility: frontmatter.compatibility ?? from,
      metadata: frontmatter.metadata ?? {
        source: from,
        converted: 'true',
      },
    };
  }

  /**
   * Write an agent to disk in the target provider format
   * All providers store agents as top-level .md files in the agents directory
   */
  async writeAgent(
    agent: AgentConfig,
    to: AgentProvider,
    agentsPath: string,
    _sourceAgentPath?: string,
  ): Promise<void> {
    const agentFile = join(agentsPath, `${agent.name}.md`);
    const content = this.serializeAgent(agent, to);

    await writeFile(agentFile, content);
  }

  /**
   * Serialize an agent to markdown with frontmatter
   */
  private serializeAgent(agent: AgentConfig, to: AgentProvider): string {
    const frontmatter: Record<string, unknown> = {
      name: agent.frontmatter.name,
      description: agent.frontmatter.description,
    };

    // Add common fields if they exist
    if (agent.frontmatter.model !== undefined) {
      frontmatter['model'] = agent.frontmatter.model;
    }
    if (agent.frontmatter.tools !== undefined) {
      frontmatter['tools'] = agent.frontmatter.tools;
    }

    // Add provider-specific fields
    switch (to) {
      case 'claude':
        // Claude uses standard format
        break;
      case 'droid':
        if (agent.frontmatter.userInvocable !== undefined) {
          frontmatter['user-invocable'] = agent.frontmatter.userInvocable;
        }
        if (agent.frontmatter.disableModelInvocation !== undefined) {
          frontmatter['disable-model-invocation'] = agent.frontmatter.disableModelInvocation;
        }
        break;
      case 'opencode':
        if (agent.frontmatter.license !== undefined) {
          frontmatter['license'] = agent.frontmatter.license;
        }
        if (agent.frontmatter.compatibility !== undefined) {
          frontmatter['compatibility'] = agent.frontmatter.compatibility;
        }
        if (agent.frontmatter.metadata !== undefined) {
          frontmatter['metadata'] = agent.frontmatter.metadata;
        }
        break;
    }

    return `---\n${YAML.stringify(frontmatter)}---\n\n${agent.content}\n`;
  }
}
