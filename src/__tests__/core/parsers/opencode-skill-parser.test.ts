import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { OpencodeSkillParser } from "../../../core/parsers/opencode-skill-parser.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("OpencodeSkillParser", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-opencode-skill-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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
license: MIT
compatibility: opencode
metadata:
  author: test
  version: "1.0"
---

# Test Skill

This is the skill content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new OpencodeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("test-skill");
    expect(skills[0].description).toBe("Test skill description");
    expect(skills[0].frontmatter.license).toBe("MIT");
    expect(skills[0].frontmatter.compatibility).toBe("opencode");
    expect(skills[0].frontmatter.metadata).toEqual({ author: "test", version: "1.0" });
  });

  test("should parse skill with minimal frontmatter", async () => {
    const skillDir = join(testDir, "minimal-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: minimal-skill
description: Minimal skill
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new OpencodeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].frontmatter.license).toBeUndefined();
    expect(skills[0].frontmatter.compatibility).toBeUndefined();
    expect(skills[0].frontmatter.metadata).toBeUndefined();
  });

  test("should return empty array for directory without skills", async () => {
    const parser = new OpencodeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should skip directories without SKILL.md", async () => {
    const skillDir = join(testDir, "empty-skill");
    await mkdir(skillDir, { recursive: true });

    const parser = new OpencodeSkillParser(testDir);
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

    const parser = new OpencodeSkillParser(testDir);
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
license: MIT
---

First content`;

    const content2 = `---
name: skill-two
description: Second skill
license: Apache-2.0
metadata:
  category: dev
---

Second content`;

    await writeFile(join(skillDir1, "SKILL.md"), content1);
    await writeFile(join(skillDir2, "SKILL.md"), content2);

    const parser = new OpencodeSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(2);
    
    const skill1 = skills.find(s => s.name === "skill-one");
    const skill2 = skills.find(s => s.name === "skill-two");
    
    expect(skill1?.frontmatter.license).toBe("MIT");
    expect(skill2?.frontmatter.license).toBe("Apache-2.0");
    expect(skill2?.frontmatter.metadata).toEqual({ category: "dev" });
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

    const parser = new OpencodeSkillParser(testDir);
    
    expect(await parser.skillExists("existing-skill")).toBe(true);
    expect(await parser.skillExists("non-existing")).toBe(false);
  });
});
