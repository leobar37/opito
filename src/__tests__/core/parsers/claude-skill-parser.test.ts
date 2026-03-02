import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { ClaudeSkillParser } from "../../../core/parsers/claude-skill-parser.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("ClaudeSkillParser", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-claude-skill-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("should parse valid skill with frontmatter", async () => {
    const skillDir = join(testDir, "test-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: test-skill
description: Test skill description
allowed-tools:
  - Read
  - Write
---

# Test Skill

This is the skill content
with multiple lines`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("test-skill");
    expect(skills[0].description).toBe("Test skill description");
    expect(skills[0].content).toBe("# Test Skill\n\nThis is the skill content\nwith multiple lines");
    expect(skills[0].frontmatter.allowedTools).toEqual(["Read", "Write"]);
  });

  test("should return empty array for directory without skills", async () => {
    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should return empty array for non-existent directory", async () => {
    const parser = new ClaudeSkillParser(join(testDir, "non-existent"));
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should skip directories without SKILL.md", async () => {
    const skillDir = join(testDir, "empty-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "README.md"), "Not a skill");

    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should skip skills without frontmatter", async () => {
    const skillDir = join(testDir, "invalid-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "No frontmatter here");

    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should skip skills without description", async () => {
    const skillDir = join(testDir, "no-desc-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: no-desc-skill
---

Content here`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should parse multiple skills", async () => {
    const skillDir1 = join(testDir, "skill-one");
    const skillDir2 = join(testDir, "skill-two");
    await mkdir(skillDir1, { recursive: true });
    await mkdir(skillDir2, { recursive: true });

    const content1 = `---
name: skill-one
description: First skill
---

First skill content`;

    const content2 = `---
name: skill-two
description: Second skill
---

Second skill content`;

    await writeFile(join(skillDir1, "SKILL.md"), content1);
    await writeFile(join(skillDir2, "SKILL.md"), content2);

    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(2);
    
    const names = skills.map(s => s.name).sort();
    expect(names).toEqual(["skill-one", "skill-two"]);
  });

  test("should use directory name if name not in frontmatter", async () => {
    const skillDir = join(testDir, "dir-name-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
description: Skill with no name field
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("dir-name-skill");
  });

  test("should handle skill without allowed-tools", async () => {
    const skillDir = join(testDir, "no-tools-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: no-tools-skill
description: Skill without tools
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].frontmatter.allowedTools).toBeUndefined();
  });

  test("should check if skill exists", async () => {
    const skillDir = join(testDir, "existing-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: existing-skill
description: Existing skill
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new ClaudeSkillParser(testDir);
    
    expect(await parser.skillExists("existing-skill")).toBe(true);
    expect(await parser.skillExists("non-existing")).toBe(false);
  });

  test("should set sourcePath correctly", async () => {
    const skillDir = join(testDir, "path-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: path-skill
description: Path test
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new ClaudeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills[0].sourcePath).toBe(join(skillDir, "SKILL.md"));
  });
});
