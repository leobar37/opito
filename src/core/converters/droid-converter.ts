import type { CommandConfig } from "../../types/index.js";

export class DroidConverter {
  toDroid(command: CommandConfig): CommandConfig {
    return {
      name: command.name,
      description: command.description,
      content: command.content,
      frontmatter: {
        description: command.description,
      },
      sourcePath: command.sourcePath,
    };
  }

  fromDroid(droidCommand: CommandConfig): CommandConfig {
    return {
      name: droidCommand.name,
      description: droidCommand.description,
      content: droidCommand.content,
      frontmatter: {
        description: droidCommand.description,
      },
      sourcePath: droidCommand.sourcePath,
    };
  }
}
