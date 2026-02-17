import type { CommandConfig } from "../../types/index.js";
import type { CopilotPromptConfig } from "../parsers/copilot.js";

export class CopilotConverter {
  /**
   * Convert a Claude/OpenCode command to Copilot format
   */
  toCopilot(command: CommandConfig): CopilotPromptConfig {
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

  /**
   * Convert a Copilot prompt back to Claude/OpenCode format
   */
  fromCopilot(copilotCommand: CopilotPromptConfig): CommandConfig {
    // Extract only the fields that Claude/OpenCode supports
    const { name, description, content, sourcePath, frontmatter } =
      copilotCommand;

    return {
      name,
      description,
      content,
      sourcePath,
      frontmatter: {
        description,
      },
    };
  }

  /**
   * Merge Copilot-specific settings into a command
   */
  mergeCopilotSettings(
    command: CommandConfig,
    settings: Partial<Pick<CopilotPromptConfig, "agent" | "model" | "tools">>,
  ): CopilotPromptConfig {
    return {
      ...this.toCopilot(command),
      ...settings,
    };
  }
}
