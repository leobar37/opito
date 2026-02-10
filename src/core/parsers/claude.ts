import YAML from 'yaml';
import type { CommandConfig, ParsedFrontmatter } from '../../types';
import { listMarkdownFiles, readFileContent } from '../../utils/fs';
import { join } from 'node:path';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export class ClaudeParser {
  private commandsPath: string;

  constructor(commandsPath: string) {
    this.commandsPath = commandsPath;
  }

  async parseAll(): Promise<CommandConfig[]> {
    const files = await listMarkdownFiles(this.commandsPath);
    const commands: CommandConfig[] = [];

    for (const file of files) {
      const filePath = join(this.commandsPath, file);
      const content = await readFileContent(filePath);
      const parsed = this.parseFile(content, file, filePath);
      if (parsed) {
        commands.push(parsed);
      }
    }

    return commands;
  }

  parseFile(content: string, filename: string, sourcePath: string): CommandConfig | null {
    const match = content.match(FRONTMATTER_REGEX);
    
    if (!match) {
      return null;
    }

    const frontmatterText = match[1];
    const bodyContent = match[2];

    let frontmatter: ParsedFrontmatter;
    try {
      frontmatter = YAML.parse(frontmatterText) || {};
    } catch {
      frontmatter = {};
    }

    const name = filename.replace('.md', '');
    const description = frontmatter.description || '';

    return {
      name,
      description,
      content: bodyContent.trim(),
      frontmatter,
      sourcePath,
    };
  }
}
