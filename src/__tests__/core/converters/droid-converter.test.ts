import { test, expect, describe } from "bun:test";
import { DroidConverter } from "../../../core/converters/droid-converter.js";
import type { CommandConfig } from "../../../types/index.js";

describe("DroidConverter", () => {
  const converter = new DroidConverter();

  const sampleClaudeCommand: CommandConfig = {
    name: "test-command",
    description: "Test description",
    content: "Test content here",
    frontmatter: {
      description: "Test description",
      "argument-hint": "Enter value",
    },
    sourcePath: "/path/to/claude/test-command.md",
  };

  test("should convert Claude command to Droid format", () => {
    const droidCommand = converter.toDroid(sampleClaudeCommand);

    expect(droidCommand.name).toBe("test-command");
    expect(droidCommand.description).toBe("Test description");
    expect(droidCommand.content).toBe("Test content here");
    expect(droidCommand.frontmatter.description).toBe("Test description");
  });

  test("should convert Droid command from Droid format", () => {
    const droidCommand: CommandConfig = {
      name: "droid-cmd",
      description: "Droid description",
      content: "Droid content",
      frontmatter: {
        description: "Droid description",
      },
      sourcePath: "/path/to/droid/droid-cmd.md",
    };

    const claudeCommand = converter.fromDroid(droidCommand);

    expect(claudeCommand.name).toBe("droid-cmd");
    expect(claudeCommand.description).toBe("Droid description");
    expect(claudeCommand.content).toBe("Droid content");
  });

  test("should preserve sourcePath in conversion", () => {
    const droidCommand = converter.toDroid(sampleClaudeCommand);

    expect(droidCommand.sourcePath).toBe("/path/to/claude/test-command.md");
  });

  test("should handle empty frontmatter gracefully", () => {
    const commandWithEmptyFrontmatter: CommandConfig = {
      name: "empty-cmd",
      description: "Empty description",
      content: "Content",
      frontmatter: {},
      sourcePath: "/path/to/empty.md",
    };

    const droidCommand = converter.toDroid(commandWithEmptyFrontmatter);

    expect(droidCommand.name).toBe("empty-cmd");
    expect(droidCommand.frontmatter.description).toBe("Empty description");
  });

  test("should handle command with multiline content", () => {
    const commandWithMultiline: CommandConfig = {
      name: "multiline-cmd",
      description: "Multiline command",
      content: "Line 1\nLine 2\nLine 3",
      frontmatter: {
        description: "Multiline command",
      },
      sourcePath: "/path/to/multiline.md",
    };

    const droidCommand = converter.toDroid(commandWithMultiline);

    expect(droidCommand.content).toBe("Line 1\nLine 2\nLine 3");
  });

  test("should handle round-trip conversion", () => {
    const original = sampleClaudeCommand;
    const toDroid = converter.toDroid(original);
    const backToClaude = converter.fromDroid(toDroid);

    expect(backToClaude.name).toBe(original.name);
    expect(backToClaude.description).toBe(original.description);
    expect(backToClaude.content).toBe(original.content);
  });
});
