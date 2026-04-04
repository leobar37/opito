import type { CommandConfig } from '../types/index.js';

export class Converter {
  convert(claudeCommand: CommandConfig): CommandConfig {
    return {
      name: claudeCommand.name,
      description: claudeCommand.description,
      content: claudeCommand.content,
      frontmatter: {
        description: claudeCommand.description,
      },
      sourcePath: claudeCommand.sourcePath,
    };
  }
}
