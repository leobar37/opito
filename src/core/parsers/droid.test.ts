import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { DroidParser } from "./droid.js";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("DroidParser", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-droid-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

    const parser = new DroidParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(1);
    expect(commands[0].name).toBe("test");
    expect(commands[0].description).toBe("Test command description");
    expect(commands[0].content).toBe("This is the command content\nwith multiple lines");
  });

  test("should write command to file", async () => {
    const parser = new DroidParser(testDir);
    
    const command = {
      name: "test-command",
      description: "Test description",
      content: "Test content",
      frontmatter: { description: "Test description" },
      sourcePath: join(testDir, "test-command.md"),
    };

    await parser.writeCommand(command);

    const filePath = join(testDir, "test-command.md");
    const fileContent = await readFile(filePath, "utf-8");

    expect(fileContent).toContain("---");
    expect(fileContent).toContain("description: Test description");
    expect(fileContent).toContain("Test content");
  });

  test("should check if command exists", async () => {
    await writeFile(join(testDir, "existing.md"), "---\ndescription: Test\n---\n\nContent");

    const parser = new DroidParser(testDir);
    
    expect(await parser.commandExists("existing")).toBe(true);
    expect(await parser.commandExists("non-existing")).toBe(false);
  });

  test("should write command with argument-hint in frontmatter", async () => {
    const parser = new DroidParser(testDir);
    
    const command = {
      name: "test-command",
      description: "Test description",
      content: "Test content",
      frontmatter: { 
        description: "Test description",
        "argument-hint": "Enter your name",
      },
      sourcePath: join(testDir, "test-command.md"),
    };

    await parser.writeCommand(command);

    const filePath = join(testDir, "test-command.md");
    const fileContent = await readFile(filePath, "utf-8");

    expect(fileContent).toContain("argument-hint: Enter your name");
  });

  test("should return empty array for directory without markdown files", async () => {
    const parser = new DroidParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(0);
  });

  test("should skip files without frontmatter", async () => {
    await writeFile(join(testDir, "invalid.md"), "No frontmatter here");

    const parser = new DroidParser(testDir);
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

    const parser = new DroidParser(testDir);
    const commands = await parser.parseAll();

    expect(commands).toHaveLength(2);
    
    const names = commands.map(c => c.name).sort();
    expect(names).toEqual(["first", "second"]);
  });
});
