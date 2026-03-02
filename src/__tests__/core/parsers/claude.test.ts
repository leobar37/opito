import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { ClaudeParser } from "../../../core/parsers/claude.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("ClaudeParser", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-claude-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("should parse valid command file with frontmatter", async () => {
    const content = `---
description: Test command description
---

This is the command content
with multiple lines`;

    await writeFile(join(testDir, "test.md"), content);

    const parser = new ClaudeParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(1);
    expect(commands[0].name).toBe("test");
    expect(commands[0].description).toBe("Test command description");
    expect(commands[0].content).toBe("This is the command content\nwith multiple lines");
    expect(commands[0].frontmatter.description).toBe("Test command description");
  });

  test("should return empty array for directory without markdown files", async () => {
    const parser = new ClaudeParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(0);
  });

  test("should return empty array for non-existent directory", async () => {
    const parser = new ClaudeParser(join(testDir, "non-existent"));
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(0);
  });

  test("should skip files without frontmatter", async () => {
    await writeFile(join(testDir, "invalid.md"), "No frontmatter here");

    const parser = new ClaudeParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(0);
  });

  test("should skip files with empty content after frontmatter", async () => {
    const content = `---
description: Empty content
---
`;

    await writeFile(join(testDir, "empty.md"), content);

    const parser = new ClaudeParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(0);
  });

  test("should parse multiple command files", async () => {
    const content1 = `---
description: First command
---

Content of first command`;

    const content2 = `---
description: Second command
---

Content of second command`;

    await writeFile(join(testDir, "first.md"), content1);
    await writeFile(join(testDir, "second.md"), content2);

    const parser = new ClaudeParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(2);
    
    const names = commands.map(c => c.name).sort();
    expect(names).toEqual(["first", "second"]);
  });

  test("should handle frontmatter with additional fields", async () => {
    const content = `---
description: Test command
customField: custom value
anotherField: 123
---

Command content`;

    await writeFile(join(testDir, "custom.md"), content);

    const parser = new ClaudeParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(1);
    expect(commands[0].frontmatter.customField).toBe("custom value");
    expect(commands[0].frontmatter.anotherField).toBe(123);
  });

  test("should handle invalid YAML in frontmatter gracefully", async () => {
    const content = `---
invalid: yaml: content: :::
---

Command content`;

    await writeFile(join(testDir, "bad-yaml.md"), content);

    const parser = new ClaudeParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(1);
    expect(commands[0].name).toBe("bad-yaml");
    expect(commands[0].content).toBe("Command content");
  });

  test("should set sourcePath correctly", async () => {
    const content = `---
description: Test
---

Content`;

    await writeFile(join(testDir, "test.md"), content);

    const parser = new ClaudeParser(testDir);
    const commands = await parser.parseAll();

    expect(commands[0].sourcePath).toBe(join(testDir, "test.md"));
  });
});
