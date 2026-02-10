import YAML from 'yaml';
import type { CommandConfig } from '../../types/index.js';
import { listMarkdownFiles, readFileContent, writeFileContent, ensureDir } from '../../utils/fs.js';
import { join } from 'node:path';
import { logger } from '../../utils/logger.js';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export interface CopilotPromptConfig extends CommandConfig {
  agent?: string;
  model?: string;
  tools?: string[];
  argumentHint?: string;
}

export class CopilotParser {
  private promptsPath: string;
  private instructionsPath: string;
  private agentsPath: string;

  constructor(promptsPath: string, instructionsPath: string, agentsPath: string) {
    this.promptsPath = promptsPath;
    this.instructionsPath = instructionsPath;
    this.agentsPath = agentsPath;
  }

  async parseAll(): Promise<CopilotPromptConfig[]> {
    const commands: CopilotPromptConfig[] = [];
    
    // Parse prompt files (.prompt.md)
    const prompts = await this.parsePrompts();
    commands.push(...prompts);
    
    // Parse instruction files (.instructions.md)
    const instructions = await this.parseInstructions();
    commands.push(...instructions);
    
    // Parse agent files (.agent.md)
    const agents = await this.parseAgents();
    commands.push(...agents);
    
    return commands;
  }

  async parsePrompts(): Promise<CopilotPromptConfig[]> {
    try {
      const files = await listMarkdownFiles(this.promptsPath);
      const commands: CopilotPromptConfig[] = [];

      for (const file of files) {
        if (!file.endsWith('.prompt.md')) continue;
        
        const filePath = join(this.promptsPath, file);
        const content = await readFileContent(filePath);
        const parsed = this.parseFile(content, file, filePath, 'prompt');
        if (parsed) {
          commands.push(parsed);
        }
      }

      return commands;
    } catch {
      return [];
    }
  }

  async parseInstructions(): Promise<CopilotPromptConfig[]> {
    try {
      const files = await listMarkdownFiles(this.instructionsPath);
      const commands: CopilotPromptConfig[] = [];

      for (const file of files) {
        if (!file.endsWith('.instructions.md')) continue;
        
        const filePath = join(this.instructionsPath, file);
        const content = await readFileContent(filePath);
        const parsed = this.parseFile(content, file, filePath, 'instruction');
        if (parsed) {
          commands.push(parsed);
        }
      }

      return commands;
    } catch {
      return [];
    }
  }

  async parseAgents(): Promise<CopilotPromptConfig[]> {
    try {
      const files = await listMarkdownFiles(this.agentsPath);
      const commands: CopilotPromptConfig[] = [];

      for (const file of files) {
        if (!file.endsWith('.agent.md')) continue;
        
        const filePath = join(this.agentsPath, file);
        const content = await readFileContent(filePath);
        const parsed = this.parseFile(content, file, filePath, 'agent');
        if (parsed) {
          commands.push(parsed);
        }
      }

      return commands;
    } catch {
      return [];
    }
  }

  parseFile(
    content: string, 
    filename: string, 
    sourcePath: string,
    type: 'prompt' | 'instruction' | 'agent'
  ): CopilotPromptConfig | null {
    const match = content.match(FRONTMATTER_REGEX);
    
    if (!match) {
      return null;
    }

    const frontmatterText = match[1] ?? '';
    const bodyContent = match[2];

    let frontmatter: Record<string, unknown>;
    try {
      frontmatter = YAML.parse(frontmatterText) || {};
    } catch {
      frontmatter = {};
    }

    // Extract name from filename (remove extension)
    let name = filename;
    if (type === 'prompt' && filename.endsWith('.prompt.md')) {
      name = filename.replace('.prompt.md', '');
    } else if (type === 'instruction' && filename.endsWith('.instructions.md')) {
      name = filename.replace('.instructions.md', '');
    } else if (type === 'agent' && filename.endsWith('.agent.md')) {
      name = filename.replace('.agent.md', '');
    }

    const description = String(frontmatter.description || '');

    if (!bodyContent) {
      return null;
    }

    return {
      name,
      description,
      content: bodyContent.trim(),
      frontmatter,
      sourcePath,
      agent: frontmatter.agent as string | undefined,
      model: frontmatter.model as string | undefined,
      tools: frontmatter.tools as string[] | undefined,
      argumentHint: frontmatter['argument-hint'] as string | undefined,
    };
  }

  async writePrompt(command: CopilotPromptConfig): Promise<void> {
    await ensureDir(this.promptsPath);
    
    const filePath = join(this.promptsPath, `${command.name}.prompt.md`);
    
    const frontmatter: Record<string, unknown> = {
      description: command.description,
    };

    if (command.agent) {
      frontmatter.agent = command.agent;
    }
    if (command.model) {
      frontmatter.model = command.model;
    }
    if (command.tools && command.tools.length > 0) {
      frontmatter.tools = command.tools;
    }
    if (command.argumentHint) {
      frontmatter['argument-hint'] = command.argumentHint;
    }

    const content = `---\n${YAML.stringify(frontmatter)}---\n\n${command.content}\n`;
    
    await writeFileContent(filePath, content);
    logger.success(`Created Copilot prompt: ${command.name}`);
  }

  async writeInstruction(command: CopilotPromptConfig): Promise<void> {
    await ensureDir(this.instructionsPath);
    
    const filePath = join(this.instructionsPath, `${command.name}.instructions.md`);
    
    const frontmatter: Record<string, unknown> = {
      description: command.description,
    };

    if (command.agent) {
      frontmatter.agent = command.agent;
    }

    const content = `---\n${YAML.stringify(frontmatter)}---\n\n${command.content}\n`;
    
    await writeFileContent(filePath, content);
    logger.success(`Created Copilot instruction: ${command.name}`);
  }

  async writeAgent(command: CopilotPromptConfig): Promise<void> {
    await ensureDir(this.agentsPath);
    
    const filePath = join(this.agentsPath, `${command.name}.agent.md`);
    
    const frontmatter: Record<string, unknown> = {
      description: command.description,
    };

    if (command.agent) {
      frontmatter.agent = command.agent;
    }
    if (command.model) {
      frontmatter.model = command.model;
    }
    if (command.tools && command.tools.length > 0) {
      frontmatter.tools = command.tools;
    }

    const content = `---\n${YAML.stringify(frontmatter)}---\n\n${command.content}\n`;
    
    await writeFileContent(filePath, content);
    logger.success(`Created Copilot agent: ${command.name}`);
  }

  async promptExists(name: string): Promise<boolean> {
    try {
      const files = await listMarkdownFiles(this.promptsPath);
      return files.includes(`${name}.prompt.md`);
    } catch {
      return false;
    }
  }

  async instructionExists(name: string): Promise<boolean> {
    try {
      const files = await listMarkdownFiles(this.instructionsPath);
      return files.includes(`${name}.instructions.md`);
    } catch {
      return false;
    }
  }

  async agentExists(name: string): Promise<boolean> {
    try {
      const files = await listMarkdownFiles(this.agentsPath);
      return files.includes(`${name}.agent.md`);
    } catch {
      return false;
    }
  }
}
